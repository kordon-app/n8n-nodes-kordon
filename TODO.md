# TODO

## 📋 Publishing Checklist

### Package Configuration (package.json)

- [x] Package name starts with `n8n-nodes-` (`n8n-nodes-kordon`)
- [x] `n8n-community-node-package` keyword present
- [x] License is MIT
- [x] `n8n` attribute with nodes/credentials defined
- [x] Description added
- [x] Homepage URL added (https://kordon.app)
- [x] Author email added (hi@kordon.app)
- [ ] **Verify GitLab repo is PUBLIC**

### Code Quality

- [ ] Run linter: `npm run lint`
- [ ] Run n8n scanner: `npx @n8n/scan-community-package n8n-nodes-kordon`
- [x] No external runtime dependencies (only dev/peer deps)
- [ ] Verify no environment variable access in code
- [ ] Verify no file system access in code
- [x] English-only interface

### Documentation

- [x] README.md exists with CRUD operations table
- [ ] Add authentication setup instructions
- [ ] Add example workflows (optional)
- [ ] Link to Kordon API docs (optional)

### UX Guidelines Compliance

- [x] CRUD operations included for all resources
- [ ] Audit: Title Case for parameter displayNames
- [ ] Audit: Sentence case for descriptions
- [ ] Audit: Boolean descriptions start with "Whether..."
- [ ] Audit: Placeholders use "e.g." format
- [ ] Verify: Delete operations return `{"deleted": true}`

### Pre-Publish Verification

- [x] Build project: `npm run build`
- [ ] Run linter: `npm run lint`
- [x] Test locally (Docker tested)
- [ ] Run n8n scanner

### Publishing Steps

1. [ ] Create npm account at [npmjs.com](https://www.npmjs.com)
2. [ ] Login to npm: `npm login`
3. [ ] Publish to npm: `npm publish`
4. [ ] Submit for verification at [creators.n8n.io/nodes](https://creators.n8n.io/nodes)

---

## Pending (Technical)

- [ ] Double check that setting a limit when querying many elements at once is respected
- [ ] Implement result sorting in Get Many actions for all resources
- [ ] Review n8n node logo for dark mode - ensure good contrast and visibility

## Future Enhancements

- [ ] Add bulk operations
- [ ] Add webhook triggers for Kordon events
- [ ] Add specialized operations (e.g., "Complete Task", "Update Risk Score")
- [ ] Add file upload support for evidence attachments
