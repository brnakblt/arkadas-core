# Track Specification: Smart Scheduler

## Metadata
- **Track ID:** `smart-scheduler`
- **Title:** Rule-Based Smart Planning System
- **Status:** Planning
- **Owner:** Lead Agent

## Goal
Implement a drag-and-drop planning engine that proactively prevents MEB rule violations and optimizes classroom usage.

## Scope
- Drag-and-drop UI (`arkadas-web`).
- Session Plan API (`arkadas-core`).
- Real-time Conflict & Rule Validator.
- Integration with RAM reports for module limits.

## Success Criteria
- Automated enforcement of 8h daily limit for teachers.
- Automated enforcement of 2+1h daily limit for students.
- Visual conflict resolution for double-booked rooms.
