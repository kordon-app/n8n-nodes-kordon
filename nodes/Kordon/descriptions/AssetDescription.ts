export const assetDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete an asset',
	action: 'Delete an asset',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/assets/{{$parameter.assetId}}',
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
