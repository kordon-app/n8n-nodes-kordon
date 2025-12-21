export const taskDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a task',
	action: 'Delete a task',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/tasks/{{$parameter.taskId}}',
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
