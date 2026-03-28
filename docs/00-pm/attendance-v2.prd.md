# PRD: Attendance V2 (BKDS Compliance & Biometric Reliability)

**Status:** Draft | **Version:** 1.0.0 | **Author:** Gemini CLI PM Team

---

## 1. Discovery (OST - Opportunity Solution Tree)

### Desired Outcome
**99.5% Verification Accuracy & 100% Mebbis Regulatory Compliance by Q4.**

### Opportunities & Solutions
1. **Low Reliability in Varied Lighting (Pain Point)**
   - *Solution:* Infrared (IR) camera support & Depth-sensing integration.
   - *Solution:* Adaptive exposure algorithms in `FaceRecognition.tsx`.
2. **Regulatory Risk (Mebbis Fines)**
   - *Solution:* Automated BKDS (Biyometrik Kimlik Doğrulama Sistemi) sync.
   - *Solution:* Real-time validation against `MEB_RULES` (Daily limits, Telafi bans).
3. **Parent Anxiety (Communication Gap)**
   - *Solution:* Instant WhatsApp/Push notification on Entry/Exit.
   - *Solution:* Live "Safe Arrival" dashboard for parents.
4. **Manual Checkout Friction**
   - *Solution:* "Passive Checkout" via background face-scanning in corridors.

---

## 2. Strategy (JTBD & Lean Canvas)

### JTBD 6-Part Value Proposition
| Element | Description |
|---|---|
| **Actor** | Special Education Center Owner / Director |
| **Context** | Managing hundreds of students with strict Ministry (MEB) oversight. |
| **Push** | "Current manual logs are prone to errors; we risk losing state funding if Mebbis audit fails." |
| **Pull** | "I want a system that is invisible but invincible—syncing perfectly with government requirements." |
| **Anxiety** | "Will the biometrics fail and lock students out? Is the data safe (KVKK)?" |
| **Progress** | Total peace of mind with automated compliance and happy, informed parents. |

### Lean Canvas
- **Problem:** Inaccurate attendance, Mebbis audit risks, high admin overhead.
- **Solution:** Biometric V2 (Liveness detection), Mebbis Auto-Sync, Multi-channel Notifications.
- **Unique Value Proposition:** The only specialized attendance system that "speaks Mebbis" natively and ensures 0% billing errors.
- **Unfair Advantage:** Deep integration with local `mebRules.ts` and proprietary "Telafi" logic.
- **Key Metrics:** Sync Success Rate, Notification Latency (<2s), False Rejection Rate (FRR).

---

## 3. Research (Personas & Market)

### User Personas
1. **Admin Ayşe (The Compliancer):** Needs one-click Mebbis exports. Hates manual entry.
2. **Parent Murat (The Worried Father):** Wants a notification *the second* his child enters the building.
3. **Student Eren (The Sensitive Soul):** Needs a non-intrusive scanning experience (no bright flashes, no forced poses).

### Competitor Analysis Matrix
| Feature | Attendance V2 | K12Net | Generic Biometric |
|---|---|---|---|
| **Mebbis Sync** | Real-time / Deep | Manual Upload | None |
| **Telafi Logic** | Automated | Basic | None |
| **Parent Alerts** | WhatsApp + Push | SMS Only | None |
| **Biometrics** | Edge-AI / Liveness | None / Card | Standard Face |

### Market Sizing (TAM/SAM/SOM)
- **TAM:** 50k+ Private education centers in Turkey.
- **SAM:** 3.5k+ Special education & rehabilitation centers (RAM-connected).
- **SOM:** 200+ Centers in the primary expansion zone (Marmara Region).

---

## 4. PRD Synthesis

### Section 1: Executive Summary
Attendance V2 upgrades the existing face-recognition module to a full-scale **BKDS-compliant** attendance ecosystem. It focuses on biometric reliability (anti-spoofing), strict adherence to Ministry of Education (MEB) rules, and proactive parent communication.

### Section 2: Goals & Objectives
- **Zero-Manual Entry:** 100% of logs should sync to Mebbis without human intervention.
- **Security:** Implement Liveness Detection to prevent photo-based spoofing.
- **Engagement:** 95%+ parent notification open rate.

### Section 3: User Stories
- **As an Admin**, I want the system to block attendance recording for "Telafi" lessons if they exceed the monthly limit, so I don't get fined by MEB.
- **As a Parent**, I want to receive a WhatsApp message when my child is checked out, including the name of the teacher who released them.
- **As a Student**, I want to be recognized even if I'm wearing glasses or a hat, without stopping in front of a camera.

### Section 4: Functional Requirements
1. **Biometric V2 Engine:**
   - Integrate "Liveness Detection" (blink or head movement check).
   - Support for 3D depth maps (where hardware allows).
2. **Mebbis Sync Engine:**
   - Real-time API sync with the `mebbis-service`.
   - Conflict resolution UI for mismatched data.
3. **Notification Hub:**
   - Firebase Cloud Messaging (FCM) for app push.
   - WhatsApp Business API integration.
4. **Compliance Validator:**
   - Integration with `regulationCompliance.ts` for real-time rule checking during check-in.

### Section 5: Technical Constraints
- **Privacy:** Must be fully compliant with KVKK (Turkey's GDPR). No raw images stored; only mathematical face descriptors.
- **Offline Mode:** Must store logs locally if internet/Mebbis service is down and sync later.
- **Latency:** Recognition must happen in < 500ms.

### Section 6: UI/UX Requirements
- **Status Dashboard:** Traffic light system (Green = Synced, Yellow = Pending, Red = Error).
- **Parent App:** Simple "Arrival Timeline" view.
- **Kiosk Mode:** Minimalistic, high-contrast interface for the entry tablets.

### Section 7: GTM Strategy (Go-to-Market)
- **Beachhead Segment:** RAM-affiliated Special Education Centers in Istanbul.
- **Pricing:** Tiered based on student count; "Compliance-as-a-Service" model.
- **Channel:** Direct sales and "Mebbis Audit Prep" webinars.

### Section 8: Success Metrics
- **Verification Rate:** >99.5%
- **Audit Pass Rate:** 100%
- **Support Tickets:** <2% of users reporting biometric failures.
