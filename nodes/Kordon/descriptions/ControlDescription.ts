export const controlDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a control',
	action: 'Delete a control',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/controls/{{$parameter.controlId}}',
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
