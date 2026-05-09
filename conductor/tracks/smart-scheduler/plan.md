# Implementation Plan: Smart Scheduler

## Workflow
1. **Schema:** Implement `api::session-plan` in Strapi.
2. **Logic:** Build the `ValidationEngine` (TypeScript/Node).
3. **UI:** Develop the `SmartScheduler` grid in React.
4. **Integration:** Connect to RAM reports for student module checks.
5. **Report:** Automate "Ek-4" generation based on finalized plans.

## Tasks
- [x] Create `session-plan` content type in Strapi
- [x] Implement Backend Conflict Validator
- [x] Implement Frontend Drag-and-Drop Grid
- [x] Add MEB hour-limit rules to the validator
- [x] Connect Student Module Progress alerts
- [x] Export Weekly Plan to PDF/Excel
