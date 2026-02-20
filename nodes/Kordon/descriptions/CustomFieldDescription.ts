import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting } from '../shared/utils';

export const customFieldOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['custom_field'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single custom field',
			action: 'Get a custom field',
			routing: {
				request: {
					method: 'GET',
					url: '=/custom_fields/{{$parameter.customFieldId}}',
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
			description: 'Get many custom fields',
			action: 'Get many custom fields',
			routing: {
				request: {
					method: 'GET',
					url: '/custom_fields',
					returnFullResponse: true,
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
			description: 'Create a new custom field',
			action: 'Create a custom field',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Get required parameters
							const key = this.getNodeParameter('key') as string;
							const label = this.getNodeParameter('label') as string;
							const kind = this.getNodeParameter('kind') as string;
							const attributeOf = this.getNodeParameter('attributeOf') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const customField: { [key: string]: any } = {
								name: key, // Map UI "key" field to API "name" field
								label: label,
								kind: kind,
								attribute_of: attributeOf,
							};

							// Add optional fields if provided
							if (additionalFields.description !== undefined && additionalFields.description !== '') {
								customField.description = additionalFields.description;
							}
							if (additionalFields.isShownInDetailView !== undefined) {
								customField.is_shown_in_detail_view = additionalFields.isShownInDetailView;
							}

							requestOptions.body = { custom_field: customField };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/custom_fields',
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
			description: 'Update an existing custom field',
			action: 'Update a custom field',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const customField: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'key') {
									customField['name'] = updateFields[key];
								} else if (key === 'attributeOf') {
									customField['attribute_of'] = updateFields[key];
								} else if (key === 'isShownInDetailView') {
									customField['is_shown_in_detail_view'] = updateFields[key];
								} else {
									customField[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								custom_field: customField,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/custom_fields/{{$parameter.customFieldId}}',
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
			description: 'Delete a custom field',
			action: 'Delete a custom field',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/custom_fields/{{$parameter.customFieldId}}',
				},
			},
		},
	],
	default: 'get',
};

export const customFieldFields: INodeProperties[] = [
	// ----------------------------------
	//         custom_field: get
	// ----------------------------------
	{
		displayName: 'Custom Field ID',
		name: 'customFieldId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., 83d028c1-9ce1-4f29-ad2b-994c2d0ebd4f',
		description: 'The ID of the custom field',
	},

	// ----------------------------------
	//         custom_field: getMany
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['getMany'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
		routing: paginationRouting,
	},

	// ----------------------------------
	//         custom_field: create
	// ----------------------------------
	{
		displayName: 'Attribute Of',
		name: 'attributeOf',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Asset',
				value: 'Asset',
			},
			{
				name: 'Business Process',
				value: 'BusinessProcess',
			},
			{
				name: 'Control',
				value: 'Control',
			},
			{
				name: 'Requirement',
				value: 'Requirement',
			},
			{
				name: 'Risk',
				value: 'Risk',
			},
			{
				name: 'Task',
				value: 'Task',
			},
			{
				name: 'Vendor',
				value: 'Vendor',
			},
		],
		default: 'Requirement',
		description: 'The resource type this custom field can be used with',
	},
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['create'],
			},
		},
		default: '',
		placeholder: 'e.g., My Custom Field',
		description: 'Display name shown to users in the UI',
	},
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['create'],
			},
		},
		default: '',
		placeholder: 'e.g., my_custom_field',
		description: 'Internal field name (lowercase with underscores). This is used as the key when setting values on resources.',
	},
	{
		displayName: 'Type',
		name: 'kind',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'String',
				value: 'string',
				description: 'Text input field',
			},
		],
		default: 'string',
		description: 'The data type of the custom field',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder: 'e.g., Track the compliance status of requirements',
				description: 'Optional description of the field\'s purpose',
			},
			{
				displayName: 'Visible in UI',
				name: 'isShownInDetailView',
				type: 'boolean',
				default: true,
				description: 'Whether the field is displayed in the resource detail view',
			},
		],
	},

	// ----------------------------------
	//         custom_field: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['custom_field'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Attribute Of',
				name: 'attributeOf',
				type: 'options',
				options: [
					{
						name: 'Asset',
						value: 'Asset',
					},
					{
						name: 'Business Process',
						value: 'BusinessProcess',
					},
					{
						name: 'Control',
						value: 'Control',
					},
					{
						name: 'Requirement',
						value: 'Requirement',
					},
					{
						name: 'Risk',
						value: 'Risk',
					},
					{
						name: 'Task',
						value: 'Task',
					},
					{
						name: 'Vendor',
						value: 'Vendor',
					},
				],
				default: 'Requirement',
				description: 'The resource type this custom field can be used with',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder: 'e.g., Track the compliance status of requirements',
				description: 'Optional description of the field\'s purpose',
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				placeholder: 'e.g., my_custom_field',
				description: 'Internal field name (lowercase with underscores)',
			},
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				default: '',
				placeholder: 'e.g., My Custom Field',
				description: 'Display name shown to users in the UI',
			},
			{
				displayName: 'Type',
				name: 'kind',
				type: 'options',
				options: [
					{
						name: 'String',
						value: 'string',
						description: 'Text input field',
					},
				],
				default: 'string',
				description: 'The data type of the custom field',
			},
			{
				displayName: 'Visible in UI',
				name: 'isShownInDetailView',
				type: 'boolean',
				default: true,
				description: 'Whether the field is displayed in the resource detail view',
			},
		],
	},
];
