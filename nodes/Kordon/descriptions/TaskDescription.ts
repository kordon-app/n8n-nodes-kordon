import type { INodeProperties } from 'n8n-workflow';
import { paginationRouting, handleArrayParameter } from '../shared/utils';

/**
 * Task resource operations for Kordon node
 */

export const taskDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a task',
	action: 'Delete a task',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/tasks/{{$parameter.taskId}}',
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

export const taskOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['task'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get a single task',
			action: 'Get a task',
			routing: {
				request: {
					method: 'GET',
					url: '=/tasks/{{$parameter.taskId}}',
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
			description: 'Get many tasks',
			action: 'Get many tasks',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							// Handle array parameters
							handleArrayParameter(requestOptions, 'kind');
							handleArrayParameter(requestOptions, 'state');
							handleArrayParameter(requestOptions, 'assignee');

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
					url: '/tasks',
					returnFullResponse: true,
					qs: {
						'kind[]': '={{$parameter.options.kind}}',
						'state[]': '={{$parameter.options.state}}',
						'assignee[]': '={{$parameter.options.assignee}}',
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
			description: 'Create a new task',
			action: 'Create a task',
			routing: {
				request: {
					method: 'POST',
					url: '/tasks',
					body: {
						title: '={{$parameter.title}}',
						assignee_id: '={{$parameter.assigneeId}}',
						kind: '={{$parameter.kind}}',
						frequency: '={{$parameter.frequency}}',
						due_at: '={{$parameter.dueAt}}',
						description: '={{$parameter.additionalFields.description}}',
						needs_evidence: '={{$parameter.additionalFields.needsEvidence}}',
						duration: '={{$parameter.additionalFields.duration}}',
						labels: '={{$parameter.additionalFields.labels}}',
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
			description: 'Update an existing task',
			action: 'Update a task',
			routing: {
				send: {
					preSend: [
						async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
							const task: { [key: string]: any } = {};

							for (const key of Object.keys(updateFields)) {
								if (key === 'labels') {
									let labels = updateFields[key];
									if (typeof labels === 'string') {
										task['label_ids'] = labels.split(',').map((id: string) => id.trim());
									} else if (Array.isArray(labels)) {
										task['label_ids'] = labels;
									} else {
										task['label_ids'] = [labels];
									}
								} else if (key === 'assigneeId') {
									task['assignee_id'] = updateFields[key];
								} else if (key === 'dueAt') {
									task['due_at'] = updateFields[key];
								} else if (key === 'needsEvidence') {
									task['needs_evidence'] = updateFields[key];
								} else {
									task[key] = updateFields[key];
								}
							}

							requestOptions.body = {
								task: task,
							};

							return requestOptions;
						},
					],
				},
				request: {
					method: 'PATCH',
					url: '=/tasks/{{$parameter.taskId}}',
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
		taskDeleteOperation,
	],
	default: 'getMany',
};

export const taskFields: INodeProperties[] = [
	// ------------------------
	// Task: Create - Fields
	// ------------------------
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The title of the task',
	},
	{
		displayName: 'Assignee ID',
		name: 'assigneeId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the user assigned to the task',
	},
	{
		displayName: 'Kind',
		name: 'kind',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Audit',
				value: 'audit',
			},
			{
				name: 'Maintenance',
				value: 'maintenance',
			},
			{
				name: 'Review',
				value: 'review',
			},
		],
		default: 'maintenance',
		description: 'The kind of task',
	},
	{
		displayName: 'Frequency',
		name: 'frequency',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Once',
				value: 'once',
			},
			{
				name: 'Weekly',
				value: 'weekly',
			},
			{
				name: 'Monthly',
				value: 'monthly',
			},
			{
				name: 'Quarterly',
				value: 'quarterly',
			},
			{
				name: 'Semi-Annual',
				value: 'semi-annual',
			},
			{
				name: 'Annual',
				value: 'annual',
			},
		],
		default: 'once',
		description: 'How often the task should repeat',
	},
	{
		displayName: 'Due At',
		name: 'dueAt',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'When the task is due',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the task',
			},
			{
				displayName: 'Needs Evidence',
				name: 'needsEvidence',
				type: 'boolean',
				default: false,
				description: 'Whether the task requires evidence to be completed',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				default: 0,
				description: 'Estimated duration in minutes',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				description: 'Comma-separated list of label IDs',
			},
		],
	},

	// ------------------------
	// Task: Update - Fields
	// ------------------------
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['update'],
			},
		},
		default: '',
		placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
		description: 'The ID of the task to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the task',
			},
			{
				displayName: 'Assignee ID',
				name: 'assigneeId',
				type: 'string',
				default: '',
				description: 'The ID of the user assigned to the task',
			},
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				options: [
					{
						name: 'Audit',
						value: 'audit',
					},
					{
						name: 'Maintenance',
						value: 'maintenance',
					},
					{
						name: 'Review',
						value: 'review',
					},
				],
				default: 'maintenance',
				description: 'The kind of task',
			},
			{
				displayName: 'Frequency',
				name: 'frequency',
				type: 'options',
				options: [
					{
						name: 'Once',
						value: 'once',
					},
					{
						name: 'Weekly',
						value: 'weekly',
					},
					{
						name: 'Monthly',
						value: 'monthly',
					},
					{
						name: 'Quarterly',
						value: 'quarterly',
					},
					{
						name: 'Semi-Annual',
						value: 'semi-annual',
					},
					{
						name: 'Annual',
						value: 'annual',
					},
				],
				default: 'once',
				description: 'How often the task should repeat',
			},
			{
				displayName: 'Due At',
				name: 'dueAt',
				type: 'dateTime',
				default: '',
				description: 'When the task is due',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the task',
			},
			{
				displayName: 'Needs Evidence',
				name: 'needsEvidence',
				type: 'boolean',
				default: false,
				description: 'Whether the task requires evidence to be completed',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				default: 0,
				description: 'Estimated duration in minutes',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				description: 'Comma-separated list of label IDs',
				typeOptions: {
					multipleValues: true,
				},
			},
		],
	},

	// ------------------------
	// Task: Get/Delete - Fields
	// ------------------------
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['get', 'delete'],
			},
		},
		default: '',
		placeholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'The ID of the task to retrieve or delete',
	},

	// ------------------------
	// Task: Get Many - Options
	// ------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['task'],
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
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'multiOptions',
				default: [],
				description: 'Filter by task kind',
				options: [
					{
						name: 'Audit',
						value: 'audit',
					},
					{
						name: 'Maintenance',
						value: 'maintenance',
					},
					{
						name: 'Review',
						value: 'review',
					},
				],
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'multiOptions',
				default: [],
				description: 'Filter by task state',
				options: [
					{
						name: 'New',
						value: 'new',
					},
					{
						name: 'Done',
						value: 'done',
					},
					{
						name: 'Failed',
						value: 'failed',
					},
				],
			},
			{
				displayName: 'Assignee',
				name: 'assignee',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add assignee user ID',
				description: 'Filter by assignee user IDs',
			},
		],
	},
];
