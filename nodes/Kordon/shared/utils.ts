import type { IHttpRequestOptions } from 'n8n-workflow';

/**
 * Shared utilities for Kordon n8n node
 */

/**
 * Reusable pagination routing config for all Get Many operations
 * Uses per_page=100 and continues fetching while more results exist
 */
export const paginationRouting = {
	send: {
		paginate: '={{ $value }}',
		type: 'query' as const,
		property: 'per_page',
		value: '={{ 100 }}',
	},
	operations: {
		pagination: {
			type: 'generic' as const,
			properties: {
				continue: '={{ $response.body.data && $response.body.data.length > 0 && (Number($response.body.meta.page) * Number($response.body.meta.per_page)) < $response.body.meta.total_count }}',
				request: {
					qs: {
						page: '={{ Number($response.body.meta.page || 1) + 1 }}',
						per_page: '={{ 100 }}',
					},
				},
			},
		},
	},
};

/**
 * Helper function to handle array parameters in query strings
 * Converts array values (from multiOptions) or comma-separated strings
 * into proper URL query parameters with [] notation
 */
export function handleArrayParameter(
	requestOptions: IHttpRequestOptions,
	paramName: string,
	options?: { encodeValues?: boolean },
): void {
	const paramKey = `${paramName}[]`;
	const qs = requestOptions.qs as Record<string, unknown> | undefined;
	if (!qs || !qs[paramKey]) {
		return;
	}

	const paramValue = qs[paramKey];
	delete qs[paramKey];

	let values: string[] = [];

	// Handle array values (e.g., from multiOptions)
	if (Array.isArray(paramValue) && paramValue.length > 0) {
		values = paramValue.map((v) => String(v));
	}
	// Handle comma-separated string values
	else if (paramValue && String(paramValue).trim()) {
		values = String(paramValue)
			.split(',')
			.map((id) => id.trim())
			.filter((id) => id);
	}

	// Append to URL if we have values
	if (values.length > 0) {
		const encodedValues = options?.encodeValues
			? values.map((v) => encodeURIComponent(v))
			: values;
		const params = encodedValues.map((v) => `${paramKey}=${v}`).join('&');
		requestOptions.url = requestOptions.url + (requestOptions.url.includes('?') ? '&' : '?') + params;
	}
}
