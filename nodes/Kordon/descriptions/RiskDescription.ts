export const riskDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a risk',
	action: 'Delete a risk',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/risks/{{$parameter.riskId}}',
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
