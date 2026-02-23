import type { IHttpRequestOptions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Shared utilities for Kordon n8n node
 */

/**
 * Interface for Kordon API error response structure
 */
interface KordonApiError {
	error?: {
		code?: string;
		message?: string;
		status?: number;
		details?: Record<string, unknown>;
	};
}

/**
 * Interface for HTTP response object
 */
interface HttpResponse {
	statusCode?: number;
	body?: KordonApiError;
}

/**
 * Creates an enhanced error with structured context about the failed operation.
 *
 * n8n limitation: the error output branch ONLY exposes error.message as
 * { json: { error: "<message>" } }. No other error fields (description,
 * httpCode, context, etc.) make it into the output JSON.
 *
 * Strategy (adapts based on error handling mode):
 *
 * Error Branch (continueOnFail = true):
 *   - message = JSON string (parseable via JSON.parse($json.error))
 *   - description = human-readable summary (shown in n8n UI)
 *
 * Stop Workflow (continueOnFail = false):
 *   - message = human-readable summary (shown prominently in error UI)
 *   - description = JSON string (available in Error Details panel)
 *
 * @param context - Information about the operation (resource, operation, itemId)
 * @param response - The HTTP response object
 * @param continueOnFail - Whether error branch mode is active
 */
export function createEnhancedError(
	context: {
		resource: string;
		operation: string;
		itemId?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		node?: any;
	},
	response?: HttpResponse,
	continueOnFail = false,
): NodeApiError {
	const { resource, operation, itemId, node } = context;

	// Extract error details from Kordon API response
	const body = response?.body as KordonApiError;
	const apiError = body?.error || {};

	// Build structured error data (JSON-parseable)
	const errorData = {
		resource,
		operation,
		itemId: itemId || null,
		httpStatus: response?.statusCode || null,
		errorCode: apiError.code || null,
		apiMessage: apiError.message || null,
		details: apiError.details || {},
	};

	// Build human-readable summary
	const descParts: string[] = [];
	descParts.push(`Failed to ${operation} ${resource}${itemId ? ` '${itemId}'` : ''}`);
	if (errorData.httpStatus) descParts.push(`HTTP ${errorData.httpStatus}`);
	if (errorData.errorCode) descParts.push(`Code: ${errorData.errorCode}`);
	if (errorData.apiMessage) descParts.push(errorData.apiMessage);
	const humanReadable = descParts.join(' | ');

	const jsonString = JSON.stringify(errorData);

	// Swap message/description based on error handling mode
	return new NodeApiError(
		node || { type: 'n8n-nodes-kordon.kordon' },
		(body || {}) as JsonObject,
		{
			message: continueOnFail ? jsonString : humanReadable,
			description: continueOnFail ? humanReadable : jsonString,
			httpCode: errorData.httpStatus ? String(errorData.httpStatus) : undefined,
		},
	);
}

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
