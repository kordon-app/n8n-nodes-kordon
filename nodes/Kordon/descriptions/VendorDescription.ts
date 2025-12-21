export const vendorDeleteOperation = {
	name: 'Delete',
	value: 'delete',
	description: 'Delete a vendor',
	action: 'Delete a vendor',
	routing: {
		request: {
			method: 'DELETE' as const,
			url: '=/vendors/{{$parameter.vendorId}}',
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
