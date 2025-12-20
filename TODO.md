# TODO

## Completed ✅
- [x] Add pagination support to Users Get Many operation
- [x] Add Frameworks (Regulations) resource with Get and Get Many operations
- [x] Add Requirements resource with Get Many operation and filters (framework, applicability, chapter, controls, labels)
- [x] Add Controls resource with Get Many operation and filters (kind, state, owner, labels)
- [x] Add Risks resource with Get Many operation and filters (state, owner, manager, labels, impact, probability)
- [x] Refactor array parameter handling with reusable helper function
- [x] Add Get (single item) operations for all resources (Users, Frameworks, Requirements, Controls, Risks)
- [x] Add Vendors resource with Get and Get Many operations
- [x] Add Vendor filters (state, criticality, owner, manager, labels)
- [x] Add Assets resource with Get and Get Many operations
- [x] Add Asset filters (state, asset_value, health, owner, manager, labels)
- [x] Add Findings resource with Get and Get Many operations
- [x] Add Finding filters (kind, state, priority, source, owner, manager)

## Current Status

### Implemented Resources (8/8)
1. **Users** - Get, Get Many ✅
2. **Frameworks (Regulations)** - Get, Get Many ✅
3. **Requirements** - Get, Get Many ✅
4. **Controls** - Get, Get Many ✅
5. **Risks** - Get, Get Many ✅
6. **Vendors** - Get, Get Many ✅
7. **Assets** - Get, Get Many ✅
8. **Findings** - Get, Get Many ✅

## Next Steps - Adding Missing Resources

### Phase 1: Business Processes Resource
**Priority:** High (core GRC resource)
**Estimated effort:** 2-3 hours

#### Implementation Plan:
1. **Add resource option** to main resource dropdown
   - Add `{ name: 'Business Process', value: 'business_process' }` to resource options (already exists in file)

2. **Create Business Process - Get operation**
   - Endpoint: `GET /business-processes/:id`
   - Fields needed:
     - `businessProcessId` (string, required, UUID format)
   - Returns: Single business process with full details

3. **Create Business Process - Get Many operation**
   - Endpoint: `GET /business-processes`
   - Pagination: Same pattern as other resources (offset-based, per_page=100)
   - Available filters:
     - `criticality[]` (multiOptions: low, medium, high)
     - `owner[]` (string - user IDs, comma-separated)
     - `labels[]` (string - labels, comma-separated)
   - Response includes: id, title, description, criticality, monetary_value, currency, owner, assets, risks, vendors, tasks, permissions

4. **Testing checklist:**
   - [ ] Test Get single business process
   - [ ] Test Get Many without filters
   - [ ] Test Get Many with criticality filter
   - [ ] Test Get Many with owner filter
   - [ ] Test Get Many with labels filter
   - [ ] Test pagination (returnAll vs limit)

### Phase 2: Tasks Resource
**Priority:** High (enables workflow automation)
**Estimated effort:** 3-4 hours

#### Implementation Plan:
1. **Add resource option** to main resource dropdown
   - Add `{ name: 'Task', value: 'task' }` to resource options

2. **Create Task - Get operation**
   - Endpoint: `GET /tasks/:id`
   - Fields needed:
     - `taskId` (string, required, UUID format)
   - Returns: Single task with full details

3. **Create Task - Get Many operation**
   - Endpoint: `GET /tasks`
   - Pagination: Same pattern (offset-based, per_page=100)
   - Available filters:
     - `kind[]` (multiOptions: maintenance, audit, review)
     - `state[]` (multiOptions: to_do, done, cancelled)
     - `frequency[]` (multiOptions: once, weekly, monthly, quarterly, yearly)
     - `outcome[]` (multiOptions: pass, fail, partial, none)
     - `assignee[]` (string - user IDs, comma-separated)
     - `is_overdue` (boolean)
     - `needs_evidence` (boolean)
   - Response includes: id, title, description, assignee, kind, state, frequency, outcome, due_at, completed_at, taskable (parent object), labels

4. **Testing checklist:**
   - [ ] Test Get single task
   - [ ] Test Get Many without filters
   - [ ] Test Get Many with kind filter
   - [ ] Test Get Many with state filter
   - [ ] Test Get Many with assignee filter
   - [ ] Test Get Many with is_overdue filter
   - [ ] Test pagination

### Implementation Notes

#### Code Pattern to Follow (Consistent Across All Resources):
```typescript
// 1. Resource dropdown entry (lines ~78-118)
{
    name: 'Resource Name',
    value: 'resource_value',
}

// 2. Operation selector (lines ~121+)
{
    displayName: 'Operation',
    name: 'operation',
    displayOptions: {
        show: {
            resource: ['resource_value'],
        },
    },
    options: [
        { name: 'Get', value: 'get', ... },
        { name: 'Get Many', value: 'getMany', ... }
    ]
}

// 3. Get operation fields (ID field)
{
    displayName: 'Resource ID',
    name: 'resourceId',
    required: true,
    displayOptions: {
        show: {
            resource: ['resource_value'],
            operation: ['get'],
        },
    },
}

// 4. Get Many pagination controls
{
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
        show: {
            resource: ['resource_value'],
            operation: ['getMany'],
        },
    },
}

// 5. Get Many filters (in Options collection)
{
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    displayOptions: {
        show: {
            resource: ['resource_value'],
            operation: ['getMany'],
        },
    },
    default: {},
    options: [
        // Filter fields here
    ]
}
```

#### Helper Function Usage:
- Use `handleArrayParameter(requestOptions, 'filter_name')` for all array-based filters
- Add `encodeValues: true` option for filters that may contain special characters (e.g., source)
- Always log request details in preSend hook for debugging

## Design & UI
- [ ] Review n8n node logo, especially dark mode version - ensure it has good contrast and visibility in both light and dark themes

## Future Enhancements (Post-MVP)
- [ ] Add Create/Update/Delete operations for all resources
- [ ] Add bulk operations
- [ ] Add webhook triggers for Kordon events
- [ ] Add specialized operations (e.g., "Complete Task", "Update Risk Score")
- [ ] Add file upload support for evidence attachments
