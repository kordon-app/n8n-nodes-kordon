import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

export const assetOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['asset'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single asset',
			action: 'Get an asset',
			routing: {
				request: {
					method: 'GET',
					url: '=/assets/{{$parameter.assetId}}',
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
			description: 'Get many assets',
			action: 'Get many assets',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'state');
							handleArrayParameter(requestOptions, 'asset_value');
							handleArrayParameter(requestOptions, 'health');
							handleArrayParameter(requestOptions, 'owner');
							handleArrayParameter(requestOptions, 'manager');
							handleArrayParameter(requestOptions, 'labels');

							// Log request details for debugging
							this.logger.info('=== Kordon API Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Query Params: ' + JSON.stringify(requestOptions.qs));
							this.logger.info('Headers: ' + JSON.stringify(requestOptions.headers));
							this.logger.info('========================');
							return requestOptions;
						},
					],
				},
				request: {
					method: 'GET',
					url: '/assets',
					returnFullResponse: true,
					qs: {
						'state[]': '={{$parameter.options.state}}',
						'asset_value[]': '={{$parameter.options.asset_value}}',
						'health[]': '={{$parameter.options.health}}',
						'owner[]': '={{$parameter.options.owner}}',
						'manager[]': '={{$parameter.options.manager}}',
						'labels[]': '={{$parameter.options.labels}}'
					},
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							// Log response details for debugging
							this.logger.info('=== Kordon API Response ===');
							this.logger.info('Status Code: ' + response.statusCode);
							this.logger.info('Response Body Type: ' + typeof response.body);
							
							const body = response.body as any;
							if (body) {
								this.logger.info('Has data property: ' + (!!body.data));
								this.logger.info('Data length: ' + (body.data ? body.data.length : 'N/A'));
								this.logger.info('Has meta property: ' + (!!body.meta));
								if (body.meta) {
									this.logger.info('Meta: ' + JSON.stringify(body.meta));
								}
							}
							this.logger.info('Items received: ' + items.length);
							this.logger.info('========================');
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
			name: 'Create',
			value: 'create',
			description: 'Create a new asset',
			action: 'Create an asset',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters for label_ids
							const body = requestOptions.body as any;
							if (body && body.asset && body.asset.label_ids) {
								if (typeof body.asset.label_ids === 'string') {
									body.asset.label_ids = body.asset.label_ids.split(',').map((id: string) => id.trim());
								} else if (!Array.isArray(body.asset.label_ids)) {
									body.asset.label_ids = [body.asset.label_ids];
								}
							}
							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/assets',
					body: {
						asset: {
							title: '={{$parameter.title}}',
							manager_id: '={{$parameter.managerId}}',
							owner_id: '={{$parameter.ownerId}}',
							description: '={{$parameter.description}}',
							asset_value: '={{$parameter.assetValue}}',
							state: '={{$parameter.additionalFields.state}}',
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
			description: 'Update an existing asset',
			action: 'Update an asset',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', 0) as { [key: string]: any };
							const asset: { [key: string]: any } = {};

							// Map UI fields to API fields
							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									let labels = updateFields[key];
									if (typeof labels === 'string') {
										asset['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										asset['label_ids'] = labels;
									} else {
										asset['label_ids'] = [labels];
									}
								} else if (key === 'managerId') {
									asset['manager_id'] = updateFields[key];
								} else if (key === 'ownerId') {
									asset['owner_id'] = updateFields[key];
								} else if (key === 'assetValue') {
									asset['asset_value'] = updateFields[key];
								} else {
									asset[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								asset: asset,
							};

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Asset Request ===');
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
					url: '=/assets/{{$parameter.assetId}}',
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							// Log response details for debugging
							this.logger.info('=== Kordon API Update Asset Response ===');
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
			description: 'Delete an asset',
			action: 'Delete an asset',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/assets/{{$parameter.assetId}}',
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

export const assetFields: INodeProperties[] = [
	// ------------------------
	// Asset: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Asset ID',
		name: 'assetId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the asset to retrieve or delete',
	},

	// ------------------------
	// Asset: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['asset'],
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
				resource: ['asset'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'State',
				name: 'state',
				type: 'multiOptions',
				options: [
					{
						name: 'Live',
						value: 'live',
					},
					{
						name: 'Planned',
						value: 'planned',
					},
					{
						name: 'Deprecated',
						value: 'deprecated',
					},
				],
				default: [],
				description: 'Filter assets by state',
			},
			{
				displayName: 'Asset Value',
				name: 'asset_value',
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
				description: 'Filter assets by value',
			},
			{
				displayName: 'Health',
				name: 'health',
				type: 'multiOptions',
				options: [
					{
						name: 'With Failing Controls',
						value: 'with_failing_controls',
					},
					{
						name: 'With No Controls',
						value: 'with_no_controls',
					},
					{
						name: 'With Unmitigated Risks',
						value: 'with_unmitigated_risks',
					},
				],
				default: [],
				description: 'Filter assets by health status',
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
	// Asset: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the asset',
	},
	{
		displayName: 'Manager ID',
		name: 'managerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user who manages the asset',
	},
	{
		displayName: 'Owner ID',
		name: 'ownerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user who owns the asset',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Detailed description of the asset (HTML supported)',
	},
	{
		displayName: 'Asset Value',
		name: 'assetValue',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['create'],
			},
		},
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
		description: 'The value of the asset',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{
						name: 'Live',
						value: 'live',
					},
					{
						name: 'Planned',
						value: 'planned',
					},
					{
						name: 'Deprecated',
						value: 'deprecated',
					},
				],
				default: 'live',
				description: 'The state of the asset',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the asset',
				typeOptions: {
					multipleValues: true,
				},
			},
		],
	},

	// ------------------------
	// Asset: Update - Fields
	// ------------------------
	{
		displayName: 'Asset ID',
		name: 'assetId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['update'],
			},
		},
		default: '',
		description: 'The ID of the asset to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the asset',
			},
			{
				displayName: 'Manager ID',
				name: 'managerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who manages the asset',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who owns the asset',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the asset (HTML supported)',
			},
			{
				displayName: 'Asset Value',
				name: 'assetValue',
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
				description: 'The value of the asset',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{
						name: 'Live',
						value: 'live',
					},
					{
						name: 'Planned',
						value: 'planned',
					},
					{
						name: 'Deprecated',
						value: 'deprecated',
					},
				],
				default: 'live',
				description: 'The state of the asset',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the asset',
				typeOptions: {
					multipleValues: true,
				},
			},
		],
	},
];
