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
- [x] Add Business Process resource with Get and Get Many operations
- [x] Add Business Process filters (criticality, owner, labels)
- [x] Add Tasks resource with Get and Get Many operations
- [x] Add Task filters (kind, state, assignee)

## Current Status

### Implemented Resources (10/10) 🎉
1. **Users** - Get, Get Many ✅
2. **Frameworks (Regulations)** - Get, Get Many ✅
3. **Requirements** - Get, Get Many ✅
4. **Controls** - Get, Get Many ✅
5. **Risks** - Get, Get Many ✅
6. **Vendors** - Get, Get Many ✅
7. **Assets** - Get, Get Many ✅
8. **Findings** - Get, Get Many ✅
9. **Business Processes** - Get, Get Many ✅
10. **Tasks** - Get, Get Many ✅

## All Core Resources Complete! 🎉

The Kordon n8n node now supports all major GRC resources with full filtering capabilities.

## Design & UI
- [ ] Review n8n node logo, especially dark mode version - ensure it has good contrast and visibility in both light and dark themes

## Future Enhancements (Post-MVP)
- [ ] Add Create/Update/Delete operations for all resources
- [ ] Add bulk operations
- [ ] Add webhook triggers for Kordon events
- [ ] Add specialized operations (e.g., "Complete Task", "Update Risk Score")
- [ ] Add file upload support for evidence attachments
