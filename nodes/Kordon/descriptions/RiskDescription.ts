import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

/**
 * Risk resource operations for Kordon node
 */

export const riskOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['risk'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single risk',
			action: 'Get a risk',
			routing: {
				request: {
					method: 'GET',
					url: '=/risks/{{$parameter.riskId}}',
				},
				output: {
					postReceive: [
						{
							type: 'rootProperty',
							properties: {
								property: 'data',
							},
						},
					],
				},
			},
		},
		{
			name: 'Get Many',
			value: 'getMany',
			description: 'Get a list of risks',
			action: 'Get many risks',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'state');
							handleArrayParameter(requestOptions, 'owner');
							handleArrayParameter(requestOptions, 'manager');
							handleArrayParameter(requestOptions, 'labels');
							handleArrayParameter(requestOptions, 'impact');
							handleArrayParameter(requestOptions, 'probability');
							// Log request details for debugging
							this.logger.info('=== Kordon API Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Query Params: ' + JSON.stringify(requestOptions.qs));
							this.logger.info('========================');
							return requestOptions;
						},
					],
				},
				request: {
					method: 'GET',
					url: '/risks',
					returnFullResponse: true,
					qs: {
						'state[]': '={{$parameter.options.state}}',
						'owner[]': '={{$parameter.options.owner}}',
						'manager[]': '={{$parameter.options.manager}}',
						'labels[]': '={{$parameter.options.labels}}',
						'impact[]': '={{$parameter.options.impact}}',
						'probability[]': '={{$parameter.options.probability}}',
					},
				},
				output: {
					postReceive: [
						{
							type: 'rootProperty',
							properties: {
								property: 'data',
							},
						},
					],
				},
			},
		},
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new risk',
			action: 'Create a risk',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Build the body from evaluated parameters to ensure expressions are resolved
							const title = this.getNodeParameter('title') as string;
							const managerId = this.getNodeParameter('managerId') as string;
							const ownerId = this.getNodeParameter('ownerId') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const risk: { [key: string]: any } = {
								title: title,
								manager_id: managerId,
								owner_id: ownerId,
							};

							// Add optional fields if provided
							if (additionalFields.impact !== undefined && additionalFields.impact !== '') {
								risk.impact = additionalFields.impact;
							}
							if (additionalFields.probability !== undefined && additionalFields.probability !== '') {
								risk.probability = additionalFields.probability;
							}
							if (additionalFields.description !== undefined && additionalFields.description !== '') {
								risk.description = additionalFields.description;
							}

							// Handle labels - convert to array if needed
							if (additionalFields.labels !== undefined && additionalFields.labels !== '') {
								const labels = additionalFields.labels;
								if (typeof labels === 'string') {
									risk.label_ids = labels.split(',').map((id: string) => id.trim());
								} else if (Array.isArray(labels)) {
									risk.label_ids = labels;
								} else {
									risk.label_ids = [labels];
								}
							}

							requestOptions.body = { risk: risk };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/risks',
				},
				output: {
					postReceive: [
						{
							type: 'rootProperty',
							properties: {
								property: 'data',
							},
						},
					],
				},
			},
		},
		{
			name: 'Update',
			value: 'update',
			description: 'Update an existing risk',
			action: 'Update a risk',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const risk: { [key: string]: any } = {};

							// Map UI fields to API fields
							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									const labels = updateFields[key];
									if (typeof labels === 'string') {
										risk['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										risk['label_ids'] = labels;
									} else {
										risk['label_ids'] = [labels];
									}
								} else if (key === 'managerId') {
									risk['manager_id'] = updateFields[key];
								} else if (key === 'ownerId') {
									risk['owner_id'] = updateFields[key];
								} else {
									risk[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								risk: risk,
							};

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Risk Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('=======================================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/risks/{{$parameter.riskId}}',
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							// Log response details for debugging
							this.logger.info('=== Kordon API Update Risk Response ===');
							this.logger.info('Status Code: ' + response.statusCode);
							this.logger.info('Response Body: ' + JSON.stringify(response.body));
							this.logger.info('========================================');
							return items;
						},
						{
							type: 'rootProperty',
							properties: {
								property: 'data',
							},
						},
					],
				},
			},
		},
		{
			name: 'Delete',
			value: 'delete',
			description: 'Delete a risk',
			action: 'Delete a risk',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/risks/{{$parameter.riskId}}',
				},
				output: {
					postReceive: [
						{
							type: 'rootProperty',
							properties: {
								property: 'data',
							},
						},
					],
				},
			},
		},
	],
	default: 'getMany',
};

export const riskFields: INodeProperties[] = [
	// ------------------------
	// Risk: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the risk',
	},
	{
		displayName: 'Manager ID',
		name: 'managerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user managing the risk',
	},
	{
		displayName: 'Owner ID',
		name: 'ownerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user owning the risk',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Impact',
				name: 'impact',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 5,
				},
				default: 1,
				description: 'Risk impact (1-5)',
			},
			{
				displayName: 'Probability',
				name: 'probability',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 5,
				},
				default: 1,
				description: 'Risk probability (1-5)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the risk',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the risk',
				typeOptions: {
					multipleValues: true,
				},
			},
		],
	},

	// ------------------------
	// Risk: Update - Fields
	// ------------------------
	{
		displayName: 'Risk ID',
		name: 'riskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['update'],
			},
		},
		default: '',
		description: 'The ID of the risk to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the risk',
			},
			{
				displayName: 'Impact',
				name: 'impact',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 5,
				},
				default: 1,
				description: 'Risk impact (1-5)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the risk',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Manager ID',
				name: 'managerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who manages the risk',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who owns the risk',
			},
			{
				displayName: 'Probability',
				name: 'probability',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 5,
				},
				default: 1,
				description: 'Risk probability (1-5)',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the risk',
			},
		],
	},

	// ------------------------
	// Risk: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Risk ID',
		name: 'riskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the risk to retrieve or delete',
	},

	// ------------------------
	// Risk: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['getMany'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
		routing: paginationRouting,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Impact',
				name: 'impact',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add impact level (0-10)',
				description: 'Filter by impact levels (0-10)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add label ID or "none"',
				description: 'Filter by label IDs. Use "none" for items without labels.',
			},
			{
				displayName: 'Manager ID(s)',
				name: 'manager',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add manager ID',
				description: 'Filter by manager IDs',
			},
			{
				displayName: 'Owner ID(s)',
				name: 'owner',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add owner ID',
				description: 'Filter by owner IDs',
			},
			{
				displayName: 'Probability',
				name: 'probability',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add probability level (0-10)',
				description: 'Filter by probability levels (0-10)',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'multiOptions',
				options: [
					{
						name: 'Acceptable',
						value: 'acceptable',
					},
					{
						name: 'Needs Mitigation',
						value: 'not_mitigated',
					},
				],
				default: [],
				description: 'Filter risks by state',
			},
		],
	},
];
