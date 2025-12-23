import type { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';

export class KordonApi implements ICredentialType {
	name = 'kordonApi';
	displayName = 'Kordon API';
	documentationUrl = 'https://kordon.app/learn/api/authentication/';
	icon = { light: 'file:kordon.svg', dark: 'file:kordon-dark.svg' } as const;

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

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.domain}}/api/v1',
			url: '/users',
			method: 'GET',
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}