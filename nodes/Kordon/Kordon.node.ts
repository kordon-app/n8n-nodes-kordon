import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { assetDeleteOperation } from './descriptions/AssetDescription';
import { businessProcessDeleteOperation } from './descriptions/BusinessProcessDescription';
import { controlDeleteOperation } from './descriptions/ControlDescription';
import { findingOperations, findingFields } from './descriptions/FindingDescription';
import { frameworkOperations, frameworkFields } from './descriptions/FrameworkDescription';
import { requirementDeleteOperation } from './descriptions/RequirementDescription';
import { riskDeleteOperation } from './descriptions/RiskDescription';
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

			// Control - Operation
			// ------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['control'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a single control',
						action: 'Get a control',
						routing: {
							request: {
								method: 'GET',
								url: '=/controls/{{$parameter.controlId}}',
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
						description: 'Get a list of controls',
						action: 'Get many controls',
						routing: {
							send: {
								preSend: [
									async function (this, requestOptions) {
										// Handle array parameters
										handleArrayParameter(requestOptions, 'kind');
										handleArrayParameter(requestOptions, 'state');
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
								url: '/controls',
								returnFullResponse: true,
								qs: {
									'kind[]': '={{$parameter.options.kind}}',
									'state[]': '={{$parameter.options.state}}',
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
						name: 'Create',
						value: 'create',
						description: 'Create a new control',
						action: 'Create a control',
						routing: {
							send: {
								preSend: [
									async function (this, requestOptions) {
										const body = requestOptions.body as any;
										
										// Handle label_ids if present
										if (body.control && body.control.label_ids) {
											if (typeof body.control.label_ids === 'string') {
												body.control.label_ids = (body.control.label_ids as string).split(',').map((id: string) => id.trim());
											} else if (!Array.isArray(body.control.label_ids)) {
												body.control.label_ids = [body.control.label_ids];
											}
										}

										// Log request details for debugging
										this.logger.info('=== Kordon API Request (Create Control) ===');
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
								url: '/controls',
								body: {
									control: {
										title: '={{$parameter.title}}',
										owner_id: '={{$parameter.ownerId}}',
										kind: '={{$parameter.kind}}',
										begins_at: '={{$parameter.beginsAt}}',
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
						description: 'Update an existing control',
						action: 'Update a control',
						routing: {
							send: {
								preSend: [
									async function (this, requestOptions) {
										const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
										const control: { [key: string]: any } = {};

										// Map UI fields to API fields
										for (const key of Object.keys(updateFields)) {
											if (key === 'labels') {
												let labels = updateFields[key];
												if (typeof labels === 'string') {
													control['label_ids'] = labels.split(',').map((id: string) => id.trim());
												} else if (Array.isArray(labels)) {
													control['label_ids'] = labels;
												} else {
													control['label_ids'] = [labels];
												}
											} else if (key === 'ownerId') {
												control['owner_id'] = updateFields[key];
											} else if (key === 'beginsAt') {
												control['begins_at'] = updateFields[key];
											} else {
												control[key] = updateFields[key];
											}
										}

										requestOptions.body = {
											control: control,
										};

										// Log request details for debugging
										this.logger.info('=== Kordon API Update Control Request ===');
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
								url: '=/controls/{{$parameter.controlId}}',
							},
							output: {
								postReceive: [
									async function (this, items, response) {
										// Log response details for debugging
										this.logger.info('=== Kordon API Update Control Response ===');
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
				controlDeleteOperation,
				],
				default: 'getMany',
			},

			// ------------------------
		// Control: Get/Delete - Fields
		// ------------------------
		{
			displayName: 'Control ID',
			name: 'controlId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['control'],
					operation: ['get', 'delete'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the control to retrieve or delete',
		},

			// ------------------------
			// Control: Get Many - Options
			// ------------------------
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['control'],
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
						resource: ['control'],
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
								name: 'Policy',
								value: 'policy',
							},
							{
								name: 'Procedure',
								value: 'procedure',
							},
							{
								name: 'Technical',
								value: 'technical',
							},
						],
						default: [],
						description: 'Filter controls by type',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'multiOptions',
						options: [
							{
								name: 'Not Implemented',
								value: 'not_implemented',
							},
							{
								name: 'Failing',
								value: 'failing',
							},
							{
								name: 'Implemented',
								value: 'implemented',
							},
						],
						default: [],
						description: 'Filter controls by implementation state',
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

			// ------------------------
			// Control: Create - Fields
			// ------------------------
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The title of the control',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The ID of the user who owns the control',
			},
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['create'],
					},
				},
				options: [
					{
						name: 'Policy',
						value: 'policy',
					},
					{
						name: 'Procedure',
						value: 'procedure',
					},
					{
						name: 'Technical',
						value: 'technical',
					},
				],
				default: 'policy',
				description: 'The type of control',
			},
			{
				displayName: 'Begins At',
				name: 'beginsAt',
				type: 'dateTime',
				required: true,
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Date when the control begins',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Detailed description of the control (HTML supported)',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
						description: 'Comma-separated list of label IDs to attach to the control',
						typeOptions: {
							multipleValues: true,
						},
					},
				],
			},

			// ------------------------
			// Control: Update - Fields
			// ------------------------
			{
				displayName: 'Control ID',
				name: 'controlId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['update'],
					},
				},
				default: '',
				description: 'The ID of the control to update',
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'The title of the control',
					},
					{
						displayName: 'Owner ID',
						name: 'ownerId',
						type: 'string',
						default: '',
						description: 'The ID of the user who owns the control',
					},
					{
						displayName: 'Kind',
						name: 'kind',
						type: 'options',
						options: [
							{
								name: 'Policy',
								value: 'policy',
							},
							{
								name: 'Procedure',
								value: 'procedure',
							},
							{
								name: 'Technical',
								value: 'technical',
							},
						],
						default: 'policy',
						description: 'The type of control',
					},
					{
						displayName: 'Begins At',
						name: 'beginsAt',
						type: 'dateTime',
						default: '',
						description: 'Date when the control begins',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Detailed description of the control (HTML supported)',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
						description: 'Comma-separated list of label IDs to attach to the control',
						typeOptions: {
							multipleValues: true,
						},
					},
				],
			},

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

			// ------------------------
			// Risk - Operation
			// ------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['risk'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a single risk',
						action: 'Get a risk',
						routing: {
							request: {
								method: 'GET',
								url: '=/risks/{{$parameter.riskId}}',
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
						description: 'Get a list of risks',
						action: 'Get many risks',
						routing: {
							send: {
								preSend: [
									async function (this, requestOptions) {
										// Handle array parameters
										handleArrayParameter(requestOptions, 'state');
										handleArrayParameter(requestOptions, 'owner');
										handleArrayParameter(requestOptions, 'manager');
										handleArrayParameter(requestOptions, 'labels'); handleArrayParameter(requestOptions, 'impact');
										handleArrayParameter(requestOptions, 'probability');
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
								url: '/risks',
								returnFullResponse: true,
								qs: {
									'state[]': '={{$parameter.options.state}}',
									'owner[]': '={{$parameter.options.owner}}',
									'manager[]': '={{$parameter.options.manager}}',
									'labels[]': '={{$parameter.options.labels}}',
									'impact[]': '={{$parameter.options.impact}}',
									'probability[]': '={{$parameter.options.probability}}',
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
						description: 'Create a new risk',
						action: 'Create a risk',
						routing: {
							send: {
								preSend: [
									async function (this, requestOptions) {
										const body = requestOptions.body as any;
										
										// Handle label_ids if present
										if (body.risk && body.risk.label_ids) {
											if (typeof body.risk.label_ids === 'string') {
												body.risk.label_ids = (body.risk.label_ids as string).split(',').map((id: string) => id.trim());
											} else if (!Array.isArray(body.risk.label_ids)) {
												body.risk.label_ids = [body.risk.label_ids];
											}
										}

										// Log request details for debugging
										this.logger.info('=== Kordon API Request (Create Risk) ===');
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
								url: '/risks',
								body: {
									risk: {
										title: '={{$parameter.title}}',
										manager_id: '={{$parameter.managerId}}',
										owner_id: '={{$parameter.ownerId}}',
										impact: '={{$parameter.additionalFields.impact}}',
										probability: '={{$parameter.additionalFields.probability}}',
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
						description: 'Update an existing risk',
						action: 'Update a risk',
						routing: {
							send: {
								preSend: [
									async function (this, requestOptions) {
										const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
										const risk: { [key: string]: any } = {};

										// Map UI fields to API fields
										for (const key of Object.keys(updateFields)) {
											if (key === 'labels') {
												let labels = updateFields[key];
												if (typeof labels === 'string') {
													risk['label_ids'] = labels.split(',').map((id: string) => id.trim());
												} else if (Array.isArray(labels)) {
													risk['label_ids'] = labels;
												} else {
													risk['label_ids'] = [labels];
												}
											} else if (key === 'managerId') {
												risk['manager_id'] = updateFields[key];
											} else if (key === 'ownerId') {
												risk['owner_id'] = updateFields[key];
											} else {
												risk[key] = updateFields[key];
											}
										}

										requestOptions.body = {
											risk: risk,
										};

										// Log request details for debugging
										this.logger.info('=== Kordon API Update Risk Request ===');
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
								url: '=/risks/{{$parameter.riskId}}',
							},
							output: {
								postReceive: [
									async function (this, items, response) {
										// Log response details for debugging
										this.logger.info('=== Kordon API Update Risk Response ===');
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
				riskDeleteOperation,
				],
				default: 'getMany',
			},

			// ------------------------
			// Risk: Create - Fields
			// ------------------------
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The title of the risk',
			},
			{
				displayName: 'Manager ID',
				name: 'managerId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The ID of the user managing the risk',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The ID of the user owning the risk',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Impact',
						name: 'impact',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 5,
						},
						default: 1,
						description: 'Risk impact (1-5)',
					},
					{
						displayName: 'Probability',
						name: 'probability',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 5,
						},
						default: 1,
						description: 'Risk probability (1-5)',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Detailed description of the risk',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
						description: 'Comma-separated list of label IDs to attach to the risk',
						typeOptions: {
							multipleValues: true,
						},
					},
				],
			},

			// ------------------------
			// Risk: Update - Fields
			// ------------------------
			{
				displayName: 'Risk ID',
				name: 'riskId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['update'],
					},
				},
				default: '',
				description: 'The ID of the risk to update',
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'The title of the risk',
					},
					{
						displayName: 'Manager ID',
						name: 'managerId',
						type: 'string',
						default: '',
						description: 'The ID of the user who manages the risk',
					},
					{
						displayName: 'Owner ID',
						name: 'ownerId',
						type: 'string',
						default: '',
						description: 'The ID of the user who owns the risk',
					},
					{
						displayName: 'Impact',
						name: 'impact',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 5,
						},
						default: 1,
						description: 'Risk impact (1-5)',
					},
					{
						displayName: 'Probability',
						name: 'probability',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 5,
						},
						default: 1,
						description: 'Risk probability (1-5)',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Detailed description of the risk',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
						description: 'Comma-separated list of label IDs to attach to the risk',
						typeOptions: {
							multipleValues: true,
						},
					},
				],
			},

			// ------------------------
		// Risk: Get/Delete - Fields
		// ------------------------
		{
			displayName: 'Risk ID',
			name: 'riskId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['risk'],
					operation: ['get', 'delete'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the risk to retrieve or delete',
		},

			// ------------------------
			// Risk: Get Many - Options
			// ------------------------
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['risk'],
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
						resource: ['risk'],
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
								name: 'Acceptable',
								value: 'acceptable',
							},
							{
								name: 'Needs Mitigation',
								value: 'not_mitigated',
							},
						],
						default: [],
						description: 'Filter risks by state',
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
					{
						displayName: 'Impact',
						name: 'impact',
						type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add impact level (0-10)',
				description: 'Filter by impact levels (0-10)',
					},
					{
						displayName: 'Probability',
						name: 'probability',
						type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				placeholder: 'Add probability level (0-10)',
				description: 'Filter by probability levels (0-10)',
					},
				],
			},

			// ------------------------
			// Requirement - Operation
			// ------------------------
			{
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
										const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
										const requirement: { [key: string]: any } = {};

										for (const key of Object.keys(updateFields)) {
											if (key === 'labels') {
												let labels = updateFields[key];
												if (typeof labels === 'string') {
													requirement['label_ids'] = labels.split(',').map((id: string) => id.trim());
												} else if (Array.isArray(labels)) {
													requirement['label_ids'] = labels;
												} else {
													requirement['label_ids'] = [labels];
												}
											} else if (key === 'frameworkId') {
												// Convert frameworkId to regulation_ids array
												let frameworkId = updateFields[key];
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
				requirementDeleteOperation,
				],
				default: 'getMany',
			},

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
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Detailed description of the requirement (HTML supported)',
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
						displayName: 'Paragraph Number',
						name: 'paragraphNumber',
						type: 'string',
						default: '',
						description: 'Number of the paragraph',
					},
					{
						displayName: 'Meaning',
						name: 'meaning',
						type: 'string',
						default: '',
						description: 'Explanation of the requirement meaning',
					},
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
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'The title of the requirement',
					},
					{
						displayName: 'Framework ID',
						name: 'frameworkId',
						type: 'string',
						default: '',
						description: 'The ID of the framework (regulation) this requirement belongs to',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Detailed description of the requirement (HTML supported)',
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
						displayName: 'Paragraph Number',
						name: 'paragraphNumber',
						type: 'string',
						default: '',
						description: 'Number of the paragraph',
					},
					{
						displayName: 'Meaning',
						name: 'meaning',
						type: 'string',
						default: '',
						description: 'Explanation of the requirement meaning',
					},
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
				description: 'Whether to return all results or use pagination',
				routing: paginationRouting,
			}, {
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
						displayName: 'Framework ID',
						name: 'frameworkId',
						type: 'string',
						default: '',
						placeholder: '023fb404-56f6-49cd-9379-dbf584d2eef8',
						description: 'The ID of the framework to get requirements for',
					},
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
			},],
	};
}