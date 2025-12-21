export const businessProcessDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a business process',
	action: 'Delete a business process',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/business-processes/{{$parameter.businessProcessId}}',
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
