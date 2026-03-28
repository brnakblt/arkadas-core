# Plan: Attendance V2 (BKDS Compliance & Biometric Reliability)

## 1. Objective
Implement a robust, BKDS-compliant attendance system that integrates real-time Mebbis regulation checks, enhanced biometric reliability (liveness detection), and automated parent notifications.

## 2. Technical Strategy

### 2.1. Biometric V2 Engine (AI Service & Frontend)
- **FastAPI (AI Service):** Add support for blink detection and head movement analysis to verify "liveness".
- **FaceRecognition.tsx (Frontend):** 
    - Implement a "guide" overlay to help students position themselves.
    - Integrate passive scanning mode for less intrusive recognition.
    - Use `face-api.js` more effectively by implementing confidence thresholds and multi-frame averaging.

### 2.2. Mebbis Sync & Compliance Engine (Backend)
- **Strapi Service:** Enhance `api::mebbis-compliance` to support real-time sync with external Mebbis endpoints (via `mebbis-service`).
- **Conflict Management:** Create a specialized Strapi content type `attendance-sync-issue` to log and resolve data mismatches.
- **Rule Integration:** Trigger `validateLesson` and `validateCompensation` automatically upon attendance creation.

### 2.3. Notification Hub (Backend & Workers)
- **WhatsApp Integration:** Add a service to Strapi to send templates via WhatsApp Business API.
- **Background Jobs:** Use `bullmq` (already in `web/src/lib/queue.ts`) to handle notification delivery asynchronously to prevent UI lag.

## 3. Implementation Phases

### Phase 1: Biometric Hardening (Do Phase 1)
1.  **AI Service:** Update `api/opencv/app/services/face_service.py` with liveness detection logic.
2.  **Frontend:** Refactor `web/src/components/features/FaceRecognition.tsx` to handle the new liveness requirements.

### Phase 2: Compliance & Sync (Do Phase 2)
1.  **Strapi:** Update `attendance-log` lifecycles to call the `mebbis-compliance` service.
2.  **Mebbis Service:** Implement actual API calls to the mock `mebbis-service` (Port 4000).

### Phase 3: Parent Notifications (Do Phase 3)
1.  **Notification Hub:** Create a Strapi service for WhatsApp/Push delivery.
2.  **UI:** Update the dashboard to show sync status (traffic light system).

## 4. Testing & Verification
- **Unit Tests:** Vitest for compliance rules in `mebbis-compliance`.
- **E2E Tests:** Playwright for the check-in flow.
- **Manual Test:** Spoofing attempt with a photo to verify liveness detection.

## 5. Success Criteria
- [ ] 99.5% recognition accuracy in variable lighting.
- [ ] 100% automated sync of logs to Mebbis.
- [ ] <2s notification delivery time.
