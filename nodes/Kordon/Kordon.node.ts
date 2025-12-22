import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { assetDeleteOperation } from './descriptions/AssetDescription';
import { businessProcessDeleteOperation } from './descriptions/BusinessProcessDescription';
import { controlDeleteOperation } from './descriptions/ControlDescription';
import { findingDeleteOperation } from './descriptions/FindingDescription';
import { frameworkDeleteOperation } from './descriptions/FrameworkDescription';
import { requirementDeleteOperation } from './descriptions/RequirementDescription';
import { riskDeleteOperation } from './descriptions/RiskDescription';
import { taskDeleteOperation } from './descriptions/TaskDescription';
import { vendorDeleteOperation } from './descriptions/VendorDescription';

// Reusable pagination routing config for all Get Many operations
const paginationRouting = {
	send: {
		paginate: '={{ $value }}',
		type: 'query' as const,
		property: 'per_page',
		value: '={{ 100 }}',
	},
	operations: {
		pagination: {
			type: 'generic' as const,
			properties: {
				continue: '={{ $response.body.data && $response.body.data.length > 0 && (Number($response.body.meta.page) * Number($response.body.meta.per_page)) < $response.body.meta.total_count }}',
				request: {
					qs: {
						page: '={{ Number($response.body.meta.page || 1) + 1 }}',
						per_page: '={{ 100 }}',
					},
				},
			},
		},
	},
};

// Helper function to handle array parameters in query strings
function handleArrayParameter(
	requestOptions: any,
	paramName: string,
	options?: { encodeValues?: boolean },
): void {
	const paramKey = `${paramName}[]`;
	if (!requestOptions.qs || !requestOptions.qs[paramKey]) {
		return;
	}

	const paramValue = requestOptions.qs[paramKey];
	delete requestOptions.qs[paramKey];

	let values: string[] = [];

	// Handle array values (e.g., from multiOptions)
	if (Array.isArray(paramValue) && paramValue.length > 0) {
		values = paramValue.map((v) => String(v));
	}
	// Handle comma-separated string values
	else if (paramValue && String(paramValue).trim()) {
		values = String(paramValue)
			.split(',')
			.map((id) => id.trim())
			.filter((id) => id);
	}

	// Append to URL if we have values
	if (values.length > 0) {
		const encodedValues = options?.encodeValues
			? values.map((v) => encodeURIComponent(v))
			: values;
		const params = encodedValues.map((v) => `${paramKey}=${v}`).join('&');
		requestOptions.url = requestOptions.url + (requestOptions.url.includes('?') ? '&' : '?') + params;
	}
}

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

			// ------------------------
			// User - Operation
			// ------------------------
			{
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
								body: {
									name: '={{$parameter.name}}',
									email: '={{$parameter.email}}',
									role: '={{$parameter.role}}',
									active: '={{$parameter.active}}',
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
						description: 'Get a single user',
						action: 'Get a user',
						routing: {
							request: {
								method: 'GET',
								url: '=/users/{{$parameter.userId}}',
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
						description: 'Get a list of users',
						action: 'Get many users',
						routing: {
							request: {
								method: 'GET',
								url: '/users',
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
					description: 'Update a user',
					action: 'Update a user',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
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
			},

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
				description: 'Whether to return all results or use pagination',
				routing: paginationRouting,
			},

			// ------------------------
			// User Group - Operation
			// ------------------------
			{
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
			},

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
				description: 'Whether to return all results or use pagination',
				routing: paginationRouting,
			},

			// ------------------------
			// Task - Operation
			// ------------------------
			{
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
			},

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

			// ------------------------
		// ------------------------
		// Finding - Operation
		// ------------------------
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: ['finding'],
				},
			},
			options: [
				{
					name: 'Get',
					value: 'get',
					description: 'Get a single finding',
					action: 'Get a finding',
					routing: {
						request: {
							method: 'GET',
							url: '=/findings/{{$parameter.findingId}}',
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
					description: 'Get many findings',
					action: 'Get many findings',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									// Handle array parameters
									handleArrayParameter(requestOptions, 'kind');
									handleArrayParameter(requestOptions, 'state');
									handleArrayParameter(requestOptions, 'priority');
									handleArrayParameter(requestOptions, 'source', { encodeValues: true });
									handleArrayParameter(requestOptions, 'owner');
									handleArrayParameter(requestOptions, 'manager');

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
							url: '/findings',
							returnFullResponse: true,
							qs: {
								'kind[]': '={{$parameter.options.kind}}',
								'state[]': '={{$parameter.options.state}}',
								'priority[]': '={{$parameter.options.priority}}',
								'source[]': '={{$parameter.options.source}}',
								'owner[]': '={{$parameter.options.owner}}',
								'manager[]': '={{$parameter.options.manager}}',
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
					description: 'Create a new finding',
					action: 'Create a finding',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									const body = requestOptions.body as any;
									
									// Handle label_ids if present
									if (body.finding && body.finding.label_ids) {
										if (typeof body.finding.label_ids === 'string') {
											body.finding.label_ids = (body.finding.label_ids as string).split(',').map((id: string) => id.trim());
										} else if (!Array.isArray(body.finding.label_ids)) {
											body.finding.label_ids = [body.finding.label_ids];
										}
									}

									// Log request details for debugging
									this.logger.info('=== Kordon API Request (Create Finding) ===');
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
							url: '/findings',
							body: {
								finding: {
									title: '={{$parameter.title}}',
									kind: '={{$parameter.kind}}',
									owner_group_id: '={{$parameter.ownerGroupId}}',
									manager_group_id: '={{$parameter.managerGroupId}}',
									state: '={{$parameter.state}}',
									priority: '={{$parameter.priority}}',
									source: '={{$parameter.source}}',
									date_discovered: '={{$parameter.dateDiscovered}}',
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
					description: 'Update an existing finding',
					action: 'Update a finding',
					routing: {
						send: {
							preSend: [
								async function (this, requestOptions) {
									const updateFields = this.getNodeParameter('updateFields', {}) as { [key: string]: any };
									const finding: { [key: string]: any } = {};

									for (const key of Object.keys(updateFields)) {
										if (key === 'labels') {
											let labels = updateFields[key];
											if (typeof labels === 'string') {
												finding['label_ids'] = labels.split(',').map((id: string) => id.trim());
											} else if (Array.isArray(labels)) {
												finding['label_ids'] = labels;
											} else {
												finding['label_ids'] = [labels];
											}
										} else if (key === 'ownerGroupId') {
											finding['owner_group_id'] = updateFields[key];
										} else if (key === 'managerGroupId') {
											finding['manager_group_id'] = updateFields[key];
										} else if (key === 'dateDiscovered') {
											finding['date_discovered'] = updateFields[key];
										} else {
											finding[key] = updateFields[key];
										}
									}

									requestOptions.body = {
										finding: finding,
									};

									return requestOptions;
								},
							],
						},
						request: {
							method: 'PATCH',
							url: '=/findings/{{$parameter.findingId}}',
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
			findingDeleteOperation,
			],
			default: 'getMany',
		},

		// ------------------------
		// Finding: Create - Fields
		// ------------------------
		{
			displayName: 'Title',
			name: 'title',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The title of the finding',
		},
		{
			displayName: 'Kind',
			name: 'kind',
			type: 'options',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			options: [
				{
					name: 'OFI',
					value: 'ofi',
				},
				{
					name: 'Incident',
					value: 'incident',
				},
				{
					name: 'NCR',
					value: 'ncr',
				},
			],
			default: 'incident',
			description: 'The kind of finding',
		},
		{
			displayName: 'Owner ID',
			name: 'ownerGroupId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The ID of the owner',
		},
		{
			displayName: 'Manager ID',
			name: 'managerGroupId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'The ID of the manager',
		},
		{
			displayName: 'State',
			name: 'state',
			type: 'options',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			options: [
				{
					name: 'Open',
					value: 'open',
				},
				{
					name: 'In Progress',
					value: 'in_progress',
				},
				{
					name: 'Resolved',
					value: 'resolved',
				},
				{
					name: 'Closed',
					value: 'closed',
				},
			],
			default: 'open',
			description: 'The state of the finding',
		},
		{
			displayName: 'Priority',
			name: 'priority',
			type: 'options',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
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
			default: 'medium',
			description: 'The priority of the finding',
		},
		{
			displayName: 'Source',
			name: 'source',
			type: 'options',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			options: [
				{
					name: 'Audit',
					value: 'audit',
				},
				{
					name: 'Incident',
					value: 'incident',
				},
				{
					name: 'Assessment',
					value: 'assessment',
				},
				{
					name: 'Observation',
					value: 'observation',
				},
				{
					name: 'Report',
					value: 'report',
				},
			],
			default: 'audit',
			description: 'The source of the finding',
		},
		{
			displayName: 'Date Discovered',
			name: 'dateDiscovered',
			type: 'dateTime',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			default: '',
			description: 'Date when the finding was discovered',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['create'],
				},
			},
			options: [
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
					description: 'Detailed description of the finding (HTML supported)',
				},
				{
					displayName: 'Labels',
					name: 'labels',
					type: 'string',
					default: '',
					placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
					description: 'Comma-separated list of label IDs to attach to the finding',
					typeOptions: {
						multipleValues: true,
					},
				},
			],
		},

		// ------------------------
		// Finding: Update - Fields
		// ------------------------
		{
			displayName: 'Finding ID',
			name: 'findingId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['update'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the finding to update',
		},
		{
			displayName: 'Update Fields',
			name: 'updateFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['update'],
				},
			},
			options: [
				{
					displayName: 'Title',
					name: 'title',
					type: 'string',
					default: '',
					description: 'The title of the finding',
				},
				{
					displayName: 'Kind',
					name: 'kind',
					type: 'options',
					options: [
						{
							name: 'OFI',
							value: 'ofi',
						},
						{
							name: 'Incident',
							value: 'incident',
						},
						{
							name: 'NCR',
							value: 'ncr',
						},
					],
					default: 'incident',
					description: 'The kind of finding',
				},
				{
					displayName: 'Owner Group ID',
					name: 'ownerGroupId',
					type: 'string',
					default: '',
					description: 'The ID of the owner group',
				},
				{
					displayName: 'Manager Group ID',
					name: 'managerGroupId',
					type: 'string',
					default: '',
					description: 'The ID of the manager group',
				},
				{
					displayName: 'State',
					name: 'state',
					type: 'options',
					options: [
						{
							name: 'Open',
							value: 'open',
						},
						{
							name: 'In Progress',
							value: 'in_progress',
						},
						{
							name: 'Resolved',
							value: 'resolved',
						},
						{
							name: 'Closed',
							value: 'closed',
						},
					],
					default: 'open',
					description: 'The state of the finding',
				},
				{
					displayName: 'Priority',
					name: 'priority',
					type: 'options',
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
					default: 'medium',
					description: 'The priority of the finding',
				},
				{
					displayName: 'Source',
					name: 'source',
					type: 'options',
					options: [
						{
							name: 'Audit',
							value: 'audit',
						},
						{
							name: 'Incident',
							value: 'incident',
						},
						{
							name: 'Assessment',
							value: 'assessment',
						},
						{
							name: 'Observation',
							value: 'observation',
						},
						{
							name: 'Report',
							value: 'report',
						},
					],
					default: 'audit',
					description: 'The source of the finding',
				},
				{
					displayName: 'Date Discovered',
					name: 'dateDiscovered',
					type: 'dateTime',
					default: '',
					description: 'Date when the finding was discovered',
				},
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
					description: 'Detailed description of the finding (HTML supported)',
				},
				{
					displayName: 'Labels',
					name: 'labels',
					type: 'string',
					default: '',
					placeholder: 'e.g., 81bb6227-005f-4b1e-bf11-fbb9b96adb4d',
					description: 'Comma-separated list of label IDs to attach to the finding',
					typeOptions: {
						multipleValues: true,
					},
				},
			],
		},

		// ------------------------
		// Finding: Get/Delete - Fields
		// ------------------------
		{
			displayName: 'Finding ID',
			name: 'findingId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['get', 'delete'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the finding to retrieve or delete',
		},

		// ------------------------
		// Finding: Get Many - Options
		// ------------------------
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: ['finding'],
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
					resource: ['finding'],
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
							name: 'OFI',
							value: 'ofi',
						},
						{
							name: 'Incident',
							value: 'incident',
						},
						{
							name: 'NCR',
							value: 'ncr',
						},
					],
					default: [],
					description: 'Filter findings by kind',
				},
				{
					displayName: 'State',
					name: 'state',
					type: 'multiOptions',
					options: [
						{
							name: 'Open',
							value: 'open',
						},
						{
							name: 'In Progress',
							value: 'in_progress',
						},
						{
							name: 'Resolved',
							value: 'resolved',
						},
						{
							name: 'Closed',
							value: 'closed',
						},
					],
					default: [],
					description: 'Filter findings by state',
				},
				{
					displayName: 'Priority',
					name: 'priority',
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
					description: 'Filter findings by priority',
				},
				{
					displayName: 'Source',
					name: 'source',
					type: 'multiOptions',
					options: [
						{
							name: 'Internal Audit',
							value: 'Internal audit',
						},
						{
							name: 'External Audit',
							value: 'External audit',
						},
						{
							name: 'Incident',
							value: 'incident',
						},
						{
							name: 'Observation',
							value: 'observation',
						},
					],
					default: [],
					description: 'Filter findings by source',
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
			],
		},

			// Framework - Operation
			// ------------------------
			{
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
			},

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