import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { assetDeleteOperation } from './descriptions/AssetDescription';
import { businessProcessDeleteOperation } from './descriptions/BusinessProcessDescription';
import { controlOperations, controlFields } from './descriptions/ControlDescription';
import { findingOperations, findingFields } from './descriptions/FindingDescription';
import { frameworkOperations, frameworkFields } from './descriptions/FrameworkDescription';
import { requirementOperations, requirementFields } from './descriptions/RequirementDescription';
import { riskOperations, riskFields } from './descriptions/RiskDescription';
import { taskOperations, taskFields } from './descriptions/TaskDescription';
import { vendorDeleteOperation } from './descriptions/VendorDescription';
import { userOperations, userFields } from './descriptions/UserDescription';
import { userGroupOperations, userGroupFields } from './descriptions/UserGroupDescription';
import { paginationRouting, handleArrayParameter } from './shared/utils';

export class Kordon implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kordon',
		name: 'kordon',
		icon: { light: 'file:../../icons/kordon.svg', dark: 'file:../../icons/kordon.svg' },
		group: ['input'],
		version: 1,
		description: 'Interact with the Kordon API',
		defaults: {
			name: 'Kordon',
		},

		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],

		credentials: [
			{
				name: 'kordonApi',
				required: true,
			},
		],

		// Base configuration for all requests
		requestDefaults: {
			baseURL: '={{$credentials.domain}}/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: '={{"Bearer " + $credentials.apiKey}}',
			},
		},

		properties: [
			// ------------------------
			// Resource
			// ------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Asset',
						value: 'asset',
					},
					{
						name: 'Business Process',
						value: 'business_process',
					},
					{
						name: 'Control',
						value: 'control',
					},
					{
						name: 'Finding',
						value: 'finding',
					},
					{
						name: 'Framework',
						value: 'regulation',
					},
					{
						name: 'Requirement',
						value: 'requirement',
					},
					{
						name: 'Risk',
						value: 'risk',
					},
					{
						name: 'Task',
						value: 'task',
					},
					{
						name: 'Vendor',
						value: 'vendor',
					},
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'User Group',
						value: 'user_group',
					},
				],
				default: 'user',
			},

			// ------------------------
		// ------------------------
		// Asset - Operation
		// ------------------------
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: ['asset'],
				},
			},
			options: [
				{
					name: 'Get',
					value: 'get',
					description: 'Get a single asset',
					action: 'Get an asset',
					routing: {
						request: {
							method: 'GET',
							url: '=/assets/{{$parameter.assetId}}',
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
					description: 'Get many assets',
					action: 'Get many assets',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									// Handle array parameters
									handleArrayParameter(requestOptions, 'state');
									handleArrayParameter(requestOptions, 'asset_value');
									handleArrayParameter(requestOptions, 'health');
									handleArrayParameter(requestOptions, 'owner');
									handleArrayParameter(requestOptions, 'manager');
									handleArrayParameter(requestOptions, 'labels');

									// Log request details for debugging
									this.logger.info('=== Kordon API Request ===');
									this.logger.info('URL: ' + requestOptions.url);
									this.logger.info('Method: ' + requestOptions.method);
									this.logger.info('Query Params: ' + JSON.stringify(requestOptions.qs));
									this.logger.info('Headers: ' + JSON.stringify(requestOptions.headers));
									this.logger.info('========================');
									return requestOptions;
								},
							],
						},
						request: {
							method: 'GET',
							url: '/assets',
							returnFullResponse: true,
							qs: {
								'state[]': '={{$parameter.options.state}}',
								'asset_value[]': '={{$parameter.options.asset_value}}',
								'health[]': '={{$parameter.options.health}}',
								'owner[]': '={{$parameter.options.owner}}',
								'manager[]': '={{$parameter.options.manager}}',
								'labels[]': '={{$parameter.options.labels}}'
							},
						},
						output: {
							postReceive: [
								async function (this, items, response) {
									// Log response details for debugging
									this.logger.info('=== Kordon API Response ===');
									this.logger.info('Status Code: ' + response.statusCode);
									this.logger.info('Response Body Type: ' + typeof response.body);
									
									const body = response.body as any;
									if (body) {
										this.logger.info('Has data property: ' + (!!body.data));
										this.logger.info('Data length: ' + (body.data ? body.data.length : 'N/A'));
										this.logger.info('Has meta property: ' + (!!body.meta));
										if (body.meta) {
											this.logger.info('Meta: ' + JSON.stringify(body.meta));
										}
									}
									this.logger.info('Items received: ' + items.length);
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
					description: 'Create a new asset',
					action: 'Create an asset',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									// Handle array parameters for label_ids
									const body = requestOptions.body as any;
									if (body && body.asset && body.asset.label_ids) {
										if (typeof body.asset.label_ids === 'string') {
											body.asset.label_ids = body.asset.label_ids.split(',').map((id: string) => id.trim());
										} else if (!Array.isArray(body.asset.label_ids)) {
											body.asset.label_ids = [body.asset.label_ids];
										}
									}
									return requestOptions;
								},
							],
						},
						request: {
							method: 'POST',
							url: '/assets',
							body: {
								asset: {
									title: '={{$parameter.title}}',
									manager_id: '={{$parameter.managerId}}',
									owner_id: '={{$parameter.ownerId}}',
									description: '={{$parameter.description}}',
									asset_value: '={{$parameter.assetValue}}',
									state: '={{$parameter.additionalFields.state}}',
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
					description: 'Update an existing asset',
					action: 'Update an asset',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
							const updateFields = this.getNodeParameter('updateFields', 0) as { [key: string]: any };
									const asset: { [key: string]: any } = {};

									// Map UI fields to API fields
									for (const key of Object.keys(updateFields)) {
										if (key === 'labels') {
											let labels = updateFields[key];
											if (typeof labels === 'string') {
												asset['label_ids'] = labels.split(',').map((id: string) => id.trim());
											} else if (Array.isArray(labels)) {
												asset['label_ids'] = labels;
											} else {
												asset['label_ids'] = [labels];
											}
										} else if (key === 'managerId') {
											asset['manager_id'] = updateFields[key];
										} else if (key === 'ownerId') {
											asset['owner_id'] = updateFields[key];
										} else if (key === 'assetValue') {
											asset['asset_value'] = updateFields[key];
										} else {
											asset[key] = updateFields[key];
										}
									}

									requestOptions.body = {
										asset: asset,
									};

									// Log request details for debugging
									this.logger.info('=== Kordon API Update Asset Request ===');
									this.logger.info('URL: ' + requestOptions.url);
									this.logger.info('Method: ' + requestOptions.method);
									this.logger.info('Body: ' + JSON.stringify(requestOptions.body));
									this.logger.info('=======================================');

									return requestOptions;
								},
							],
						},
						request: {
							method: 'PATCH',
							url: '=/assets/{{$parameter.assetId}}',
						},
						output: {
							postReceive: [
								async function (this, items, response) {
									// Log response details for debugging
									this.logger.info('=== Kordon API Update Asset Response ===');
									this.logger.info('Status Code: ' + response.statusCode);
									this.logger.info('Response Body: ' + JSON.stringify(response.body));
									this.logger.info('========================================');
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
				assetDeleteOperation,
			],
			default: 'getMany',
		},

		// ------------------------
		// Asset: Create - Fields
		// ------------------------
		{
			displayName: 'Title',
			name: 'title',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The title of the asset',
		},
		{
			displayName: 'Manager ID',
			name: 'managerId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The ID of the user who manages the asset',
		},
		{
			displayName: 'Owner ID',
			name: 'ownerId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The ID of the user who owns the asset',
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'Detailed description of the asset (HTML supported)',
		},
		{
			displayName: 'Asset Value',
			name: 'assetValue',
			type: 'options',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['create'],
				},
			},
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
			description: 'The value of the asset',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['create'],
				},
			},
			options: [
				{
					displayName: 'State',
					name: 'state',
					type: 'options',
					options: [
						{
							name: 'Live',
							value: 'live',
						},
						{
							name: 'Planned',
							value: 'planned',
						},
						{
							name: 'Deprecated',
							value: 'deprecated',
						},
					],
					default: 'live',
					description: 'The state of the asset',
				},
				{
					displayName: 'Labels',
					name: 'labels',
					type: 'string',
					default: '',
					placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
					description: 'Comma-separated list of label IDs to attach to the asset',
					typeOptions: {
						multipleValues: true,
					},
				},
			],
		},

		// ------------------------
		// Asset: Update - Fields
		// ------------------------
		{
			displayName: 'Asset ID',
			name: 'assetId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['update'],
				},
			},
			default: '',
			description: 'The ID of the asset to update',
		},
		{
			displayName: 'Update Fields',
			name: 'updateFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['update'],
				},
			},
			options: [
				{
					displayName: 'Title',
					name: 'title',
					type: 'string',
					default: '',
					description: 'The title of the asset',
				},
				{
					displayName: 'Manager ID',
					name: 'managerId',
					type: 'string',
					default: '',
					description: 'The ID of the user who manages the asset',
				},
				{
					displayName: 'Owner ID',
					name: 'ownerId',
					type: 'string',
					default: '',
					description: 'The ID of the user who owns the asset',
				},
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
					description: 'Detailed description of the asset (HTML supported)',
				},
				{
					displayName: 'Asset Value',
					name: 'assetValue',
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
					description: 'The value of the asset',
				},
				{
					displayName: 'State',
					name: 'state',
					type: 'options',
					options: [
						{
							name: 'Live',
							value: 'live',
						},
						{
							name: 'Planned',
							value: 'planned',
						},
						{
							name: 'Deprecated',
							value: 'deprecated',
						},
					],
					default: 'live',
					description: 'The state of the asset',
				},
				{
					displayName: 'Labels',
					name: 'labels',
					type: 'string',
					default: '',
					placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
					description: 'Comma-separated list of label IDs to attach to the asset',
					typeOptions: {
						multipleValues: true,
					},
				},
			],
		},

		// ------------------------
		// Asset: Get/Delete - Fields
		// ------------------------
		{
			displayName: 'Asset ID',
			name: 'assetId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['get', 'delete'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the asset to retrieve or delete',
		},

		// ------------------------
		// Asset: Get Many - Options
		// ------------------------
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: ['asset'],
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
					resource: ['asset'],
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
							name: 'Live',
							value: 'live',
						},
						{
							name: 'Planned',
							value: 'planned',
						},
						{
							name: 'Deprecated',
							value: 'deprecated',
						},
					],
					default: [],
					description: 'Filter assets by state',
				},
				{
					displayName: 'Asset Value',
					name: 'asset_value',
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
					description: 'Filter assets by value',
				},
				{
					displayName: 'Health',
					name: 'health',
					type: 'multiOptions',
					options: [
						{
							name: 'With Failing Controls',
							value: 'with_failing_controls',
						},
						{
							name: 'With No Controls',
							value: 'with_no_controls',
						},
						{
							name: 'With Unmitigated Risks',
							value: 'with_unmitigated_risks',
						},
					],
					default: [],
					description: 'Filter assets by health status',
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
		// Business Process - Operation
		// ------------------------
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: ['business_process'],
				},
			},
			options: [
				{
					name: 'Create',
					value: 'create',
					description: 'Create a new business process',
					action: 'Create a business process',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									const body = requestOptions.body as any;
									
									// Handle label_ids if present
									if (body.business_process && body.business_process.label_ids) {
										if (typeof body.business_process.label_ids === 'string') {
											body.business_process.label_ids = (body.business_process.label_ids as string).split(',').map((id: string) => id.trim());
										} else if (!Array.isArray(body.business_process.label_ids)) {
											body.business_process.label_ids = [body.business_process.label_ids];
										}
									}

									// Log request details for debugging
									this.logger.info('=== Kordon API Request (Create Business Process) ===');
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
							url: '/business-processes',
							body: {
								business_process: {
									title: '={{$parameter.title}}',
									owner_id: '={{$parameter.owner_id}}',
									criticality: '={{$parameter.additionalFields.criticality}}',
									monetary_value: '={{$parameter.additionalFields.monetary_value}}',
									currency: '={{$parameter.additionalFields.currency}}',
									label_ids: '={{$parameter.additionalFields.labels}}',
									description: '={{$parameter.additionalFields.description}}',
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
					description: 'Get a single business process',
					action: 'Get a business process',
					routing: {
						request: {
							method: 'GET',
							url: '=/business-processes/{{$parameter.businessProcessId}}',
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
					description: 'Get many business processes',
					action: 'Get many business processes',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									// Handle array parameters
									handleArrayParameter(requestOptions, 'criticality');
									handleArrayParameter(requestOptions, 'owner');
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
							url: '/business-processes',
							returnFullResponse: true,
							qs: {
								'criticality[]': '={{$parameter.options.criticality}}',
								'owner[]': '={{$parameter.options.owner}}',
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
					name: 'Update',
					value: 'update',
					description: 'Update an existing business process',
					action: 'Update a business process',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
									const businessProcess: { [key: string]: any } = {};

									for (const key of Object.keys(updateFields)) {
										if (key === 'labels') {
											let labels = updateFields[key];
											if (typeof labels === 'string') {
												businessProcess['label_ids'] = labels.split(',').map((id: string) => id.trim());
											} else if (Array.isArray(labels)) {
												businessProcess['label_ids'] = labels;
											} else {
												businessProcess['label_ids'] = [labels];
											}
										} else if (key === 'ownerId') {
											businessProcess['owner_id'] = updateFields[key];
										} else {
											businessProcess[key] = updateFields[key];
										}
									}

									requestOptions.body = {
										business_process: businessProcess,
									};

									return requestOptions;
								},
							],
						},
						request: {
							method: 'PATCH',
							url: '=/business-processes/{{$parameter.businessProcessId}}',
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
			businessProcessDeleteOperation,
			],
			default: 'getMany',
		},

		// ------------------------
		// Business Process: Create - Fields
		// ------------------------
		{
			displayName: 'Title',
			name: 'title',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['business_process'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The title of the business process',
		},
		{
			displayName: 'Owner ID',
			name: 'owner_id',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['business_process'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The ID of the owner',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['business_process'],
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
					description: 'The criticality of the business process',
				},
				{
					displayName: 'Monetary Value',
					name: 'monetary_value',
					type: 'number',
					default: 0,
					description: 'The monetary value of the business process',
				},
				{
					displayName: 'Currency',
					name: 'currency',
					type: 'options',
					options: [
						{
							name: 'USD',
							value: 'USD',
						},
						{
							name: 'EUR',
							value: 'EUR',
						},
						{
							name: 'GBP',
							value: 'GBP',
						},
						{
							name: 'JPY',
							value: 'JPY',
						},
						{
							name: 'CAD',
							value: 'CAD',
						},
						{
							name: 'AUD',
							value: 'AUD',
						},
					],
					default: 'USD',
					description: 'The currency of the monetary value',
				},
				{
					displayName: 'Labels',
					name: 'labels',
					type: 'string',
					default: '',
					placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
					description: 'Comma-separated list of label IDs to attach to the business process',
					typeOptions: {
						multipleValues: true,
					},
				},
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					typeOptions: {
						rows: 4,
					},
					default: '',
					description: 'The description of the business process',
				},
			],
		},

		// ------------------------
		// Business Process: Update - Fields
		// ------------------------
		{
			displayName: 'Business Process ID',
			name: 'businessProcessId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['business_process'],
					operation: ['update'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the business process to update',
		},
		{
			displayName: 'Update Fields',
			name: 'updateFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['business_process'],
					operation: ['update'],
				},
			},
			options: [
				{
					displayName: 'Title',
					name: 'title',
					type: 'string',
					default: '',
					description: 'The title of the business process',
				},
				{
					displayName: 'Owner ID',
					name: 'ownerId',
					type: 'string',
					default: '',
					description: 'The ID of the owner',
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
					description: 'The criticality of the business process',
				},
				{
					displayName: 'Monetary Value',
					name: 'monetary_value',
					type: 'number',
					default: 0,
					description: 'The monetary value of the business process',
				},
				{
					displayName: 'Currency',
					name: 'currency',
					type: 'options',
					options: [
						{
							name: 'USD',
							value: 'USD',
						},
						{
							name: 'EUR',
							value: 'EUR',
						},
						{
							name: 'GBP',
							value: 'GBP',
						},
						{
							name: 'JPY',
							value: 'JPY',
						},
						{
							name: 'CAD',
							value: 'CAD',
						},
						{
							name: 'AUD',
							value: 'AUD',
						},
					],
					default: 'USD',
					description: 'The currency of the monetary value',
				},
				{
					displayName: 'Labels',
					name: 'labels',
					type: 'string',
					default: '',
					placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
					description: 'Comma-separated list of label IDs to attach to the business process',
					typeOptions: {
						multipleValues: true,
					},
				},
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					typeOptions: {
						rows: 4,
					},
					default: '',
					description: 'The description of the business process',
				},
			],
		},

		// ------------------------
		// Business Process: Get/Delete - Fields
		// ------------------------
		{
			displayName: 'Business Process ID',
			name: 'businessProcessId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['business_process'],
					operation: ['get', 'delete'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the business process to retrieve or delete',
		},

		// ------------------------
		// Business Process: Get Many - Options
		// ------------------------
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: ['business_process'],
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
					resource: ['business_process'],
					operation: ['getMany'],
				},
			},
			options: [
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
					description: 'Filter business processes by criticality level',
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

		controlOperations,
		...controlFields,

			// ------------------------
			// Vendor - Operation
			// ------------------------
			{
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
				vendorDeleteOperation,
				],
				default: 'getMany',
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

			// User operations and fields
			userOperations,
			...userFields,

			// User Group operations and fields
			userGroupOperations,
			...userGroupFields,

			// Task operations and fields
			taskOperations,
			...taskFields,

			// Finding operations and fields
			findingOperations,
			...findingFields,

			// Framework operations and fields
			frameworkOperations,
			...frameworkFields,

			// Risk operations and fields
			riskOperations,
			...riskFields,

			// Requirement operations and fields
			requirementOperations,
			...requirementFields,
		],
	};
}