import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting } from '../shared/utils';

/**
 * Framework resource operations for Kordon node
 */

export const frameworkDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a framework',
	action: 'Delete a framework',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/regulations/{{$parameter.frameworkId}}',
		},
		output: {
			postReceive: [
				{
					type: 'rootProperty' as const,
					properties: {
						property: 'data',
					},
				},
			],
		},
	},
};

export const frameworkOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['regulation'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new framework',
			action: 'Create a framework',
			routing: {
				request: {
					method: 'POST',
					url: '/regulations',
					body: {
						regulation: {
							title: '={{$parameter.title}}',
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
			name: 'Get',
			value: 'get',
			description: 'Get a single framework',
			action: 'Get a framework',
			routing: {
				request: {
					method: 'GET',
					url: '=/regulations/{{$parameter.frameworkId}}',
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
			description: 'Get a list of frameworks',
			action: 'Get many frameworks',
			routing: {
				request: {
					method: 'GET',
					url: '/regulations',
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
			name: 'Update',
			value: 'update',
			description: 'Update an existing framework',
			action: 'Update a framework',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							const regulation: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								regulation[key] = updateFields[key];
							}

							requestOptions.body = {
								regulation: regulation,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/regulations/{{$parameter.frameworkId}}',
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
		frameworkDeleteOperation,
	],
	default: 'getMany',
};

export const frameworkFields: INodeProperties[] = [
	// ------------------------
	// Framework: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['regulation'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The name of the framework',
	},

	// ------------------------
	// Framework: Update - Fields
	// ------------------------
	{
		displayName: 'Framework ID',
		name: 'frameworkId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['regulation'],
				operation: ['update'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the framework to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['regulation'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The name of the framework',
			},
		],
	},

	// ------------------------
	// Framework: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Framework ID',
		name: 'frameworkId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['regulation'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'b698a0ed-ad82-4468-900e-3b6eb3f5eb9b',
		description: 'The ID of the framework to retrieve or delete',
	},

	// ------------------------
	// Framework: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['regulation'],
				operation: ['getMany'],
			},
		},
		default: true,
		description: 'Whether to return all results or use pagination',
		routing: paginationRouting,
	},
];
