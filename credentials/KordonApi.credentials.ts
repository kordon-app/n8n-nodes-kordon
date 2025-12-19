import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class KordonApi implements ICredentialType {
	name = 'kordonApi';
	displayName = 'Kordon API';

	properties: INodeProperties[] = [
		{
			displayName: 'Kordon Domain',
			name: 'domain',
			type: 'string',
			default: '',
			placeholder: 'https://your-company.kordon.app',
			description: 'Your Kordon instance base URL (include https://, no trailing slash)',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];
}