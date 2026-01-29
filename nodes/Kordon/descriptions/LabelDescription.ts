import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting } from '../shared/utils';

export const labelOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['label'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single label',
			action: 'Get a label',
			routing: {
				request: {
					method: 'GET',
					url: '=/labels/{{$parameter.labelId}}',
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
			description: 'Get many labels',
			action: 'Get many labels',
			routing: {
				request: {
					method: 'GET',
					url: '/labels',
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
			description: 'Create a new label',
			action: 'Create a label',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Get required parameters
							const title = this.getNodeParameter('title') as string;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const additionalFields = this.getNodeParameter('additionalFields', {}) as { [key: string]: any };

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const label: { [key: string]: any } = {
								title: title,
							};

							// Add optional fields if provided
							if (additionalFields.color !== undefined && additionalFields.color !== '') {
								label.color = additionalFields.color;
							}
							if (additionalFields.labelGroupId !== undefined && additionalFields.labelGroupId !== '') {
								label.label_group_id = additionalFields.labelGroupId;
							}
							if (additionalFields.position !== undefined && additionalFields.position !== '') {
								label.position = additionalFields.position;
							}

							requestOptions.body = { label: label };

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/labels',
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
			description: 'Update an existing label',
			action: 'Update a label',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const label: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labelGroupId') {
									label['label_group_id'] = updateFields[key];
								} else if (key === 'position') {
									label['position'] = Number(updateFields[key]);
								} else {
									label[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								label: label,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/labels/{{$parameter.labelId}}',
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
			description: 'Delete a label',
			action: 'Delete a label',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/labels/{{$parameter.labelId}}',
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
	default: 'get',
};

export const labelFields: INodeProperties[] = [
	// ----------------------------------
	//         label: get
	// ----------------------------------
	{
		displayName: 'Label ID',
		name: 'labelId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['label'],
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
		placeholder: 'e.g., c2e8f3a1-9b4d-4c7e-a5f2-1d3e8b9c0a7f',
		description: 'The ID of the label',
	},

	// ----------------------------------
	//         label: getMany
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['label'],
				operation: ['getMany'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
		routing: paginationRouting,
	},

	// ----------------------------------
	//         label: create
	// ----------------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['label'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Display name of the label. Must be unique across all labels.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['label'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'string',
				default: '',
				placeholder: '#FF5733',
				description: 'Hex color code for the label (e.g., #FFC0CB, #008080)',
			},
			{
				displayName: 'Label Group ID',
				name: 'labelGroupId',
				type: 'string',
				default: '',
				placeholder: 'e.g., 018ad4a2-5f71-4758-a652-86dcf2ecc003',
				description: 'ID of the label group this label belongs to. Leave empty for ungrouped labels.',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'number',
				default: 1,
				description: 'Sort order within the group or globally. If omitted, label will be added at the end.',
			},
		],
	},

	// ----------------------------------
	//         label: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['label'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Display name of the label. Must be unique across all labels.',
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'string',
				default: '',
				placeholder: '#FF5733',
				description: 'Hex color code for the label (e.g., #FFC0CB, #008080)',
			},
			{
				displayName: 'Label Group ID',
				name: 'labelGroupId',
				type: 'string',
				default: '',
				placeholder: 'e.g., 018ad4a2-5f71-4758-a652-86dcf2ecc003',
				description: 'ID of the label group this label belongs to. Leave empty to remove from group.',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'number',
				default: 1,
				description: 'Sort order within the group or globally',
			},
		],
	},
];
