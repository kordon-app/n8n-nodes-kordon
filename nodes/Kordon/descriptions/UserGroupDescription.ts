import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting } from '../shared/utils';

/**
 * User Group resource operations for Kordon node
 */

export const userGroupOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['user_group'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new user group',
			action: 'Create a user group',
			routing: {
				request: {
					method: 'POST',
					url: '/settings/user-groups',
					body: {
						user_group: {
							name: '={{$parameter.name}}',
							description: '={{$parameter.description}}',
							color: '={{$parameter.color}}',
							include_me: false,
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
			name: 'Get Many',
			value: 'getMany',
			description: 'Get a list of user groups',
			action: 'Get many user groups',
			routing: {
				request: {
					method: 'GET',
					url: '/settings/user-groups',
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
	],
	default: 'create',
};

export const userGroupFields: INodeProperties[] = [
	// ------------------------
	// User Group: Create - Fields
	// ------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['user_group'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the user group',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['user_group'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Description of the user group',
	},
	{
		displayName: 'Color',
		name: 'color',
		type: 'color',
		displayOptions: {
			show: {
				resource: ['user_group'],
				operation: ['create'],
			},
		},
		default: '#5CDBD3',
		description: 'Color of the user group',
	},

	// ------------------------
	// User Group: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['user_group'],
				operation: ['getMany'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
		routing: paginationRouting,
	},
];
