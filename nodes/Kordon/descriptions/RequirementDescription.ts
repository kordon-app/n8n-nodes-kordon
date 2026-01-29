import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

/**
 * Requirement resource operations for Kordon node
 */

export const requirementOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['requirement'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single requirement',
			action: 'Get a requirement',
			routing: {
				request: {
					method: 'GET',
					url: '=/requirements/{{$parameter.requirementId}}',
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
			description: 'Get a list of requirements',
			action: 'Get many requirements',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'frameworks');
							handleArrayParameter(requestOptions, 'applicability');
							handleArrayParameter(requestOptions, 'chapter', { encodeValues: true });
							handleArrayParameter(requestOptions, 'controls');
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
					url: '/requirements',
					returnFullResponse: true,
					qs: {
						'frameworks[]': '={{$parameter.options.frameworkId}}',
						'applicability[]': '={{$parameter.options.applicability}}',
						'chapter[]': '={{$parameter.options.chapter}}',
						'controls[]': '={{$parameter.options.controls}}',
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
			description: 'Create a new requirement',
			action: 'Create a requirement',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Build the body from evaluated parameters to ensure expressions are resolved
							const title = this.getNodeParameter('title') as string;
							const frameworkId = this.getNodeParameter('frameworkId') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const requirement: { [key: string]: any } = {
								title: title,
								regulation_ids: [frameworkId],
							};

							// Add optional fields if provided
							if (additionalFields.description !== undefined && additionalFields.description !== '') {
								requirement.description = additionalFields.description;
							}
							if (additionalFields.chapterName !== undefined && additionalFields.chapterName !== '') {
								requirement.chapter_name = additionalFields.chapterName;
							}
							if (additionalFields.chapterNumber !== undefined && additionalFields.chapterNumber !== '') {
								requirement.chapter_number = additionalFields.chapterNumber;
							}
							if (additionalFields.paragraphNumber !== undefined && additionalFields.paragraphNumber !== '') {
								requirement.paragraph_number = additionalFields.paragraphNumber;
							}
							if (additionalFields.meaning !== undefined && additionalFields.meaning !== '') {
								requirement.meaning = additionalFields.meaning;
							}
							if (additionalFields.isApplicable !== undefined) {
								requirement.is_applicable = additionalFields.isApplicable;
							}
							if (additionalFields.applicabilityNote !== undefined && additionalFields.applicabilityNote !== '') {
								requirement.applicability_note = additionalFields.applicabilityNote;
							}

							// Handle label_ids - convert to array if needed
							if (additionalFields.labels !== undefined && additionalFields.labels !== '') {
								const labels = additionalFields.labels;
								if (typeof labels === 'string') {
									requirement.label_ids = labels.split(',').map((id: string) => id.trim());
								} else if (Array.isArray(labels)) {
									requirement.label_ids = labels;
								} else {
									requirement.label_ids = [labels];
								}
							}

							requestOptions.body = {
								requirement: requirement,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/requirements',
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
			description: 'Update an existing requirement',
			action: 'Update a requirement',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const requirement: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									const labels = updateFields[key];
									if (typeof labels === 'string') {
										requirement['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										requirement['label_ids'] = labels;
									} else {
										requirement['label_ids'] = [labels];
									}
								} else if (key === 'frameworkId') {
									// Convert frameworkId to regulation_ids array
									const frameworkId = updateFields[key];
									if (typeof frameworkId === 'string') {
										requirement['regulation_ids'] = [frameworkId];
									} else if (Array.isArray(frameworkId)) {
										requirement['regulation_ids'] = frameworkId;
									} else {
										requirement['regulation_ids'] = [frameworkId];
									}
								} else if (key === 'chapterName') {
									requirement['chapter_name'] = updateFields[key];
								} else if (key === 'chapterNumber') {
									requirement['chapter_number'] = updateFields[key];
								} else if (key === 'paragraphNumber') {
									requirement['paragraph_number'] = updateFields[key];
								} else if (key === 'isApplicable') {
									requirement['is_applicable'] = updateFields[key];
								} else if (key === 'applicabilityNote') {
									requirement['applicability_note'] = updateFields[key];
								} else {
									requirement[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								requirement: requirement,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/requirements/{{$parameter.requirementId}}',
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
			description: 'Delete a requirement',
			action: 'Delete a requirement',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/requirements/{{$parameter.requirementId}}',
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
			description: 'Update connections between a requirement and other objects (controls, risks, findings)',
			action: 'Update requirement connections',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const requirementId = this.getNodeParameter('requirementId') as string;
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
							const newFindingIds = getConnectionIds('findingIds');

							// Check if any connections were provided
							const hasControls = newControlIds.length > 0;
							const hasRisks = newRiskIds.length > 0;
							const hasFindings = newFindingIds.length > 0;

							const connections: { [key: string]: string[] } = {};

							if (replaceExisting) {
								// Replace mode: just use the provided IDs directly
								if (hasControls) connections.control_ids = newControlIds;
								if (hasRisks) connections.risk_ids = newRiskIds;
								if (hasFindings) connections.finding_ids = newFindingIds;
							} else {
								// Merge mode: fetch existing connections and merge with new ones
								const credentials = await this.getCredentials('kordonApi');
								const baseUrl = credentials.domain as string;
								const apiKey = credentials.apiKey as string;

								// Fetch current requirement to get existing connections
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/v1/requirements/${requirementId}`,
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json',
									},
									json: true,
								});

								const existingRequirement = response.data;

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
									connections.control_ids = mergeIds(extractIds(existingRequirement.controls), newControlIds);
								}
								if (hasRisks) {
									connections.risk_ids = mergeIds(extractIds(existingRequirement.risks), newRiskIds);
								}
								if (hasFindings) {
									connections.finding_ids = mergeIds(extractIds(existingRequirement.findings), newFindingIds);
								}
							}

							requestOptions.body = { connections };

							// Log request details for debugging
							this.logger.info('=== Kordon API Update Requirement Connections Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Replace Existing: ' + replaceExisting);
							this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
							this.logger.info('==========================================================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/requirements/{{$parameter.requirementId}}/connections',
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

export const requirementFields: INodeProperties[] = [
	// ------------------------
	// Requirement: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the requirement',
	},
	{
		displayName: 'Framework ID',
		name: 'frameworkId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the framework (regulation) this requirement belongs to',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Applicability',
				name: 'isApplicable',
				type: 'options',
				options: [
					{
						name: 'Applicable',
						value: true,
					},
					{
						name: 'Not Applicable',
						value: false,
					},
				],
				default: true,
				description: 'Whether the requirement is applicable',
			},
			{
				displayName: 'Applicability Note',
				name: 'applicabilityNote',
				type: 'string',
				default: '',
				description: 'Note explaining the applicability decision for this requirement',
			},
			{
				displayName: 'Chapter Name',
				name: 'chapterName',
				type: 'string',
				default: '',
				description: 'Name of the chapter',
			},
			{
				displayName: 'Chapter Number',
				name: 'chapterNumber',
				type: 'string',
				default: '',
				description: 'Number of the chapter',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the requirement (HTML supported)',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the requirement',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Meaning',
				name: 'meaning',
				type: 'string',
				default: '',
				description: 'Explanation of the requirement meaning',
			},
			{
				displayName: 'Paragraph Number',
				name: 'paragraphNumber',
				type: 'string',
				default: '',
				description: 'Number of the paragraph',
			},
		],
	},

	// ------------------------
	// Requirement: Update - Fields
	// ------------------------
	{
		displayName: 'Requirement ID',
		name: 'requirementId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['update'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the requirement to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Applicability',
				name: 'isApplicable',
				type: 'options',
				options: [
					{
						name: 'Applicable',
						value: true,
					},
					{
						name: 'Not Applicable',
						value: false,
					},
				],
				default: true,
				description: 'Whether the requirement is applicable',
			},
			{
				displayName: 'Applicability Note',
				name: 'applicabilityNote',
				type: 'string',
				default: '',
				description: 'Note explaining the applicability decision for this requirement',
			},
			{
				displayName: 'Chapter Name',
				name: 'chapterName',
				type: 'string',
				default: '',
				description: 'Name of the chapter',
			},
			{
				displayName: 'Chapter Number',
				name: 'chapterNumber',
				type: 'string',
				default: '',
				description: 'Number of the chapter',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the requirement (HTML supported)',
			},
			{
				displayName: 'Framework ID',
				name: 'frameworkId',
				type: 'string',
				default: '',
				description: 'The ID of the framework (regulation) this requirement belongs to',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
				description: 'Comma-separated list of label IDs to attach to the requirement',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Meaning',
				name: 'meaning',
				type: 'string',
				default: '',
				description: 'Explanation of the requirement meaning',
			},
			{
				displayName: 'Paragraph Number',
				name: 'paragraphNumber',
				type: 'string',
				default: '',
				description: 'Number of the paragraph',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the requirement',
			},
		],
	},

	// ------------------------
	// Requirement: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Requirement ID',
		name: 'requirementId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the requirement to retrieve or delete',
	},

	// ------------------------
	// Requirement: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['requirement'],
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
				resource: ['requirement'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Applicability',
				name: 'applicability',
				type: 'multiOptions',
				options: [
					{
						name: 'Applicable',
						value: 'true',
					},
					{
						name: 'Not Applicable',
						value: 'false',
					},
				],
				default: [],
				description: 'Filter requirements by applicability',
			},
			{
				displayName: 'Chapter',
				name: 'chapter',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add chapter name',
				description: 'Filter by chapter names',
			},
			{
				displayName: 'Controls',
				name: 'controls',
				type: 'multiOptions',
				options: [
					{
						name: 'With Failing Controls',
						value: 'with_failing_controls',
					},
					{
						name: 'Without Controls',
						value: 'with_no_controls',
					},
				],
				default: [],
				description: 'Filter requirements by control status',
			},
			{
				displayName: 'Framework ID',
				name: 'frameworkId',
				type: 'string',
				default: '',
				placeholder: '023fb404-56f6-49cd-9379-dbf584d2eef8',
				description: 'The ID of the framework to get requirements for',
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
	// Requirement: Update Connections - Fields
	// ------------------------
	{
		displayName: 'Requirement ID',
		name: 'requirementId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the requirement to update connections for',
	},
	{
		displayName: 'Replace Existing Connections',
		name: 'replaceExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['requirement'],
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
				resource: ['requirement'],
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
				resource: ['requirement'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single risk ID or an array of IDs to connect',
	},
	{
		displayName: 'Finding IDs',
		name: 'findingIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['requirement'],
				operation: ['updateConnections'],
			},
		},
		default: '',
		placeholder: 'ID or array of IDs',
		description: 'A single finding ID or an array of IDs to connect',
	},
];
