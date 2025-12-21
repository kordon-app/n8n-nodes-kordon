export const findingDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a finding',
	action: 'Delete a finding',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/findings/{{$parameter.findingId}}',
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
