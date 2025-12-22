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
							// Handle array parameters for label_ids
							const body = requestOptions.body as any;
							if (body && body.vendor && body.vendor.label_ids) {
								if (typeof body.vendor.label_ids === 'string') {
									body.vendor.label_ids = body.vendor.label_ids.split(',').map((id: string) => id.trim());
								} else if (!Array.isArray(body.vendor.label_ids)) {
									body.vendor.label_ids = [body.vendor.label_ids];
								}
							}

							// Log request details for debugging
							this.logger.info('=== Kordon Vendor Create Request ===');
							this.logger.info('URL: ' + requestOptions.url);
							this.logger.info('Method: ' + requestOptions.method);
							this.logger.info('Body: ' + JSON.stringify(body));
							this.logger.info('========================');

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/vendors',
					body: {
						vendor: {
							title: '={{$parameter.title}}',
							manager_id: '={{$parameter.managerId}}',
							owner_id: '={{$parameter.ownerId}}',
							state: '={{$parameter.state}}',
							criticality: '={{$parameter.additionalFields.criticality}}',
							description: '={{$parameter.additionalFields.description}}',
							contact: '={{$parameter.additionalFields.contact}}',
							country: '={{$parameter.additionalFields.country}}',
							website: '={{$parameter.additionalFields.website}}',
							contract_start_date: '={{$parameter.additionalFields.contractStartDate}}',
							contract_end_date: '={{$parameter.additionalFields.contractEndDate}}',
							personal_data_classification: '={{$parameter.additionalFields.personalDataClassification}}',
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
			description: 'Update an existing vendor',
			action: 'Update a vendor',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							const vendor: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									let labels = updateFields[key];
									if (typeof labels === 'string') {
										vendor['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										vendor['label_ids'] = labels;
									} else {
										vendor['label_ids'] = [labels];
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
				resource: ['vendor'],
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
				displayName: 'Contact',
				name: 'contact',
				type: 'string',
				default: '',
				description: 'Contact person or details',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'Country of the vendor',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website URL',
			},
			{
				displayName: 'Contract Start Date',
				name: 'contractStartDate',
				type: 'dateTime',
				default: '',
				description: 'Start date of the contract',
			},
			{
				displayName: 'Contract End Date',
				name: 'contractEndDate',
				type: 'dateTime',
				default: '',
				description: 'End date of the contract',
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
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the vendor',
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
				displayName: 'Contact',
				name: 'contact',
				type: 'string',
				default: '',
				description: 'Contact person or details',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'Country of the vendor',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website URL',
			},
			{
				displayName: 'Contract Start Date',
				name: 'contractStartDate',
				type: 'dateTime',
				default: '',
				description: 'Start date of the contract',
			},
			{
				displayName: 'Contract End Date',
				name: 'contractEndDate',
				type: 'dateTime',
				default: '',
				description: 'End date of the contract',
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
		],
	},
];
