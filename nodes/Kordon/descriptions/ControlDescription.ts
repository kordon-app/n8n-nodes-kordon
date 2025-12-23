import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

export const controlOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['control'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single control',
			action: 'Get a control',
			routing: {
				request: {
					method: 'GET',
					url: '=/controls/{{$parameter.controlId}}',
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
			description: 'Get a list of controls',
			action: 'Get many controls',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'kind');
							handleArrayParameter(requestOptions, 'state');
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
					url: '/controls',
					returnFullResponse: true,
					qs: {
						'kind[]': '={{$parameter.options.kind}}',
						'state[]': '={{$parameter.options.state}}',
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
			name: 'Create',
			value: 'create',
			description: 'Create a new control',
			action: 'Create a control',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const body = requestOptions.body as any;
							
							// Handle label_ids if present
							if (body.control && body.control.label_ids) {
								if (typeof body.control.label_ids === 'string') {
									body.control.label_ids = (body.control.label_ids as string).split(',').map((id: string) => id.trim());
								} else if (!Array.isArray(body.control.label_ids)) {
									body.control.label_ids = [body.control.label_ids];
								}
							}

							// Log request details for debugging
							this.logger.info('=== Kordon API Request (Create Control) ===');
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
					url: '/controls',
					body: {
						control: {
							title: '={{$parameter.title}}',
							owner_id: '={{$parameter.ownerId}}',
							kind: '={{$parameter.kind}}',
							begins_at: '={{$parameter.beginsAt}}',
							description: '={{$parameter.additionalFields.description}}',
							label_ids: '={{$parameter.additionalFields.labels}}',
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
			name: 'Update',
			value: 'update',
			description: 'Update an existing control',
			action: 'Update a control',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							const control: { [key: string]: any } = {};

							// Map UI fields to API fields
							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									const labels = updateFields[key];
									if (typeof labels === 'string') {
										control['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										control['label_ids'] = labels;
									} else {
										control['label_ids'] = [labels];
									}
								} else if (key === 'ownerId') {
									control['owner_id'] = updateFields[key];
								} else if (key === 'beginsAt') {
									control['begins_at'] = updateFields[key];
								} else {
									control[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								control: control,
							};

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Control Request ===');
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
					url: '=/controls/{{$parameter.controlId}}',
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							// Log response details for debugging
							this.logger.info('=== Kordon API Update Control Response ===');
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
			description: 'Delete a control',
			action: 'Delete a control',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/controls/{{$parameter.controlId}}',
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

export const controlFields: INodeProperties[] = [
	// ------------------------
	// Control: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Control ID',
		name: 'controlId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the control to retrieve or delete',
	},

	// ------------------------
	// Control: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['control'],
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
				resource: ['control'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'multiOptions',
				options: [
					{
						name: 'Policy',
						value: 'policy',
					},
					{
						name: 'Procedure',
						value: 'procedure',
					},
					{
						name: 'Technical',
						value: 'technical',
					},
				],
				default: [],
				description: 'Filter controls by type',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'multiOptions',
				options: [
					{
						name: 'Not Implemented',
						value: 'not_implemented',
					},
					{
						name: 'Failing',
						value: 'failing',
					},
					{
						name: 'Implemented',
						value: 'implemented',
					},
				],
				default: [],
				description: 'Filter controls by implementation state',
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
				description: 'Filter by label IDs. Use "none" for items without labels.',
			},
		],
	},

	// ------------------------
	// Control: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the control',
	},
	{
		displayName: 'Owner ID',
		name: 'ownerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user who owns the control',
	},
	{
		displayName: 'Kind',
		name: 'kind',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Policy',
				value: 'policy',
			},
			{
				name: 'Procedure',
				value: 'procedure',
			},
			{
				name: 'Technical',
				value: 'technical',
			},
		],
		default: 'policy',
		description: 'The type of control',
	},
	{
		displayName: 'Begins At',
		name: 'beginsAt',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Date when the control begins',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the control (HTML supported)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the control',
				typeOptions: {
					multipleValues: true,
				},
			},
		],
	},

	// ------------------------
	// Control: Update - Fields
	// ------------------------
	{
		displayName: 'Control ID',
		name: 'controlId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['update'],
			},
		},
		default: '',
		description: 'The ID of the control to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the control',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who owns the control',
			},
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				options: [
					{
						name: 'Policy',
						value: 'policy',
					},
					{
						name: 'Procedure',
						value: 'procedure',
					},
					{
						name: 'Technical',
						value: 'technical',
					},
				],
				default: 'policy',
				description: 'The type of control',
			},
			{
				displayName: 'Begins At',
				name: 'beginsAt',
				type: 'dateTime',
				default: '',
				description: 'Date when the control begins',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the control (HTML supported)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the control',
				typeOptions: {
					multipleValues: true,
				},
			},
		],
	},
];
