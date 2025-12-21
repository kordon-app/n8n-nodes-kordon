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
