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
							
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
							// Build the body from evaluated parameters to ensure expressions are resolved
							const title = this.getNodeParameter('title') as string;
							const managerId = this.getNodeParameter('managerId') as string;
							const ownerId = this.getNodeParameter('ownerId') as string;
							const description = this.getNodeParameter('description') as string;
							const assetValue = this.getNodeParameter('assetValue') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const asset: { [key: string]: any } = {
								title: title,
								manager_id: managerId,
								owner_id: ownerId,
								description: description,
								asset_value: assetValue,
							};

							// Add optional fields if provided
							if (additionalFields.state !== undefined && additionalFields.state !== '') {
								asset.state = additionalFields.state;
							}

							// Handle labels - convert to array if needed
							if (additionalFields.labels !== undefined && additionalFields.labels !== '') {
								const labels = additionalFields.labels;
								if (typeof labels === 'string') {
									asset.label_ids = labels.split(',').map((id: string) => id.trim());
								} else if (Array.isArray(labels)) {
									asset.label_ids = labels;
								} else {
									asset.label_ids = [labels];
								}
							}

							requestOptions.body = { asset: asset };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/assets',
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
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', 0) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const asset: { [key: string]: any } = {};

							// Map UI fields to API fields
							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									const labels = updateFields[key];
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
		{
			name: 'Update Connections',
			value: 'updateConnections',
			description: 'Update connections between an asset and other objects (controls, risks, vendors, etc.)',
			action: 'Update asset connections',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const assetId = this.getNodeParameter('assetId') as string;
							const replaceExisting = this.getNodeParameter('replaceExisting', false) as boolean;

							// Get connection IDs from parameters
							// Accepts: single ID string, array of IDs, or empty
							const getConnectionIds = (paramName: string): string[] => {
								try {
									const value = this.getNodeParameter(paramName, '');
									this.logger.info(`[${paramName}] Raw value type: ${typeof value}, isArray: ${Array.isArray(value)}, value: ${JSON.stringify(value)}`);
									if (!value) return [];
									if (Array.isArray(value)) {
										// Flatten in case n8n wraps array in another array [[...]]
										const flattened = value.flat();
										const result = flattened.map((v: unknown) => String(v).trim()).filter((v: string) => v);
										this.logger.info(`[${paramName}] Processed array result: ${JSON.stringify(result)}`);
										return result;
									}
									if (typeof value === 'string' && value.trim()) {
										// Single ID string
										return [value.trim()];
									}
									return [];
								} catch {
									return [];
								}
							};

							const newControlIds = getConnectionIds('controlIds');
							const newRiskIds = getConnectionIds('riskIds');
							const newVendorIds = getConnectionIds('vendorIds');
							const newBusinessProcessIds = getConnectionIds('businessProcessIds');
							const newFindingIds = getConnectionIds('findingIds');

							// Check if any connections were provided
							const hasControls = newControlIds.length > 0;
							const hasRisks = newRiskIds.length > 0;
							const hasVendors = newVendorIds.length > 0;
							const hasBusinessProcesses = newBusinessProcessIds.length > 0;
							const hasFindings = newFindingIds.length > 0;

							const connections: { [key: string]: string[] } = {};

							if (replaceExisting) {
								// Replace mode: just use the provided IDs directly
								if (hasControls) connections.control_ids = newControlIds;
								if (hasRisks) connections.risk_ids = newRiskIds;
								if (hasVendors) connections.vendor_ids = newVendorIds;
								if (hasBusinessProcesses) connections.business_process_ids = newBusinessProcessIds;
								if (hasFindings) connections.finding_ids = newFindingIds;
							} else {
								// Merge mode: fetch existing connections and merge with new ones
								const credentials = await this.getCredentials('kordonApi');
								const baseUrl = credentials.domain as string;
								const apiKey = credentials.apiKey as string;

								// Fetch current asset to get existing connections
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/v1/assets/${assetId}`,
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json',
									},
									json: true,
								});

								const existingAsset = response.data;

								// Helper to extract IDs from existing connections
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								const extractIds = (items: any[] | undefined): string[] => {
									if (!items || !Array.isArray(items)) return [];
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									return items.map((item: any) => item.id).filter((id: string) => id);
								};

								// Merge existing with new (deduplicated)
								const mergeIds = (existing: string[], newIds: string[]): string[] => {
									return [...new Set([...existing, ...newIds])];
								};

								// Only include connection types that user provided input for
								if (hasControls) {
									connections.control_ids = mergeIds(extractIds(existingAsset.controls), newControlIds);
								}
								if (hasRisks) {
									connections.risk_ids = mergeIds(extractIds(existingAsset.risks), newRiskIds);
								}
								if (hasVendors) {
									connections.vendor_ids = mergeIds(extractIds(existingAsset.vendors), newVendorIds);
								}
								if (hasBusinessProcesses) {
									connections.business_process_ids = mergeIds(extractIds(existingAsset.business_processes), newBusinessProcessIds);
								}
								if (hasFindings) {
									connections.finding_ids = mergeIds(extractIds(existingAsset.findings), newFindingIds);
								}
							}

							requestOptions.body = { connections };

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Asset Connections Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Replace Existing: ' + replaceExisting);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('===================================================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/assets/{{$parameter.assetId}}/connections',
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
				resource: ['asset'],
				operation: ['getMany'],
			},
		},
		options: [
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
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the asset (HTML supported)',
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
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the asset',
			},
		],
	},

	// ------------------------
	// Asset: Update Connections - Fields
	// ------------------------
	{
		displayName: 'Asset ID',
		name: 'assetId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the asset to update connections for',
	},
	{
		displayName: 'Replace Existing Connections',
		name: 'replaceExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['updateConnections'],
			},
		},
		default: false,
		description: 'Whether to replace all existing connections with the provided ones. If false (default), new connections will be added to existing ones.',
	},
	{
		displayName: 'Control IDs',
		name: 'controlIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single control ID or an array of IDs to connect',
	},
	{
		displayName: 'Risk IDs',
		name: 'riskIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single risk ID or an array of IDs to connect',
	},
	{
		displayName: 'Vendor IDs',
		name: 'vendorIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single vendor ID or an array of IDs to connect',
	},
	{
		displayName: 'Business Process IDs',
		name: 'businessProcessIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single business process ID or an array of IDs to connect',
	},
	{
		displayName: 'Finding IDs',
		name: 'findingIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['asset'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single finding ID or an array of IDs to connect',
	},
];
