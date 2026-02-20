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
							// Build the body from evaluated parameters to ensure expressions are resolved
							const title = this.getNodeParameter('title') as string;
							const ownerId = this.getNodeParameter('ownerId') as string;
							const kind = this.getNodeParameter('kind') as string;
							const beginsAt = this.getNodeParameter('beginsAt') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const control: { [key: string]: any } = {
								title: title,
								owner_id: ownerId,
								kind: kind,
								begins_at: beginsAt,
							};

							// Add optional fields if provided
							if (additionalFields.description !== undefined && additionalFields.description !== '') {
								control.description = additionalFields.description;
							}

							// Handle labels - convert to array if needed
							if (additionalFields.labels !== undefined && additionalFields.labels !== '') {
								const labels = additionalFields.labels;
								if (typeof labels === 'string') {
									control.label_ids = labels.split(',').map((id: string) => id.trim());
								} else if (Array.isArray(labels)) {
									control.label_ids = labels;
								} else {
									control.label_ids = [labels];
								}
							}

							// Handle custom fields
							if (additionalFields.customFields !== undefined) {
								const customFields = additionalFields.customFields.field;
								if (Array.isArray(customFields)) {
									for (const field of customFields) {
										if (field.key && field.value !== undefined) {
											control[field.key] = field.value;
										}
									}
								}
							}

							requestOptions.body = { control: control };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/controls',
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
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
								} else if (key === 'customFields') {
									const customFields = updateFields[key].field;
									if (Array.isArray(customFields)) {
										for (const field of customFields) {
											if (field.key && field.value !== undefined) {
												control[field.key] = field.value;
											}
										}
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
		{
			name: 'Update Connections',
			value: 'updateConnections',
			description: 'Update connections between a control and other objects (assets, risks, requirements, etc.)',
			action: 'Update control connections',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const controlId = this.getNodeParameter('controlId') as string;
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

							const newRequirementIds = getConnectionIds('requirementIds');
							const newAssetIds = getConnectionIds('assetIds');
							const newVendorIds = getConnectionIds('vendorIds');
							const newRiskIds = getConnectionIds('riskIds');
							const newBusinessProcessIds = getConnectionIds('businessProcessIds');
							const newFindingIds = getConnectionIds('findingIds');

							// Check if any connections were provided
							const hasRequirements = newRequirementIds.length > 0;
							const hasAssets = newAssetIds.length > 0;
							const hasVendors = newVendorIds.length > 0;
							const hasRisks = newRiskIds.length > 0;
							const hasBusinessProcesses = newBusinessProcessIds.length > 0;
							const hasFindings = newFindingIds.length > 0;

							const connections: { [key: string]: string[] } = {};

							if (replaceExisting) {
								// Replace mode: just use the provided IDs directly
								if (hasRequirements) connections.requirement_ids = newRequirementIds;
								if (hasAssets) connections.asset_ids = newAssetIds;
								if (hasVendors) connections.vendor_ids = newVendorIds;
								if (hasRisks) connections.risk_ids = newRiskIds;
								if (hasBusinessProcesses) connections.business_process_ids = newBusinessProcessIds;
								if (hasFindings) connections.finding_ids = newFindingIds;
							} else {
								// Merge mode: fetch existing connections and merge with new ones
								const credentials = await this.getCredentials('kordonApi');
								const baseUrl = credentials.domain as string;
								const apiKey = credentials.apiKey as string;

								// Fetch current control to get existing connections
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/v1/controls/${controlId}`,
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json',
									},
									json: true,
								});

								const existingControl = response.data;

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
								if (hasRequirements) {
									connections.requirement_ids = mergeIds(extractIds(existingControl.requirements), newRequirementIds);
								}
								if (hasAssets) {
									connections.asset_ids = mergeIds(extractIds(existingControl.assets), newAssetIds);
								}
								if (hasVendors) {
									connections.vendor_ids = mergeIds(extractIds(existingControl.vendors), newVendorIds);
								}
								if (hasRisks) {
									connections.risk_ids = mergeIds(extractIds(existingControl.risks), newRiskIds);
								}
								if (hasBusinessProcesses) {
									connections.business_process_ids = mergeIds(extractIds(existingControl.business_processes), newBusinessProcessIds);
								}
								if (hasFindings) {
									connections.finding_ids = mergeIds(extractIds(existingControl.findings), newFindingIds);
								}
							}

							requestOptions.body = { connections };

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Control Connections Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Replace Existing: ' + replaceExisting);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('====================================================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/controls/{{$parameter.controlId}}/connections',
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
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Custom Field',
				description: 'Custom fields to set on the control',
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Field Key',
								name: 'key',
								type: 'string',
								default: '',
								placeholder: 'e.g., my_custom_field',
								description: 'The key/name of the custom field',
							},
							{
								displayName: 'Field Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'The value for this custom field',
							},
						],
					},
				],
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
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who owns the control',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the control',
			},
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Custom Field',
				description: 'Custom fields to set on the control',
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Field Key',
								name: 'key',
								type: 'string',
								default: '',
								placeholder: 'e.g., my_custom_field',
								description: 'The key/name of the custom field',
							},
							{
								displayName: 'Field Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'The value for this custom field',
							},
						],
					},
				],
			},
		],
	},

	// ------------------------
	// Control: Update Connections - Fields
	// ------------------------
	{
		displayName: 'Control ID',
		name: 'controlId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the control to update connections for',
	},
	{
		displayName: 'Replace Existing Connections',
		name: 'replaceExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['updateConnections'],
			},
		},
		default: false,
		description: 'Whether to replace all existing connections with the provided ones. If false (default), new connections will be added to existing ones.',
	},
	{
		displayName: 'Requirement IDs',
		name: 'requirementIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single requirement ID or an array of IDs to connect',
	},
	{
		displayName: 'Asset IDs',
		name: 'assetIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['control'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single asset ID or an array of IDs to connect',
	},
	{
		displayName: 'Risk IDs',
		name: 'riskIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['control'],
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
				resource: ['control'],
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
				resource: ['control'],
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
				resource: ['control'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single finding ID or an array of IDs to connect',
	},
];
