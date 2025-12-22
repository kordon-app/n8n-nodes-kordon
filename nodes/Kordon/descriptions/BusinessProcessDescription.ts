import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

export const businessProcessOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['business_process'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new business process',
			action: 'Create a business process',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const body = requestOptions.body as any;
							
							// Handle label_ids if present
							if (body.business_process && body.business_process.label_ids) {
								if (typeof body.business_process.label_ids === 'string') {
									body.business_process.label_ids = (body.business_process.label_ids as string).split(',').map((id: string) => id.trim());
								} else if (!Array.isArray(body.business_process.label_ids)) {
									body.business_process.label_ids = [body.business_process.label_ids];
								}
							}

							// Log request details for debugging
							this.logger.info('=== Kordon API Request (Create Business Process) ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('========================');
							
							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/business-processes',
					body: {
						business_process: {
							title: '={{$parameter.title}}',
							owner_id: '={{$parameter.owner_id}}',
							criticality: '={{$parameter.additionalFields.criticality}}',
							monetary_value: '={{$parameter.additionalFields.monetary_value}}',
							currency: '={{$parameter.additionalFields.currency}}',
							label_ids: '={{$parameter.additionalFields.labels}}',
							description: '={{$parameter.additionalFields.description}}',
						},
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
			name: 'Get',
			value: 'get',
			description: 'Get a single business process',
			action: 'Get a business process',
			routing: {
				request: {
					method: 'GET',
					url: '=/business-processes/{{$parameter.businessProcessId}}',
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
			description: 'Get many business processes',
			action: 'Get many business processes',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'criticality');
							handleArrayParameter(requestOptions, 'owner');
							handleArrayParameter(requestOptions, 'labels');

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
					url: '/business-processes',
					returnFullResponse: true,
					qs: {
						'criticality[]': '={{$parameter.options.criticality}}',
						'owner[]': '={{$parameter.options.owner}}',
						'labels[]': '={{$parameter.options.labels}}',
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
			name: 'Update',
			value: 'update',
			description: 'Update an existing business process',
			action: 'Update a business process',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							const businessProcess: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									let labels = updateFields[key];
									if (typeof labels === 'string') {
										businessProcess['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										businessProcess['label_ids'] = labels;
									} else {
										businessProcess['label_ids'] = [labels];
									}
								} else if (key === 'ownerId') {
									businessProcess['owner_id'] = updateFields[key];
								} else {
									businessProcess[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								business_process: businessProcess,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/business-processes/{{$parameter.businessProcessId}}',
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
			name: 'Delete',
			value: 'delete',
			description: 'Delete a business process',
			action: 'Delete a business process',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/business-processes/{{$parameter.businessProcessId}}',
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

export const businessProcessFields: INodeProperties[] = [
	// ------------------------
	// Business Process: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Business Process ID',
		name: 'businessProcessId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the business process to retrieve or delete',
	},

	// ------------------------
	// Business Process: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['getMany'],
			},
		},
		default: true,
		description: 'Whether to return all results or use pagination',
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
				resource: ['business_process'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Criticality',
				name: 'criticality',
				type: 'multiOptions',
				options: [
					{
						name: 'High',
						value: 'high',
					},
					{
						name: 'Medium',
						value: 'medium',
					},
					{
						name: 'Low',
						value: 'low',
					},
				],
				default: [],
				description: 'Filter business processes by criticality level',
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
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add label ID or "none"',
				description: 'Filter by label IDs. Use "none" for items without labels',
			},
		],
	},

	// ------------------------
	// Business Process: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the business process',
	},
	{
		displayName: 'Owner ID',
		name: 'owner_id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the owner',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Criticality',
				name: 'criticality',
				type: 'options',
				options: [
					{
						name: 'Low',
						value: 'low',
					},
					{
						name: 'Medium',
						value: 'medium',
					},
					{
						name: 'High',
						value: 'high',
					},
				],
				default: 'low',
				description: 'The criticality of the business process',
			},
			{
				displayName: 'Monetary Value',
				name: 'monetary_value',
				type: 'number',
				default: 0,
				description: 'The monetary value of the business process',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{
						name: 'USD',
						value: 'USD',
					},
					{
						name: 'EUR',
						value: 'EUR',
					},
					{
						name: 'GBP',
						value: 'GBP',
					},
					{
						name: 'JPY',
						value: 'JPY',
					},
					{
						name: 'CAD',
						value: 'CAD',
					},
					{
						name: 'AUD',
						value: 'AUD',
					},
				],
				default: 'USD',
				description: 'The currency of the monetary value',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the business process',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The description of the business process',
			},
		],
	},

	// ------------------------
	// Business Process: Update - Fields
	// ------------------------
	{
		displayName: 'Business Process ID',
		name: 'businessProcessId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['update'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the business process to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the business process',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'The ID of the owner',
			},
			{
				displayName: 'Criticality',
				name: 'criticality',
				type: 'options',
				options: [
					{
						name: 'Low',
						value: 'low',
					},
					{
						name: 'Medium',
						value: 'medium',
					},
					{
						name: 'High',
						value: 'high',
					},
				],
				default: 'low',
				description: 'The criticality of the business process',
			},
			{
				displayName: 'Monetary Value',
				name: 'monetary_value',
				type: 'number',
				default: 0,
				description: 'The monetary value of the business process',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{
						name: 'USD',
						value: 'USD',
					},
					{
						name: 'EUR',
						value: 'EUR',
					},
					{
						name: 'GBP',
						value: 'GBP',
					},
					{
						name: 'JPY',
						value: 'JPY',
					},
					{
						name: 'CAD',
						value: 'CAD',
					},
					{
						name: 'AUD',
						value: 'AUD',
					},
				],
				default: 'USD',
				description: 'The currency of the monetary value',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the business process',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The description of the business process',
			},
		],
	},
];
