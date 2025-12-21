export const requirementDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a requirement',
	action: 'Delete a requirement',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/requirements/{{$parameter.requirementId}}',
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
