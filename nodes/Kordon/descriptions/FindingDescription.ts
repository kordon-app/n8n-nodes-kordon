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
							const body = requestOptions.body as any;

							// Handle label_ids if present
							if (body.finding && body.finding.label_ids) {
								if (typeof body.finding.label_ids === 'string') {
									body.finding.label_ids = (body.finding.label_ids as string).split(',').map((id: string) => id.trim());
								} else if (!Array.isArray(body.finding.label_ids)) {
									body.finding.label_ids = [body.finding.label_ids];
								}
							}

							// Log request details for debugging
							this.logger.info('=== Kordon API Request (Create Finding) ===');
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
					url: '/findings',
					body: {
						finding: {
							title: '={{$parameter.title}}',
							kind: '={{$parameter.kind}}',
							owner_group_id: '={{$parameter.ownerGroupId}}',
							manager_group_id: '={{$parameter.managerGroupId}}',
							state: '={{$parameter.state}}',
							priority: '={{$parameter.priority}}',
							source: '={{$parameter.source}}',
							date_discovered: '={{$parameter.dateDiscovered}}',
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
			description: 'Update an existing finding',
			action: 'Update a finding',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
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
				name: 'Audit',
				value: 'audit',
			},
			{
				name: 'Incident',
				value: 'incident',
			},
			{
				name: 'Assessment',
				value: 'assessment',
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
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the finding',
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
				displayName: 'Owner Group ID',
				name: 'ownerGroupId',
				type: 'string',
				default: '',
				description: 'The ID of the owner group',
			},
			{
				displayName: 'Manager Group ID',
				name: 'managerGroupId',
				type: 'string',
				default: '',
				description: 'The ID of the manager group',
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
						name: 'Audit',
						value: 'audit',
					},
					{
						name: 'Incident',
						value: 'incident',
					},
					{
						name: 'Assessment',
						value: 'assessment',
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
		],
	},
];
