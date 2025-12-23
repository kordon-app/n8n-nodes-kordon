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
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const body = requestOptions.body as any;

							// Handle label_ids if present
							if (body.requirement && body.requirement.label_ids) {
								if (typeof body.requirement.label_ids === 'string') {
									body.requirement.label_ids = (body.requirement.label_ids as string).split(',').map((id: string) => id.trim());
								} else if (!Array.isArray(body.requirement.label_ids)) {
									body.requirement.label_ids = [body.requirement.label_ids];
								}
							}

							// Handle regulation_ids (Framework ID) - ensure it's an array
							if (body.requirement && body.requirement.regulation_ids) {
								if (typeof body.requirement.regulation_ids === 'string') {
									body.requirement.regulation_ids = [body.requirement.regulation_ids];
								} else if (!Array.isArray(body.requirement.regulation_ids)) {
									body.requirement.regulation_ids = [body.requirement.regulation_ids];
								}
							}

							return requestOptions;
						},
					],
				},
				request: {
					method: 'POST',
					url: '/requirements',
					body: {
						requirement: {
							title: '={{$parameter.title}}',
							regulation_ids: '={{$parameter.frameworkId}}',
							description: '={{$parameter.additionalFields.description}}',
							chapter_name: '={{$parameter.additionalFields.chapterName}}',
							chapter_number: '={{$parameter.additionalFields.chapterNumber}}',
							paragraph_number: '={{$parameter.additionalFields.paragraphNumber}}',
							meaning: '={{$parameter.additionalFields.meaning}}',
							label_ids: '={{$parameter.additionalFields.labels}}',
							is_applicable: '={{$parameter.additionalFields.isApplicable}}',
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
];
