# n8n-nodes-kordon

This is an n8n community node for [Kordon](https://kordon.app), a Straightforward GRC platform. The node lets you manage Assets, Risks, Controls, Findings, Vendors, and more directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node supports the following resources and operations:

| Resource | Get | Get Many | Create | Update | Delete |
|----------|:---:|:--------:|:------:|:------:|:------:|
| Asset | ✅ | ✅ | ✅ | ✅ | ✅ |
| Business Process | ✅ | ✅ | ✅ | ✅ | ✅ |
| Control | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finding | ✅ | ✅ | ✅ | ✅ | ✅ |
| Framework | ✅ | ✅ | - | - | - |
| Requirement | ✅ | ✅ | - | - | - |
| Risk | ✅ | ✅ | ✅ | ✅ | ✅ |
| Task | ✅ | ✅ | ✅ | ✅ | ✅ |
| User | ✅ | ✅ | - | ✅ | - |
| User Group | ✅ | ✅ | - | - | - |
| Vendor | ✅ | ✅ | ✅ | ✅ | ✅ |

All **Get Many** operations support:
- **Return All**: Fetch all results using automatic pagination
- **Filtering**: Resource-specific filters (state, owner, labels, etc.)

## Credentials

To use this node, you need a Kordon API key.

1. Log in to your Kordon account
2. Navigate to **Settings → API Keys**
3. Create a new API key
4. In n8n, create a new credential of type **Kordon API**:
   - **Kordon Domain**: Your Kordon instance URL (e.g., \`https://yourcompany.kordon.cloud\`)
   - **API Key**: The API key you created

For more details, see the [Kordon API Authentication documentation](https://kordon.app/learn/api/authentication/).

## Compatibility

- Tested with n8n v2.0.3
- Requires Kordon API v1

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Kordon Website](https://kordon.app)
- [Kordon API Documentation](https://kordon.app/learn/api/authentication/)

## License

[MIT](LICENSE.md)
