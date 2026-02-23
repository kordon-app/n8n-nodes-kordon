import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, createEnhancedError } from '../shared/utils';

/**
 * User resource operations for Kordon node
 */

export const userOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['user'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new user',
			action: 'Create a user',
			routing: {
				request: {
					method: 'POST',
					url: '/settings/users',
					ignoreHttpStatusErrors: true,
					returnFullResponse: true,
					body: {
						name: '={{$parameter.name}}',
						email: '={{$parameter.email}}',
						role: '={{$parameter.role}}',
						active: '={{$parameter.active}}',
					},
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							const statusCode = response.statusCode || 0;
							if (statusCode >= 400) {
								throw createEnhancedError(
									{
										resource: 'user',
										operation: 'create',
										node: this.getNode(),
									},
									response,
									this.continueOnFail(),
								);
							}
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
			name: 'Get',
			value: 'get',
			description: 'Get a single user',
			action: 'Get a user',
			routing: {
				request: {
					method: 'GET',
					url: '=/users/{{$parameter.userId}}',
					ignoreHttpStatusErrors: true,
					returnFullResponse: true,
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							const userId = this.getNodeParameter('userId', 0) as string;
							const statusCode = response.statusCode || 0;
							if (statusCode >= 400) {
								throw createEnhancedError(
									{
										resource: 'user',
										operation: 'get',
										itemId: userId,
										node: this.getNode(),
									},
									response,
									this.continueOnFail(),
								);
							}
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
			name: 'Get Many',
			value: 'getMany',
			description: 'Get a list of users',
			action: 'Get many users',
			routing: {
				request: {
					method: 'GET',
					url: '/users',
					ignoreHttpStatusErrors: true,
					returnFullResponse: true,
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							const statusCode = response.statusCode || 0;
							if (statusCode >= 400) {
								throw createEnhancedError(
									{
										resource: 'user',
										operation: 'getMany',
										node: this.getNode(),
									},
									response,
									this.continueOnFail(),
								);
							}
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
			name: 'Update',
			value: 'update',
			description: 'Update a user',
			action: 'Update a user',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const updateFields = this.getNodeParameter('updateFields', 0) as { [key: string]: any };

							// Wrap in 'user' object as expected by API
							requestOptions.body = {
								user: updateFields,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/settings/users/{{$parameter.userId}}',
					ignoreHttpStatusErrors: true,
					returnFullResponse: true,
				},
				output: {
					postReceive: [
						async function (this, items, response) {
							const userId = this.getNodeParameter('userId', 0) as string;
							const statusCode = response.statusCode || 0;
							if (statusCode >= 400) {
								throw createEnhancedError(
									{
										resource: 'user',
										operation: 'update',
										itemId: userId,
										node: this.getNode(),
									},
									response,
									this.continueOnFail(),
								);
							}
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
	],
	default: 'getMany',
};

export const userFields: INodeProperties[] = [
	// ------------------------
	// User: Create - Fields
	// ------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Full name of the user',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Email address of the user',
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'User',
				value: 'user',
			},
			{
				name: 'Manager',
				value: 'manager',
			},
			{
				name: 'Auditor',
				value: 'auditor',
			},
			{
				name: 'Admin',
				value: 'admin',
			},
		],
		default: 'user',
		description: 'Role to assign to the user',
	},
	{
		displayName: 'Active',
		name: 'active',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create'],
			},
		},
		default: true,
		description: 'Whether the user is active',
	},

	// ------------------------
	// User: Update - Fields
	// ------------------------
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['update'],
			},
		},
		default: '',
		placeholder: 'e.g., 2a7c8cf0-a4c0-4cd5-83f4-0a5ebdf1fa83',
		description: 'The ID of the user to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The name of the user',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'The email of the user',
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Manager',
						value: 'manager',
					},
					{
						name: 'Auditor',
						value: 'auditor',
					},
					{
						name: 'Admin',
						value: 'admin',
					},
				],
				default: 'user',
				description: 'Role to assign to the user',
			},
			{
				displayName: 'Active',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether the user is active',
			},
		],
	},

	// ------------------------
	// User: Get - Fields
	// ------------------------
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['get'],
			},
		},
		default: '',
		placeholder: '2a7c8cf0-a4c0-4cd5-83f4-0a5ebdf1fa83',
		description: 'The ID of the user to retrieve',
	},

	// ------------------------
	// User: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getMany'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
		routing: paginationRouting,
	},
];
