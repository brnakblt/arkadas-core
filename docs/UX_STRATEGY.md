# UX Strategy & Design Document

## 1. Analysis & Findings

### Project Overview
"Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi - ERP Sistemi" is a comprehensive ERP for a special education center. It consists of a web application (Next.js) and a mobile application (React Native/Expo).

### Current UI Architecture
**Web Application (`web/src/app`)**:
- **Public Site (`(site)`)**: Landing page and general information.
- **Admin Panel (`admin`)**: Management of users, classes, and system settings.
- **User Dashboard (`dashboard`)**: The primary interface for Teachers and Parents. Includes modules for activities, documents, and messages.
- **Driver Interface (`driver`)**: Specific view for shuttle drivers.
- **Specific Modules**: `yoklama` (Attendance) and `servis-takip` (Service Tracking) appear to be specialized, possibly standalone or kiosk-mode views.

**Mobile Application (`mobile/app/(tabs)`)**:
- Tab-based navigation focusing on on-the-go tasks:
  - `activity`: Daily logs/activities.
  - `appointments`: Calendar/schedule.
  - `attendance`: Quick attendance taking.
  - `documents`: Access to reports/files.
  - `messages`: Communication.
  - `tracking`: Shuttle/Location tracking.

## 2. User Personas

### Persona 1: The Administrator (Ayşe)
- **Role**: School Manager / Admin
- **Goals**: Ensure smooth operations, manage staff and student records, generate compliance reports for MEBBIS.
- **Pain Points**: Data inconsistency, slow reporting tools, complex user management.
- **Needs**: High-level dashboard, bulk data entry tools, system health monitoring.

### Persona 2: The Special Ed Teacher (Mehmet)
- **Role**: Teacher
- **Goals**: Log student progress, take attendance quickly, communicate with parents.
- **Pain Points**: Time-consuming paperwork, distracted during class by complex software.
- **Needs**: Mobile-first attendance, voice-to-text for activity logging, quick access to student individual education plans (BEP).

### Persona 3: The Parent (Fatma)
- **Role**: Parent of a student
- **Goals**: Track child's progress, know when the shuttle arrives, see daily reports.
- **Pain Points**: Missed notifications, unclear progress reports, anxiety about shuttle delays.
- **Needs**: Real-time shuttle tracking, simple daily summary, direct messaging with teachers.

### Persona 4: The Driver (Ahmet)
- **Role**: Shuttle Driver
- **Goals**: Get students to school/home safely and on time.
- **Pain Points**: Traffic, confusing route changes, manual check-ins.
- **Needs**: Simple "Start/Stop" route button, turn-by-turn navigation, one-tap "Student Picked Up" status.

## 3. User Flows

### Flow A: Teacher Taking Attendance (Mobile)
1.  **Open App** -> Lands on Dashboard.
2.  **Tap "Attendance" Tab**.
3.  **Select Class/Session** (Default to current time).
4.  **List of Students** appears with default status "Present".
5.  **Tap on Absent Students** to toggle status to "Absent" or "Late".
6.  **Tap "Submit"**.
7.  **Success Message** -> Return to Dashboard.

### Flow B: Parent Tracking Shuttle (Mobile/Web)
1.  **Notification Received**: "Shuttle is approaching."
2.  **Tap Notification** -> Opens App to "Tracking" tab.
3.  **Map View**: Shows shuttle icon moving in real-time.
4.  **ETA Display**: "Arriving in 5 mins".
5.  **Shuttle Arrives** -> Status updates to "Arrived".

### Flow C: Admin Generating Monthly Report (Web)
1.  **Login to Admin Panel**.
2.  **Navigate to "Reports"**.
3.  **Select "Monthly Attendance"**.
4.  **Choose Date Range** and **Class**.
5.  **Click "Generate"**.
6.  **Preview Report** (Table view).
7.  **Click "Export PDF"** or "Send to MEBBIS".

## 4. Wireframe Concepts

### Mobile: Attendance Screen
**Layout**:
- **Header**: Class Name | Date | Time
- **Body**: Scrollable list of student cards.
  - **Card Left**: Student Photo (Avatar).
  - **Card Middle**: Student Name.
  - **Card Right**: Segmented Control [ Present | Late | Absent ].
- **Footer**: Sticky "Save Attendance" button (Green, Full Width).

**Interactions**:
- Tapping a student card expands for notes.
- "Save" button is disabled if network is down (with visual indicator), or queues request.

### Web: Parent Dashboard Home
**Layout**:
- **Sidebar**: Nav links (Home, Profile, Messages, Documents).
- **Main Area**:
  - **Top Row**: "Shuttle Status" Widget (Map preview or Status Text).
  - **Middle Row**: "Today's Activity" Summary (Recent activity log entries).
  - **Bottom Row**: "Upcoming Appointments" (Calendar list).

## 5. Metrics & Goals

- **Efficiency**: Reduce attendance taking time to < 30 seconds per class.
- **Engagement**: Increase parent daily login rate by 20% via useful notifications.
- **Reliability**: Reduce "Shuttle not found" support tickets by 50%.
- **Clarity**: Achieve a System Usability Scale (SUS) score of > 80 in internal testing.

## 6. Usability Testing Plan (Heuristic Evaluation)

**Evaluator Checklist**:
1.  **Visibility of System Status**: Does the user know if the data is saved? (Check loading spinners/toasts).
2.  **Match between System and Real World**: Do we use terms like "Yoklama" instead of "AttendanceTransaction"?
3.  **User Control and Freedom**: Can a teacher undo an accidental "Absent" mark?
4.  **Consistency**: Are buttons colored consistently across Web and Mobile?
5.  **Error Prevention**: Confirmation dialog before deleting a student record.
