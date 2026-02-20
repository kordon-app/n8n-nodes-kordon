### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

#### [Unreleased]

> 20 February 2026

- Add Connected Item ID field for Task Create and Update operations, mapping to `taskable_id`.

#### [v1.0.11](https://gitlab.com/kordon-security/n8n-nodes-kordon/compare/v1.0.9...v1.0.11)

> 9 February 2026

- Add Custom Field resource with full CRUD operations (Get, Get Many, Create, Update, Delete)
- Add custom fields support to 7 resources: Requirement, Control, Risk, Vendor, Asset, BusinessProcess, and Task
- Custom fields can be added during create/update operations using key-value pairs
- Reorder resource dropdown for better UX (Framework → Requirement → Control → Risk → Vendor → Asset → BusinessProcess → Finding → Task)
- Reorder Custom Field create form fields (Attribute Of → Label → Key → Type → Additional Fields)
- Clean up development artifacts (backup files and scripts)

#### [v1.0.9](https://gitlab.com/kordon-security/n8n-nodes-kordon/compare/v1.0.6...v1.0.9)

- Add Update Connections action for all resources [`31ae782`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/31ae7824fdd1f12a249b77967e7290290c842db7)
- Add Label resource with full CRUD operations to Kordon n8n node [`735ed16`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/735ed16a647a1c43611483e4ce572dc6deaf0e3e)
- Fix color field types and update version to 1.0.8 [`0752fba`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/0752fba6b2c7155d19cc0b9a0987cb830f6656b7)

#### [v1.0.6](https://gitlab.com/kordon-security/n8n-nodes-kordon/compare/v1.0.5...v1.0.6)

> 28 January 2026

- Release 1.0.6 [`fdbb337`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/fdbb337c32f9e8399bc48aff69252bd7dfb081c8)
- Fix linting errors in Update Connections feature [`aced59d`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/aced59d3211291aad52057f1c9fb785a09a07e19)

#### [v1.0.5](https://gitlab.com/kordon-security/n8n-nodes-kordon/compare/v1.0.4...v1.0.5)

> 28 January 2026

- Release v1.0.5 - Add Update Connections for Controls [`3cba6fa`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/3cba6fa8b17d4fd36604417111ba746e553ad2c9)

#### [v1.0.4](https://gitlab.com/kordon-security/n8n-nodes-kordon/compare/1.0.1-0...v1.0.4)

> 28 January 2026

- fix: resolve expression evaluation in Create operations [`e1cbec0`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/e1cbec0dba354c380e5391d0143d7ac6e0081503)
- Add Update Connections action for Control resource with merge/replace modes [`674e062`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/674e062032446c3b508aab3fd657840f6e1a204e)
- feat(requirement): add applicability_note field for create and update [`092cf66`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/092cf66bbd7e8cfe9c1dc1490b96b9e12e3ef9c0)

#### [1.0.1-0](https://gitlab.com/kordon-security/n8n-nodes-kordon/compare/1.0.0...1.0.1-0)

> 23 December 2025

- Release 1.0.1-0 [`707c08d`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/707c08d19f5e0116df4d66aac0acb745adcb75b0)
- Fix: remove non-existent GithubIssues credentials from package.json [`8b8fbb8`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/8b8fbb859aa55e62e3a3dfcee8c6a9032b4888e0)

#### 1.0.0

> 23 December 2025

- Initial commit [`55e618a`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/55e618a07bd0d4fe8d5779c6dbb51c52bf1c593f)
- Remove node_modules from git tracking and clean up duplicate .gitignore entries [`e200631`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/e20063123c2a790b39d9ff661df2ac050f35e57e)
- Add Update operations for all resources [`65eb0a8`](https://gitlab.com/kordon-security/n8n-nodes-kordon/commit/65eb0a867ae30098e9db02c5c88b37b78c62bb66)
