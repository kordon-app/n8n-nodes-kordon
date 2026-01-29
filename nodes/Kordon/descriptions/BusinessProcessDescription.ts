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
							// Build the body from evaluated parameters to ensure expressions are resolved
							const title = this.getNodeParameter('title') as string;
							const ownerId = this.getNodeParameter('owner_id') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const businessProcess: { [key: string]: any } = {
								title: title,
								owner_id: ownerId,
							};

							// Add optional fields if provided
							if (additionalFields.criticality !== undefined && additionalFields.criticality !== '') {
								businessProcess.criticality = additionalFields.criticality;
							}
							if (additionalFields.monetary_value !== undefined && additionalFields.monetary_value !== '') {
								businessProcess.monetary_value = additionalFields.monetary_value;
							}
							if (additionalFields.currency !== undefined && additionalFields.currency !== '') {
								businessProcess.currency = additionalFields.currency;
							}
							if (additionalFields.description !== undefined && additionalFields.description !== '') {
								businessProcess.description = additionalFields.description;
							}

							// Handle labels - convert to array if needed
							if (additionalFields.labels !== undefined && additionalFields.labels !== '') {
								const labels = additionalFields.labels;
								if (typeof labels === 'string') {
									businessProcess.label_ids = labels.split(',').map((id: string) => id.trim());
								} else if (Array.isArray(labels)) {
									businessProcess.label_ids = labels;
								} else {
									businessProcess.label_ids = [labels];
								}
							}

							requestOptions.body = { business_process: businessProcess };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/business-processes',
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
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const businessProcess: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									const labels = updateFields[key];
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
		{
			name: 'Update Connections',
			value: 'updateConnections',
			description: 'Update connections between a business process and other objects (controls, risks, vendors, assets)',
			action: 'Update business process connections',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const businessProcessId = this.getNodeParameter('businessProcessId') as string;
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
							const newAssetIds = getConnectionIds('assetIds');

							// Check if any connections were provided
							const hasControls = newControlIds.length > 0;
							const hasRisks = newRiskIds.length > 0;
							const hasVendors = newVendorIds.length > 0;
							const hasAssets = newAssetIds.length > 0;

							const connections: { [key: string]: string[] } = {};

							if (replaceExisting) {
								// Replace mode: just use the provided IDs directly
								if (hasControls) connections.control_ids = newControlIds;
								if (hasRisks) connections.risk_ids = newRiskIds;
								if (hasVendors) connections.vendor_ids = newVendorIds;
								if (hasAssets) connections.asset_ids = newAssetIds;
							} else {
								// Merge mode: fetch existing connections and merge with new ones
								const credentials = await this.getCredentials('kordonApi');
								const baseUrl = credentials.domain as string;
								const apiKey = credentials.apiKey as string;

								// Fetch current business process to get existing connections
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/v1/business-processes/${businessProcessId}`,
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json',
									},
									json: true,
								});

								const existingProcess = response.data;

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
									connections.control_ids = mergeIds(extractIds(existingProcess.controls), newControlIds);
								}
								if (hasRisks) {
									connections.risk_ids = mergeIds(extractIds(existingProcess.risks), newRiskIds);
								}
								if (hasVendors) {
									connections.vendor_ids = mergeIds(extractIds(existingProcess.vendors), newVendorIds);
								}
								if (hasAssets) {
									connections.asset_ids = mergeIds(extractIds(existingProcess.assets), newAssetIds);
								}
							}

							requestOptions.body = { connections };

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Business Process Connections Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Replace Existing: ' + replaceExisting);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('===============================================================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/business-processes/{{$parameter.businessProcessId}}/connections',
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
				description: 'Filter by label IDs. Use "none" for items without labels.',
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
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{
						name: 'AUD',
						value: 'AUD',
					},
					{
						name: 'CAD',
						value: 'CAD',
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
						name: 'USD',
						value: 'USD',
					},
				],
				default: 'USD',
				description: 'The currency of the monetary value',
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
				displayName: 'Monetary Value',
				name: 'monetary_value',
				type: 'number',
				default: 0,
				description: 'The monetary value of the business process',
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
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{
						name: 'AUD',
						value: 'AUD',
					},
					{
						name: 'CAD',
						value: 'CAD',
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
						name: 'USD',
						value: 'USD',
					},
				],
				default: 'USD',
				description: 'The currency of the monetary value',
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
				displayName: 'Monetary Value',
				name: 'monetary_value',
				type: 'number',
				default: 0,
				description: 'The monetary value of the business process',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'The ID of the owner',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the business process',
			},
		],
	},

	// ------------------------
	// Business Process: Update Connections - Fields
	// ------------------------
	{
		displayName: 'Business Process ID',
		name: 'businessProcessId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the business process to update connections for',
	},
	{
		displayName: 'Replace Existing Connections',
		name: 'replaceExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['business_process'],
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
				resource: ['business_process'],
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
				resource: ['business_process'],
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
				resource: ['business_process'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single vendor ID or an array of IDs to connect',
	},
	{
		displayName: 'Asset IDs',
		name: 'assetIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['business_process'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single asset ID or an array of IDs to connect',
	},
];
