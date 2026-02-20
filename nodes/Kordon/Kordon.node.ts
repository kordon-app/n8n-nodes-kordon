import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { assetOperations, assetFields } from './descriptions/AssetDescription';
import { businessProcessOperations, businessProcessFields } from './descriptions/BusinessProcessDescription';
import { controlOperations, controlFields } from './descriptions/ControlDescription';
import { customFieldOperations, customFieldFields } from './descriptions/CustomFieldDescription';
import { findingOperations, findingFields } from './descriptions/FindingDescription';
import { frameworkOperations, frameworkFields } from './descriptions/FrameworkDescription';
import { labelOperations, labelFields } from './descriptions/LabelDescription';
import { requirementOperations, requirementFields } from './descriptions/RequirementDescription';
import { riskOperations, riskFields } from './descriptions/RiskDescription';
import { taskOperations, taskFields } from './descriptions/TaskDescription';
import { vendorOperations, vendorFields } from './descriptions/VendorDescription';
import { userOperations, userFields } from './descriptions/UserDescription';
import { userGroupOperations, userGroupFields } from './descriptions/UserGroupDescription';

export class Kordon implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kordon',
		name: 'kordon',
		icon: { light: 'file:../../icons/kordon.svg', dark: 'file:../../icons/kordon-dark.svg' },
		group: ['input'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Interact with the Kordon API',
		defaults: {
			name: 'Kordon',
		},

		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],

		credentials: [
			{
				name: 'kordonApi',
				required: true,
			},
		],

		// Base configuration for all requests
		requestDefaults: {
			baseURL: '={{$credentials.domain}}/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: '={{"Bearer " + $credentials.apiKey}}',
			},
		},

		properties: [
			// ------------------------
			// Resource
			// ------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
					name: 'Framework',
					value: 'regulation',
				},
				{
					name: 'Requirement',
					value: 'requirement',
				},
				{
					name: 'Control',
					value: 'control',
				},
				{
					name: 'Risk',
					value: 'risk',
				},
				{
					name: 'Vendor',
					value: 'vendor',
				},
				{
					name: 'Asset',
					value: 'asset',
				},
				{
					name: 'Business Process',
					value: 'business_process',
				},
				{
					name: 'Finding',
					value: 'finding',
				},
				{
					name: 'Task',
					value: 'task',
				},
				{
					name: 'Custom Field',
					value: 'custom_field',
				},
				{
					name: 'Label',
					value: 'label',
				},
				{
					name: 'User',
					value: 'user',
				},
				{
					name: 'User Group',
					value: 'user_group',
				},
			],
			default: 'user',
		},

		// ------------------------
	// Asset operations and fields
	assetOperations,
	...assetFields,

	businessProcessOperations,
	...businessProcessFields,

	controlOperations,
	...controlFields,
		customFieldOperations,
		...customFieldFields,

		vendorOperations,
		...vendorFields,

			// User operations and fields
			userOperations,
			...userFields,

			// User Group operations and fields
			userGroupOperations,
			...userGroupFields,

			// Task operations and fields
			taskOperations,
			...taskFields,

			// Finding operations and fields
			findingOperations,
			...findingFields,

			// Framework operations and fields
			frameworkOperations,
			...frameworkFields,

		// Label operations and fields
		labelOperations,
		...labelFields,

		// Risk operations and fields
		riskOperations,
		...riskFields,

			// Requirement operations and fields
			requirementOperations,
			...requirementFields,
		],
	};
}