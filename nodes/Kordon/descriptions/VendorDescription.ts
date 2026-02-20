import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

export const vendorOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['vendor'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single vendor',
			action: 'Get a vendor',
			routing: {
				request: {
					method: 'GET',
					url: '=/vendors/{{$parameter.vendorId}}',
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
			description: 'Get many vendors',
			action: 'Get many vendors',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'state');
							handleArrayParameter(requestOptions, 'criticality');
							handleArrayParameter(requestOptions, 'owner');
							handleArrayParameter(requestOptions, 'manager');
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
					url: '/vendors',
					returnFullResponse: true,
					qs: {
						'state[]': '={{$parameter.options.state}}',
						'criticality[]': '={{$parameter.options.criticality}}',
						'owner[]': '={{$parameter.options.owner}}',
						'manager[]': '={{$parameter.options.manager}}',
						'labels[]': '={{$parameter.options.labels}}',
					},
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							// Log response details for debugging
							this.logger.info('=== Kordon Vendor API Response ===');
							this.logger.info('Status Code: ' + response.statusCode);
							
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const body = response.body as any;
							if (body) {
								this.logger.info('Data length: ' + (body.data ? body.data.length : 'N/A'));
								if (body.meta) {
									this.logger.info('Meta: ' + JSON.stringify(body.meta));
								}
							}
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
			description: 'Create a new vendor',
			action: 'Create a vendor',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Build the body from evaluated parameters to ensure expressions are resolved
							const title = this.getNodeParameter('title') as string;
							const managerId = this.getNodeParameter('managerId') as string;
							const ownerId = this.getNodeParameter('ownerId') as string;
							const state = this.getNodeParameter('state') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const vendor: { [key: string]: any } = {
								title: title,
								manager_id: managerId,
								owner_id: ownerId,
								state: state,
							};

							// Add optional fields if provided
							if (additionalFields.criticality !== undefined && additionalFields.criticality !== '') {
								vendor.criticality = additionalFields.criticality;
							}
							if (additionalFields.description !== undefined && additionalFields.description !== '') {
								vendor.description = additionalFields.description;
							}
							if (additionalFields.contact !== undefined && additionalFields.contact !== '') {
								vendor.contact = additionalFields.contact;
							}
							if (additionalFields.country !== undefined && additionalFields.country !== '') {
								vendor.country = additionalFields.country;
							}
							if (additionalFields.website !== undefined && additionalFields.website !== '') {
								vendor.website = additionalFields.website;
							}
							if (additionalFields.contractStartDate !== undefined && additionalFields.contractStartDate !== '') {
								vendor.contract_start_date = additionalFields.contractStartDate;
							}
							if (additionalFields.contractEndDate !== undefined && additionalFields.contractEndDate !== '') {
								vendor.contract_end_date = additionalFields.contractEndDate;
							}
							if (additionalFields.personalDataClassification !== undefined && additionalFields.personalDataClassification !== '') {
								vendor.personal_data_classification = additionalFields.personalDataClassification;
							}

							// Handle labels - convert to array if needed
							if (additionalFields.labels !== undefined && additionalFields.labels !== '') {
								const labels = additionalFields.labels;
								if (typeof labels === 'string') {
									vendor.label_ids = labels.split(',').map((id: string) => id.trim());
								} else if (Array.isArray(labels)) {
									vendor.label_ids = labels;
								} else {
									vendor.label_ids = [labels];
								}
							}

							// Handle custom fields
							if (additionalFields.customFields !== undefined) {
								const customFields = additionalFields.customFields.field;
								if (Array.isArray(customFields)) {
									for (const field of customFields) {
										if (field.key && field.value !== undefined) {
											vendor[field.key] = field.value;
										}
									}
								}
							}

							requestOptions.body = { vendor: vendor };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/vendors',
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
			description: 'Update an existing vendor',
			action: 'Update a vendor',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const vendor: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									const labels = updateFields[key];
									if (typeof labels === 'string') {
										vendor['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										vendor['label_ids'] = labels;
									} else {
										vendor['label_ids'] = [labels];
									}
								} else if (key === 'customFields') {
									const customFields = updateFields[key].field;
									if (Array.isArray(customFields)) {
										for (const field of customFields) {
											if (field.key && field.value !== undefined) {
												vendor[field.key] = field.value;
											}
										}
									}
								} else if (key === 'managerId') {
									vendor['manager_id'] = updateFields[key];
								} else if (key === 'ownerId') {
									vendor['owner_id'] = updateFields[key];
								} else if (key === 'contractStartDate') {
									vendor['contract_start_date'] = updateFields[key];
								} else if (key === 'contractEndDate') {
									vendor['contract_end_date'] = updateFields[key];
								} else if (key === 'personalDataClassification') {
									vendor['personal_data_classification'] = updateFields[key];
								} else {
									vendor[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								vendor: vendor,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/vendors/{{$parameter.vendorId}}',
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
			description: 'Delete a vendor',
			action: 'Delete a vendor',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/vendors/{{$parameter.vendorId}}',
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
			description: 'Update connections between a vendor and other objects (controls, risks, assets, etc.)',
			action: 'Update vendor connections',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const vendorId = this.getNodeParameter('vendorId') as string;
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
							const newAssetIds = getConnectionIds('assetIds');
							const newBusinessProcessIds = getConnectionIds('businessProcessIds');
							const newFindingIds = getConnectionIds('findingIds');

							// Check if any connections were provided
							const hasControls = newControlIds.length > 0;
							const hasRisks = newRiskIds.length > 0;
							const hasAssets = newAssetIds.length > 0;
							const hasBusinessProcesses = newBusinessProcessIds.length > 0;
							const hasFindings = newFindingIds.length > 0;

							const connections: { [key: string]: string[] } = {};

							if (replaceExisting) {
								// Replace mode: just use the provided IDs directly
								if (hasControls) connections.control_ids = newControlIds;
								if (hasRisks) connections.risk_ids = newRiskIds;
								if (hasAssets) connections.asset_ids = newAssetIds;
								if (hasBusinessProcesses) connections.business_process_ids = newBusinessProcessIds;
								if (hasFindings) connections.finding_ids = newFindingIds;
							} else {
								// Merge mode: fetch existing connections and merge with new ones
								const credentials = await this.getCredentials('kordonApi');
								const baseUrl = credentials.domain as string;
								const apiKey = credentials.apiKey as string;

								// Fetch current vendor to get existing connections
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/v1/vendors/${vendorId}`,
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json',
									},
									json: true,
								});

								const existingVendor = response.data;

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
									connections.control_ids = mergeIds(extractIds(existingVendor.controls), newControlIds);
								}
								if (hasRisks) {
									connections.risk_ids = mergeIds(extractIds(existingVendor.risks), newRiskIds);
								}
								if (hasAssets) {
									connections.asset_ids = mergeIds(extractIds(existingVendor.assets), newAssetIds);
								}
								if (hasBusinessProcesses) {
									connections.business_process_ids = mergeIds(extractIds(existingVendor.business_processes), newBusinessProcessIds);
								}
								if (hasFindings) {
									connections.finding_ids = mergeIds(extractIds(existingVendor.findings), newFindingIds);
								}
							}

							requestOptions.body = { connections };

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Vendor Connections Request ===');
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
					url: '=/vendors/{{$parameter.vendorId}}/connections',
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

export const vendorFields: INodeProperties[] = [
	// ------------------------
	// Vendor: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Vendor ID',
		name: 'vendorId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the vendor to retrieve or delete',
	},

	// ------------------------
	// Vendor: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				description: 'Filter vendors by criticality level',
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
						name: 'Onboarding',
						value: 'onboarding',
					},
					{
						name: 'Active',
						value: 'active',
					},
					{
						name: 'Deprecated',
						value: 'deprecated',
					},
					{
						name: 'Offboarding',
						value: 'offboarding',
					},
				],
				default: [],
				description: 'Filter vendors by state',
			},
		],
	},

	// ------------------------
	// Vendor: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the vendor',
	},
	{
		displayName: 'Manager ID',
		name: 'managerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user who manages the vendor relationship',
	},
	{
		displayName: 'Owner ID',
		name: 'ownerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user who owns the vendor',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Onboarding',
				value: 'onboarding',
			},
			{
				name: 'Active',
				value: 'active',
			},
			{
				name: 'Offboarding',
				value: 'offboarding',
			},
			{
				name: 'Deprecated',
				value: 'deprecated',
			},
		],
		default: 'active',
		description: 'The state of the vendor',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Contact',
				name: 'contact',
				type: 'string',
				default: '',
				description: 'Contact person or details',
			},
			{
				displayName: 'Contract End Date',
				name: 'contractEndDate',
				type: 'dateTime',
				default: '',
				description: 'End date of the contract',
			},
			{
				displayName: 'Contract Start Date',
				name: 'contractStartDate',
				type: 'dateTime',
				default: '',
				description: 'Start date of the contract',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'Country of the vendor',
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
				description: 'The criticality of the vendor',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the vendor (HTML supported)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the vendor',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Personal Data Classification',
				name: 'personalDataClassification',
				type: 'options',
				options: [
					{
						name: 'No Personal Data',
						value: 'no_personal',
					},
					{
						name: 'Personal Data',
						value: 'personal',
					},
					{
						name: 'Special Categories',
						value: 'special_categories',
					},
					{
						name: 'Financial Data',
						value: 'financial',
					},
				],
				default: 'no_personal',
				description: 'Classification of personal data handled by the vendor',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website URL',
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
				description: 'Custom fields to set on the vendor',
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
	// Vendor: Update - Fields
	// ------------------------
	{
		displayName: 'Vendor ID',
		name: 'vendorId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['update'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the vendor to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Contact',
				name: 'contact',
				type: 'string',
				default: '',
				description: 'Contact person or details',
			},
			{
				displayName: 'Contract End Date',
				name: 'contractEndDate',
				type: 'dateTime',
				default: '',
				description: 'End date of the contract',
			},
			{
				displayName: 'Contract Start Date',
				name: 'contractStartDate',
				type: 'dateTime',
				default: '',
				description: 'Start date of the contract',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'Country of the vendor',
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
				description: 'The criticality of the vendor',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the vendor (HTML supported)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the vendor',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Manager ID',
				name: 'managerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who manages the vendor relationship',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				description: 'The ID of the user who owns the vendor',
			},
			{
				displayName: 'Personal Data Classification',
				name: 'personalDataClassification',
				type: 'options',
				options: [
					{
						name: 'No Personal Data',
						value: 'no_personal',
					},
					{
						name: 'Personal Data',
						value: 'personal',
					},
					{
						name: 'Special Categories',
						value: 'special_categories',
					},
					{
						name: 'Financial Data',
						value: 'financial',
					},
				],
				default: 'no_personal',
				description: 'Classification of personal data handled by the vendor',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{
						name: 'Onboarding',
						value: 'onboarding',
					},
					{
						name: 'Active',
						value: 'active',
					},
					{
						name: 'Offboarding',
						value: 'offboarding',
					},
					{
						name: 'Deprecated',
						value: 'deprecated',
					},
				],
				default: 'active',
				description: 'The state of the vendor',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the vendor',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website URL',
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
				description: 'Custom fields to set on the vendor',
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
	// Vendor: Update Connections - Fields
	// ------------------------
	{
		displayName: 'Vendor ID',
		name: 'vendorId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the vendor to update connections for',
	},
	{
		displayName: 'Replace Existing Connections',
		name: 'replaceExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				resource: ['vendor'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single finding ID or an array of IDs to connect',
	},
];
