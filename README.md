# n8n-nodes-kordon

This is an n8n community node for the Kordon GRC platform. It allows you to interact with Kordon resources like Assets, Risks, Controls, and more directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Local Development Setup](#local-development-setup)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Docker Development Setup (Recommended)

The easiest way to develop and test the Kordon node is using Docker. This provides an isolated n8n environment with your custom node pre-loaded.

### Quick Start

1. **Build the node locally** (required before Docker):
   ```bash
   npm install
   npm run build
   ```

2. **Start n8n with Docker Compose**:
   ```bash
   docker-compose up
   ```

3. **Access n8n**:
   - Open http://localhost:5678 in your browser
   - The Kordon node will be automatically available

### Development Workflow

When making changes to the node:

1. **Make your code changes** in the TypeScript files

2. **Rebuild the node**:
   ```bash
   npm run build
   ```

3. **Restart the Docker container**:
   ```bash
   docker-compose restart
   ```

4. **Refresh your browser** (hard refresh with `Cmd+Shift+R` or `Ctrl+Shift+R`)

### Stopping the Environment

```bash
# Stop containers
docker-compose down

# Stop and remove all data (including workflows)
docker-compose down -v
```

### Troubleshooting Docker Setup

**Node doesn't appear:**
- Ensure you ran `npm run build` before `docker-compose up`
- Check the `dist` folder exists with compiled JavaScript files
- Restart the container: `docker-compose restart`
- Check container logs: `docker-compose logs n8n`

**Changes not showing:**
- Always rebuild with `npm run build` after code changes
- Restart the container: `docker-compose restart`
- Clear browser cache or use incognito mode

**Port already in use:**
- Another n8n instance might be running
- Stop it: `pkill -9 -f n8n`
- Or change the port in `docker-compose.yml`: `"5679:5678"`

## Local Development Setup (Alternative)

If you prefer to develop without Docker, you can link the node directly to your local n8n installation.

### Prerequisites

1. Install n8n globally:
   ```bash
   npm install -g n8n
   ```

### Linking Your Custom Node to n8n

To test your custom node locally with your n8n instance:

1. **Build the node** (in the node directory):
   ```bash
   cd /path/to/n8n-nodes-kordon
   npm run build
   ```

2. **Set up the .n8n directory** (if not already done):
   ```bash
   cd ~/.n8n
   # Create package.json if it doesn't exist
   echo '{"name":"n8n-custom","version":"1.0.0"}' > package.json
   ```

3. **Install the custom node as a local dependency**:
   ```bash
   cd ~/.n8n
   npm install "/path/to/n8n-nodes-kordon"
   ```
   
   This creates a symlink in `~/.n8n/node_modules/n8n-nodes-kordon` pointing to your local development directory.

4. **Clear cache and restart n8n**:
   ```bash
   pkill -9 -f n8n
   rm -rf ~/.n8n/.cache
   n8n start
   ```

5. **Verify the node appears**:
   - Open n8n at http://localhost:5678
   - Search for "Kordon" when adding a new node
   - The node should now appear in the node list

### Making Changes

After modifying the node code:

1. Rebuild the node:
   ```bash
   cd /path/to/n8n-nodes-kordon
   npm run build
   ```

2. Restart n8n:
   ```bash
   pkill -9 -f n8n
   rm -rf ~/.n8n/.cache
   n8n start
   ```

### Troubleshooting

**Node doesn't appear after linking:**
- **First, try clearing your browser cache** or open n8n in an incognito/private window - this is often the issue!
- Hard refresh the browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Verify the symlink exists: `ls -la ~/.n8n/node_modules/ | grep kordon`
- Clear n8n caches: `rm -rf ~/.n8n/.cache ~/.n8n/cache`
- Rebuild the node in .n8n: `cd ~/.n8n && npm rebuild n8n-nodes-kordon`
- Restart n8n completely

**npm link freezes:**
- Don't use `npm link` directly - use `npm install` with the local path instead
- This creates a proper dependency entry in package.json that n8n recognizes

## Operations

The node supports the following resources and operations:

- **Assets**
    - Get: Retrieve a single asset by ID
    - Get Many: Retrieve a list of assets with filtering (state, value, health, owner, etc.)
- **Business Processes**
    - Get: Retrieve a single business process by ID
    - Get Many: Retrieve a list of business processes with filtering
- **Controls**
    - Get: Retrieve a single control by ID
    - Get Many: Retrieve a list of controls with filtering (kind, state, owner, labels)
- **Findings**
    - Get: Retrieve a single finding by ID
    - Get Many: Retrieve a list of findings with filtering (kind, state, priority, source)
- **Frameworks (Regulations)**
    - Get: Retrieve a single framework by ID
    - Get Many: Retrieve a list of frameworks
- **Requirements**
    - Get: Retrieve a single requirement by ID
    - Get Many: Retrieve a list of requirements with filtering (framework, applicability, chapter)
- **Risks**
    - Get: Retrieve a single risk by ID
    - Get Many: Retrieve a list of risks with filtering (state, owner, impact, probability)
- **Tasks**
    - Get: Retrieve a single task by ID
    - Get Many: Retrieve a list of tasks with filtering (kind, state, assignee)
- **Users**
    - Get: Retrieve a single user by ID
    - Get Many: Retrieve a list of users
- **Vendors**
    - Get: Retrieve a single vendor by ID
    - Get Many: Retrieve a list of vendors with filtering (state, criticality, owner)

All "Get Many" operations support:
- **Return All**: Automatically fetches all results using pagination
- **Limit**: Restrict the number of results returned

## Credentials

You need to configure Kordon API credentials to use this node.

1. Create a new credential of type "Kordon API"
2. Enter your Kordon API URL (e.g., `https://api.kordon.app`)
3. Enter your API Token

## Compatibility

Compatible with n8n@1.0.0 or later

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Kordon Website](https://kordon.app)
