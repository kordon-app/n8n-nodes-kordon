import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

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
						name: 'Control',
						value: 'control',
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
						name: 'User',
						value: 'user',
					},
				],
				default: 'user',
			},

			// ------------------------
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
						name: 'Get Many',
						value: 'getMany',
						description: 'Get a list of controls',
						action: 'Get many controls',
						routing: {
							send: {
								preSend: [
									async function (this, requestOptions) {
										// Handle kind[] array parameter - build URL manually
										if (requestOptions.qs && requestOptions.qs['kind[]']) {
											const kinds = requestOptions.qs['kind[]'];
											delete requestOptions.qs['kind[]'];

											// Append kind[] parameters to URL
											if (Array.isArray(kinds) && kinds.length > 0) {
												const kindParams = kinds.map((k) => `kind[]=${String(k)}`).join('&');
												requestOptions.url = requestOptions.url + (requestOptions.url.includes('?') ? '&' : '?') + kindParams;
											}
										}

										// Handle state[] array parameter - build URL manually
										if (requestOptions.qs && requestOptions.qs['state[]']) {
											const states = requestOptions.qs['state[]'];
											delete requestOptions.qs['state[]'];

											// Append state[] parameters to URL
											if (Array.isArray(states) && states.length > 0) {
												const stateParams = states.map((s) => `state[]=${String(s)}`).join('&');
												requestOptions.url = requestOptions.url + (requestOptions.url.includes('?') ? '&' : '?') + stateParams;
											}
										}

										// Handle owner[] array parameter - split comma-separated IDs
										if (requestOptions.qs && requestOptions.qs['owner[]']) {
											const ownerInput = requestOptions.qs['owner[]'];
											delete requestOptions.qs['owner[]'];

											// Split comma-separated IDs and append as owner[] parameters
											if (ownerInput && String(ownerInput).trim()) {
												const owners = String(ownerInput).split(',').map((id) => id.trim()).filter((id) => id);
												if (owners.length > 0) {
													const ownerParams = owners.map((o) => `owner[]=${o}`).join('&');
													requestOptions.url = requestOptions.url + (requestOptions.url.includes('?') ? '&' : '?') + ownerParams;
												}
											}
										}

										// Handle labels[] array parameter - split comma-separated values (supports "none" and label IDs)
										if (requestOptions.qs && requestOptions.qs['labels[]']) {
											const labelsInput = requestOptions.qs['labels[]'];
											delete requestOptions.qs['labels[]'];

											// Split comma-separated values and append as labels[] parameters
											if (labelsInput && String(labelsInput).trim()) {
												const labels = String(labelsInput).split(',').map((id) => id.trim()).filter((id) => id);
												if (labels.length > 0) {
													const labelParams = labels.map((l) => `labels[]=${l}`).join('&');
													requestOptions.url = requestOptions.url + (requestOptions.url.includes('?') ? '&' : '?') + labelParams;
												}
											}
										}

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
			default: { },
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
	],		},
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
			name: 'Get Many',
			value: 'getMany',
			description: 'Get a list of requirements',
			action: 'Get many requirements',
			routing: {
				request: {
					method: 'GET',
					url: '/requirements',
					qs: {
						'frameworks[]': '={{$parameter.frameworkId}}',
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
// Requirement: Get Many - Fields
// ------------------------
{
	displayName: 'Framework ID',
		name: 'frameworkId',
			type: 'string',
				required: true,
					displayOptions: {
		show: {
			resource: ['requirement'],
				operation: ['getMany'],
					},
	},
				default: '',
		placeholder: '023fb404-56f6-49cd-9379-dbf584d2eef8',
			description: 'The ID of the framework to get requirements for',
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
			},
		],
	};
}