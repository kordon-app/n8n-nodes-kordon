# TODO

## Completed ✅
- [x] Add pagination support to Users Get Many operation
- [x] Add Frameworks (Regulations) resource with Get and Get Many operations
- [x] Add Requirements resource with Get Many operation and filters (framework, applicability, chapter, controls, labels)
- [x] Add Controls resource with Get Many operation and filters (kind, state, owner, labels)
- [x] Add Risks resource with Get Many operation and filters (state, owner, manager, labels, impact, probability)
- [x] Refactor array parameter handling with reusable helper function
- [x] Add Get (single item) operations for all resources (Users, Frameworks, Requirements, Controls, Risks)

## Design & UI
- [ ] Review n8n node logo, especially dark mode version - ensure it has good contrast and visibility in both light and dark themes

## Future Enhancements
- [ ] Add more Kordon resources (Assets, Business Processes, Vendors, Findings, Tasks)
- [ ] Add Create/Update/Delete operations for all resources
- [ ] Add more filtering options to existing resources as needed
- [ ] Add error handling and validation for API responses
- [ ] Add webhook support for real-time updates
