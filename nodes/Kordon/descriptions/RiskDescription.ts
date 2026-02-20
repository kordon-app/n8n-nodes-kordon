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

							// Handle custom fields
							if (additionalFields.customFields !== undefined) {
								const customFields = additionalFields.customFields.field;
								if (Array.isArray(customFields)) {
									for (const field of customFields) {
										if (field.key && field.value !== undefined) {
											risk[field.key] = field.value;
										}
									}
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
								} else if (key === 'customFields') {
									const customFields = updateFields[key].field;
									if (Array.isArray(customFields)) {
										for (const field of customFields) {
											if (field.key && field.value !== undefined) {
												risk[field.key] = field.value;
											}
										}
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
		{
			name: 'Update Connections',
			value: 'updateConnections',
			description: 'Update connections between a risk and other objects (controls, assets, requirements, etc.)',
			action: 'Update risk connections',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const riskId = this.getNodeParameter('riskId') as string;
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
							const newControlIds = getConnectionIds('controlIds');
							const newVendorIds = getConnectionIds('vendorIds');
							const newAssetIds = getConnectionIds('assetIds');
							const newBusinessProcessIds = getConnectionIds('businessProcessIds');
							const newFindingIds = getConnectionIds('findingIds');

							// Check if any connections were provided
							const hasRequirements = newRequirementIds.length > 0;
							const hasControls = newControlIds.length > 0;
							const hasVendors = newVendorIds.length > 0;
							const hasAssets = newAssetIds.length > 0;
							const hasBusinessProcesses = newBusinessProcessIds.length > 0;
							const hasFindings = newFindingIds.length > 0;

							const connections: { [key: string]: string[] } = {};

							if (replaceExisting) {
								// Replace mode: just use the provided IDs directly
								if (hasRequirements) connections.requirement_ids = newRequirementIds;
								if (hasControls) connections.control_ids = newControlIds;
								if (hasVendors) connections.vendor_ids = newVendorIds;
								if (hasAssets) connections.asset_ids = newAssetIds;
								if (hasBusinessProcesses) connections.business_process_ids = newBusinessProcessIds;
								if (hasFindings) connections.finding_ids = newFindingIds;
							} else {
								// Merge mode: fetch existing connections and merge with new ones
								const credentials = await this.getCredentials('kordonApi');
								const baseUrl = credentials.domain as string;
								const apiKey = credentials.apiKey as string;

								// Fetch current risk to get existing connections
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/v1/risks/${riskId}`,
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json',
									},
									json: true,
								});

								const existingRisk = response.data;

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
									connections.requirement_ids = mergeIds(extractIds(existingRisk.requirements), newRequirementIds);
								}
								if (hasControls) {
									connections.control_ids = mergeIds(extractIds(existingRisk.controls), newControlIds);
								}
								if (hasVendors) {
									connections.vendor_ids = mergeIds(extractIds(existingRisk.vendors), newVendorIds);
								}
								if (hasAssets) {
									connections.asset_ids = mergeIds(extractIds(existingRisk.assets), newAssetIds);
								}
								if (hasBusinessProcesses) {
									connections.business_process_ids = mergeIds(extractIds(existingRisk.business_processes), newBusinessProcessIds);
								}
								if (hasFindings) {
									connections.finding_ids = mergeIds(extractIds(existingRisk.findings), newFindingIds);
								}
							}

							requestOptions.body = { connections };

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Risk Connections Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Replace Existing: ' + replaceExisting);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('==================================================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/risks/{{$parameter.riskId}}/connections',
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
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Custom Field',
				description: 'Custom fields to set on the risk',
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

	// ------------------------
	// Risk: Update Connections - Fields
	// ------------------------
	{
		displayName: 'Risk ID',
		name: 'riskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the risk to update connections for',
	},
	{
		displayName: 'Replace Existing Connections',
		name: 'replaceExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['risk'],
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
				resource: ['risk'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single requirement ID or an array of IDs to connect',
	},
	{
		displayName: 'Control IDs',
		name: 'controlIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['risk'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single control ID or an array of IDs to connect',
	},
	{
		displayName: 'Vendor IDs',
		name: 'vendorIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['risk'],
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
				resource: ['risk'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single asset ID or an array of IDs to connect',
	},
	{
		displayName: 'Business Process IDs',
		name: 'businessProcessIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['risk'],
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
				resource: ['risk'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single finding ID or an array of IDs to connect',
	},
];
