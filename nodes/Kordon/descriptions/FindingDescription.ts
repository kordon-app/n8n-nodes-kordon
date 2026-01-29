import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

/**
 * Finding resource operations for Kordon node
 */

export const findingOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['finding'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single finding',
			action: 'Get a finding',
			routing: {
				request: {
					method: 'GET',
					url: '=/findings/{{$parameter.findingId}}',
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
			description: 'Get many findings',
			action: 'Get many findings',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'kind');
							handleArrayParameter(requestOptions, 'state');
							handleArrayParameter(requestOptions, 'priority');
							handleArrayParameter(requestOptions, 'source', { encodeValues: true });
							handleArrayParameter(requestOptions, 'owner');
							handleArrayParameter(requestOptions, 'manager');

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
					url: '/findings',
					returnFullResponse: true,
					qs: {
						'kind[]': '={{$parameter.options.kind}}',
						'state[]': '={{$parameter.options.state}}',
						'priority[]': '={{$parameter.options.priority}}',
						'source[]': '={{$parameter.options.source}}',
						'owner[]': '={{$parameter.options.owner}}',
						'manager[]': '={{$parameter.options.manager}}',
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
			description: 'Create a new finding',
			action: 'Create a finding',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Build the body from evaluated parameters to ensure expressions are resolved
							const title = this.getNodeParameter('title') as string;
							const kind = this.getNodeParameter('kind') as string;
							const ownerGroupId = this.getNodeParameter('ownerGroupId') as string;
							const managerGroupId = this.getNodeParameter('managerGroupId') as string;
							const state = this.getNodeParameter('state') as string;
							const priority = this.getNodeParameter('priority') as string;
							const source = this.getNodeParameter('source') as string;
							const dateDiscovered = this.getNodeParameter('dateDiscovered') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const finding: { [key: string]: any } = {
								title: title,
								kind: kind,
								owner_group_id: ownerGroupId,
								manager_group_id: managerGroupId,
								state: state,
								priority: priority,
								source: source,
								date_discovered: dateDiscovered,
							};

							// Add optional fields if provided
							if (additionalFields.description !== undefined && additionalFields.description !== '') {
								finding.description = additionalFields.description;
							}

							// Handle labels - convert to array if needed
							if (additionalFields.labels !== undefined && additionalFields.labels !== '') {
								const labels = additionalFields.labels;
								if (typeof labels === 'string') {
									finding.label_ids = labels.split(',').map((id: string) => id.trim());
								} else if (Array.isArray(labels)) {
									finding.label_ids = labels;
								} else {
									finding.label_ids = [labels];
								}
							}

							requestOptions.body = { finding: finding };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/findings',
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
			description: 'Update an existing finding',
			action: 'Update a finding',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const finding: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									const labels = updateFields[key];
									if (typeof labels === 'string') {
										finding['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										finding['label_ids'] = labels;
									} else {
										finding['label_ids'] = [labels];
									}
								} else if (key === 'ownerGroupId') {
									finding['owner_group_id'] = updateFields[key];
								} else if (key === 'managerGroupId') {
									finding['manager_group_id'] = updateFields[key];
								} else if (key === 'dateDiscovered') {
									finding['date_discovered'] = updateFields[key];
								} else {
									finding[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								finding: finding,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/findings/{{$parameter.findingId}}',
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
			description: 'Delete a finding',
			action: 'Delete a finding',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/findings/{{$parameter.findingId}}',
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
			description: 'Update connections between a finding and other objects (requirements, controls, risks, assets, vendors)',
			action: 'Update finding connections',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const findingId = this.getNodeParameter('findingId') as string;
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
							const newRiskIds = getConnectionIds('riskIds');
							const newAssetIds = getConnectionIds('assetIds');
							const newVendorIds = getConnectionIds('vendorIds');

							// Check if any connections were provided
							const hasRequirements = newRequirementIds.length > 0;
							const hasControls = newControlIds.length > 0;
							const hasRisks = newRiskIds.length > 0;
							const hasAssets = newAssetIds.length > 0;
							const hasVendors = newVendorIds.length > 0;

							const connections: { [key: string]: string[] } = {};

							if (replaceExisting) {
								// Replace mode: just use the provided IDs directly
								if (hasRequirements) connections.requirement_ids = newRequirementIds;
								if (hasControls) connections.control_ids = newControlIds;
								if (hasRisks) connections.risk_ids = newRiskIds;
								if (hasAssets) connections.asset_ids = newAssetIds;
								if (hasVendors) connections.vendor_ids = newVendorIds;
							} else {
								// Merge mode: fetch existing connections and merge with new ones
								const credentials = await this.getCredentials('kordonApi');
								const baseUrl = credentials.domain as string;
								const apiKey = credentials.apiKey as string;

								// Fetch current finding to get existing connections
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/v1/findings/${findingId}`,
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json',
									},
									json: true,
								});

								const existingFinding = response.data;

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
									connections.requirement_ids = mergeIds(extractIds(existingFinding.requirements), newRequirementIds);
								}
								if (hasControls) {
									connections.control_ids = mergeIds(extractIds(existingFinding.controls), newControlIds);
								}
								if (hasRisks) {
									connections.risk_ids = mergeIds(extractIds(existingFinding.risks), newRiskIds);
								}
								if (hasAssets) {
									connections.asset_ids = mergeIds(extractIds(existingFinding.assets), newAssetIds);
								}
								if (hasVendors) {
									connections.vendor_ids = mergeIds(extractIds(existingFinding.vendors), newVendorIds);
								}
							}

							requestOptions.body = { connections };

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Finding Connections Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Replace Existing: ' + replaceExisting);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('=====================================================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/findings/{{$parameter.findingId}}/connections',
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

export const findingFields: INodeProperties[] = [
	// ------------------------
	// Finding: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the finding',
	},
	{
		displayName: 'Kind',
		name: 'kind',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'OFI',
				value: 'ofi',
			},
			{
				name: 'Incident',
				value: 'incident',
			},
			{
				name: 'NCR',
				value: 'ncr',
			},
		],
		default: 'incident',
		description: 'The kind of finding',
	},
	{
		displayName: 'Owner ID',
		name: 'ownerGroupId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the owner',
	},
	{
		displayName: 'Manager ID',
		name: 'managerGroupId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the manager',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Open',
				value: 'open',
			},
			{
				name: 'In Progress',
				value: 'in_progress',
			},
			{
				name: 'Resolved',
				value: 'resolved',
			},
			{
				name: 'Closed',
				value: 'closed',
			},
		],
		default: 'open',
		description: 'The state of the finding',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
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
		default: 'medium',
		description: 'The priority of the finding',
	},
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Assessment',
				value: 'assessment',
			},
			{
				name: 'Audit',
				value: 'audit',
			},
			{
				name: 'Incident',
				value: 'incident',
			},
			{
				name: 'Observation',
				value: 'observation',
			},
			{
				name: 'Report',
				value: 'report',
			},
		],
		default: 'audit',
		description: 'The source of the finding',
	},
	{
		displayName: 'Date Discovered',
		name: 'dateDiscovered',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Date when the finding was discovered',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the finding (HTML supported)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the finding',
				typeOptions: {
					multipleValues: true,
				},
			},
		],
	},

	// ------------------------
	// Finding: Update - Fields
	// ------------------------
	{
		displayName: 'Finding ID',
		name: 'findingId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['update'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the finding to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Date Discovered',
				name: 'dateDiscovered',
				type: 'dateTime',
				default: '',
				description: 'Date when the finding was discovered',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the finding (HTML supported)',
			},
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				options: [
					{
						name: 'OFI',
						value: 'ofi',
					},
					{
						name: 'Incident',
						value: 'incident',
					},
					{
						name: 'NCR',
						value: 'ncr',
					},
				],
				default: 'incident',
				description: 'The kind of finding',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the finding',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Manager Group ID',
				name: 'managerGroupId',
				type: 'string',
				default: '',
				description: 'The ID of the manager group',
			},
			{
				displayName: 'Owner Group ID',
				name: 'ownerGroupId',
				type: 'string',
				default: '',
				description: 'The ID of the owner group',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
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
				default: 'medium',
				description: 'The priority of the finding',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'Assessment',
						value: 'assessment',
					},
					{
						name: 'Audit',
						value: 'audit',
					},
					{
						name: 'Incident',
						value: 'incident',
					},
					{
						name: 'Observation',
						value: 'observation',
					},
					{
						name: 'Report',
						value: 'report',
					},
				],
				default: 'audit',
				description: 'The source of the finding',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{
						name: 'Open',
						value: 'open',
					},
					{
						name: 'In Progress',
						value: 'in_progress',
					},
					{
						name: 'Resolved',
						value: 'resolved',
					},
					{
						name: 'Closed',
						value: 'closed',
					},
				],
				default: 'open',
				description: 'The state of the finding',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the finding',
			},
		],
	},

	// ------------------------
	// Finding: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Finding ID',
		name: 'findingId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the finding to retrieve or delete',
	},

	// ------------------------
	// Finding: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['finding'],
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
				resource: ['finding'],
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
						name: 'OFI',
						value: 'ofi',
					},
					{
						name: 'Incident',
						value: 'incident',
					},
					{
						name: 'NCR',
						value: 'ncr',
					},
				],
				default: [],
				description: 'Filter findings by kind',
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
				displayName: 'Priority',
				name: 'priority',
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
				description: 'Filter findings by priority',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'multiOptions',
				options: [
					{
						name: 'Internal Audit',
						value: 'Internal audit',
					},
					{
						name: 'External Audit',
						value: 'External audit',
					},
					{
						name: 'Incident',
						value: 'incident',
					},
					{
						name: 'Observation',
						value: 'observation',
					},
				],
				default: [],
				description: 'Filter findings by source',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'multiOptions',
				options: [
					{
						name: 'Open',
						value: 'open',
					},
					{
						name: 'In Progress',
						value: 'in_progress',
					},
					{
						name: 'Resolved',
						value: 'resolved',
					},
					{
						name: 'Closed',
						value: 'closed',
					},
				],
				default: [],
				description: 'Filter findings by state',
			},
		],
	},

	// ------------------------
	// Finding: Update Connections - Fields
	// ------------------------
	{
		displayName: 'Finding ID',
		name: 'findingId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the finding to update connections for',
	},
	{
		displayName: 'Replace Existing Connections',
		name: 'replaceExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['finding'],
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
				resource: ['finding'],
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
				resource: ['finding'],
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
				resource: ['finding'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single risk ID or an array of IDs to connect',
	},
	{
		displayName: 'Asset IDs',
		name: 'assetIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single asset ID or an array of IDs to connect',
	},
	{
		displayName: 'Vendor IDs',
		name: 'vendorIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['finding'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single vendor ID or an array of IDs to connect',
	},
];
