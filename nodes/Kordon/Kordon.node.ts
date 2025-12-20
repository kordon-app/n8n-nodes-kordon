import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

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
						name: 'Vendor',
						value: 'vendor',
					},
					{
						name: 'User',
						value: 'user',
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
									this.logger.info('========================');
									return requestOptions;
								},
							],
							paginate: '={{ $parameter.returnAll }}',
						},
						request: {
							method: 'GET',
							url: '/assets',
							qs: {
								'state[]': '={{$parameter.options.state}}',
								'asset_value[]': '={{$parameter.options.asset_value}}',
								'health[]': '={{$parameter.options.health}}',
								'owner[]': '={{$parameter.options.owner}}',
								'manager[]': '={{$parameter.options.manager}}',
								'labels[]': '={{$parameter.options.labels}}',
								per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
						operations: {
							pagination: {
								type: 'offset',
								properties: {
									limitParameter: 'per_page',
									offsetParameter: 'page',
									pageSize: 100,
									rootProperty: 'data',
									type: 'query',
								},
							},
						},
					},
				},
			],
			default: 'getMany',
		},

		// ------------------------
		// Asset: Get - Fields
		// ------------------------
		{
			displayName: 'Asset ID',
			name: 'assetId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['get'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the asset to retrieve',
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
			default: false,
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			displayOptions: {
				show: {
					resource: ['asset'],
					operation: ['getMany'],
					returnAll: [false],
				},
			},
			typeOptions: {
				minValue: 1,
			},
			default: 50,
			description: 'Max number of results to return',
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
					default: '',
					placeholder: 'e.g., fbe8dc76-b1a8-4ce2-866d-15f90c9a20f6',
					description: 'Filter by owner ID. For multiple owners, separate with commas.',
				},
				{
					displayName: 'Manager ID(s)',
					name: 'manager',
					type: 'string',
					default: '',
					placeholder: 'e.g., 33837287-85fe-462e-ac08-04db57145dc9',
					description: 'Filter by manager ID. For multiple managers, separate with commas.',
				},
				{
					displayName: 'Labels',
					name: 'labels',
					type: 'string',
					default: '',
					placeholder: 'e.g., none, 8cc259df-01fe-43c6-80ef-d0449d78afc1',
					description: 'Filter by labels. Use "none" for items without labels, or enter label IDs separated by commas.',
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
								qs: {
									'kind[]': '={{$parameter.options.kind}}',
									'state[]': '={{$parameter.options.state}}',
									'owner[]': '={{$parameter.options.owner}}',
									'labels[]': '={{$parameter.options.labels}}',
									per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
							operations: {
								pagination: {
									type: 'offset',
									properties: {
										limitParameter: 'per_page',
										offsetParameter: 'page',
										pageSize: 100,
										rootProperty: 'data',
										type: 'query',
									},
								},
							},
						},
					},
				],
				default: 'getMany',
			},

			// ------------------------
			// Control: Get - Fields
			// ------------------------
			{
				displayName: 'Control ID',
				name: 'controlId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['get'],
					},
				},
				default: '',
				placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
				description: 'The ID of the control to retrieve',
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
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['control'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
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
						default: '',
						placeholder: 'e.g., 0f27df97-00b0-44ea-b8f0-522ad901ac37',
						description: 'Filter by owner ID. For multiple owners, separate with commas.',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						placeholder: 'e.g., none, 8cc259df-01fe-43c6-80ef-d0449d78afc1',
						description: 'Filter by labels. Use "none" for items without labels, or enter label IDs separated by commas.',
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
								paginate: '={{ $parameter.returnAll }}',
							},
							request: {
								method: 'GET',
								url: '/vendors',
								qs: {
									'state[]': '={{$parameter.options.state}}',
									'criticality[]': '={{$parameter.options.criticality}}',
									'owner[]': '={{$parameter.options.owner}}',
									'manager[]': '={{$parameter.options.manager}}',
									'labels[]': '={{$parameter.options.labels}}',
									per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
							operations: {
								pagination: {
									type: 'offset',
									properties: {
										limitParameter: 'per_page',
										offsetParameter: 'page',
										pageSize: 100,
										rootProperty: 'data',
										type: 'query',
									},
								},
							},
						},
					},
				],
				default: 'getMany',
			},

			// ------------------------
			// Vendor: Get - Fields
			// ------------------------
			{
				displayName: 'Vendor ID',
				name: 'vendorId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vendor'],
						operation: ['get'],
					},
				},
				default: '',
				placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
				description: 'The ID of the vendor to retrieve',
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
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['vendor'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
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
						default: '',
						placeholder: 'e.g., fbe8dc76-b1a8-4ce2-866d-15f90c9a20f6',
						description: 'Filter by owner ID. For multiple owners, separate with commas.',
					},
					{
						displayName: 'Manager ID(s)',
						name: 'manager',
						type: 'string',
						default: '',
						placeholder: 'e.g., 33837287-85fe-462e-ac08-04db57145dc9',
						description: 'Filter by manager ID. For multiple managers, separate with commas.',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						placeholder: 'e.g., none, 8cc259df-01fe-43c6-80ef-d0449d78afc1',
						description: 'Filter by labels. Use "none" for items without labels, or enter label IDs separated by commas.',
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
								qs: {
									per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
							operations: {
								pagination: {
									type: 'offset',
									properties: {
										limitParameter: 'per_page',
										offsetParameter: 'page',
										pageSize: 100,
										rootProperty: 'data',
										type: 'query',
									},
								},
							},
						},
					},
				],
				default: 'getMany',
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
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
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
							paginate: '={{ $parameter.returnAll }}',
						},
						request: {
							method: 'GET',
							url: '/findings',
							qs: {
								'kind[]': '={{$parameter.options.kind}}',
								'state[]': '={{$parameter.options.state}}',
								'priority[]': '={{$parameter.options.priority}}',
								'source[]': '={{$parameter.options.source}}',
								'owner[]': '={{$parameter.options.owner}}',
								'manager[]': '={{$parameter.options.manager}}',
								per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
						operations: {
							pagination: {
								type: 'offset',
								properties: {
									limitParameter: 'per_page',
									offsetParameter: 'page',
									pageSize: 100,
									rootProperty: 'data',
									type: 'query',
								},
							},
						},
					},
				},
			],
			default: 'getMany',
		},

		// ------------------------
		// Finding: Get - Fields
		// ------------------------
		{
			displayName: 'Finding ID',
			name: 'findingId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['get'],
				},
			},
			default: '',
			placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
			description: 'The ID of the finding to retrieve',
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
			default: false,
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			displayOptions: {
				show: {
					resource: ['finding'],
					operation: ['getMany'],
					returnAll: [false],
				},
			},
			typeOptions: {
				minValue: 1,
			},
			default: 50,
			description: 'Max number of results to return',
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
					default: '',
					placeholder: 'e.g., 55b9e62b-d49b-40e8-97ca-2bfbb1dc9919',
					description: 'Filter by owner ID. For multiple owners, separate with commas.',
				},
				{
					displayName: 'Manager ID(s)',
					name: 'manager',
					type: 'string',
					default: '',
					placeholder: 'e.g., 3ddbf84e-933c-448d-bbd7-4125eeac2491',
					description: 'Filter by manager ID. For multiple managers, separate with commas.',
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
								qs: {
									per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
							operations: {
								pagination: {
									type: 'offset',
									properties: {
										limitParameter: 'per_page',
										offsetParameter: 'page',
										pageSize: 100,
										rootProperty: 'data',
										type: 'query',
									},
								},
							},
						},
					},
				],
				default: 'getMany',
			},

			// ------------------------
			// Framework: Get - Fields
			// ------------------------
			{
				displayName: 'Framework ID',
				name: 'frameworkId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['regulation'],
						operation: ['get'],
					},
				},
				default: '',
				placeholder: 'b698a0ed-ad82-4468-900e-3b6eb3f5eb9b',
				description: 'The ID of the framework to retrieve',
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
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['regulation'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
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
								qs: {
									'state[]': '={{$parameter.options.state}}',
									'owner[]': '={{$parameter.options.owner}}',
									'manager[]': '={{$parameter.options.manager}}',
									'labels[]': '={{$parameter.options.labels}}', 'impact[]': '={{$parameter.options.impact}}',
									'probability[]': '={{$parameter.options.probability}}', per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
							operations: {
								pagination: {
									type: 'offset',
									properties: {
										limitParameter: 'per_page',
										offsetParameter: 'page',
										pageSize: 100,
										rootProperty: 'data',
										type: 'query',
									},
								},
							},
						},
					},
				],
				default: 'getMany',
			},

			// ------------------------
			// Risk: Get - Fields
			// ------------------------
			{
				displayName: 'Risk ID',
				name: 'riskId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['get'],
					},
				},
				default: '',
				placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
				description: 'The ID of the risk to retrieve',
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
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['risk'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
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
						default: '',
						placeholder: 'e.g., fbe8dc76-b1a8-4ce2-866d-15f90c9a20f6',
						description: 'Filter by owner ID. For multiple owners, separate with commas.',
					},
					{
						displayName: 'Manager ID(s)',
						name: 'manager',
						type: 'string',
						default: '',
						placeholder: 'e.g., 33837287-85fe-462e-ac08-04db57145dc9',
						description: 'Filter by manager ID. For multiple managers, separate with commas.',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						placeholder: 'e.g., none, 74a5222a-f559-486b-9201-10311d479d2c',
						description: 'Filter by labels. Use "none" for items without labels, or enter label IDs separated by commas.',
					},
					{
						displayName: 'Impact',
						name: 'impact',
						type: 'string',
						default: '',
						placeholder: 'e.g., 5, or 3,4,5',
						description: 'Filter by impact level (0-10). For multiple values, separate with commas.',
					},
					{
						displayName: 'Probability',
						name: 'probability',
						type: 'string',
						default: '',
						placeholder: 'e.g., 7, or 5,6,7',
						description: 'Filter by probability level (0-10). For multiple values, separate with commas.',
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
								qs: {
									'frameworks[]': '={{$parameter.options.frameworkId}}',
									'applicability[]': '={{$parameter.options.applicability}}',
									'chapter[]': '={{$parameter.options.chapter}}',
									'controls[]': '={{$parameter.options.controls}}',
									'labels[]': '={{$parameter.options.labels}}',
									per_page: '={{ $parameter.returnAll ? 100 : $parameter.limit }}',
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
							operations: {
								pagination: {
									type: 'offset',
									properties: {
										limitParameter: 'per_page',
										offsetParameter: 'page',
										pageSize: 100,
										rootProperty: 'data',
										type: 'query',
									},
								},
							},
						},
					},
				],
				default: 'getMany',
			},

			// ------------------------
			// Requirement: Get - Fields
			// ------------------------
			{
				displayName: 'Requirement ID',
				name: 'requirementId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['requirement'],
						operation: ['get'],
					},
				},
				default: '',
				placeholder: 'e.g., 550e8400-e29b-41d4-a716-446655440000',
				description: 'The ID of the requirement to retrieve',
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
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['requirement'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
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
						default: '',
						placeholder: 'e.g., Availability, Apply Secure Configurations to All System Components',
						description: 'Filter by chapter name. For multiple chapters, separate with commas.',
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
						default: '',
						placeholder: 'e.g., none, 8cc259df-01fe-43c6-80ef-d0449d78afc1',
						description: 'Filter by labels. Use "none" for items without labels, or enter label IDs separated by commas.',
					},
				],
			},],
	};
}