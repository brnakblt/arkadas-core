-- ================================================================================
-- PostgreSQL Database Indexes for Arkadaş Özel Eğitim ERP
-- Run this script after initial Strapi migration
-- ================================================================================

-- ============================================================
-- STUDENT PROFILES
-- ============================================================

-- Index for active students lookup
CREATE INDEX IF NOT EXISTS idx_student_profiles_is_active 
ON student_profiles (is_active);

-- Index for student name search
CREATE INDEX IF NOT EXISTS idx_student_profiles_name 
ON student_profiles (first_name, last_name);

-- Index for enrollment date range queries
CREATE INDEX IF NOT EXISTS idx_student_profiles_enrollment 
ON student_profiles (enrollment_date DESC);

-- ============================================================
-- ATTENDANCE LOGS
-- ============================================================

-- Primary attendance lookup by date
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date 
ON attendance_logs (recorded_at DESC);

-- Compound index for student attendance history
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_date 
ON attendance_logs (user_id, recorded_at DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_attendance_logs_event_type 
ON attendance_logs (event_type);

-- Index for method statistics
CREATE INDEX IF NOT EXISTS idx_attendance_logs_method 
ON attendance_logs (method);

-- Daily attendance summary (partial index for today)
CREATE INDEX IF NOT EXISTS idx_attendance_logs_today 
ON attendance_logs (recorded_at) 
WHERE recorded_at >= CURRENT_DATE;

-- ============================================================
-- SCHEDULES
-- ============================================================

-- Schedule lookup by date range
CREATE INDEX IF NOT EXISTS idx_schedules_date_range 
ON schedules (start_date, end_date);

-- Schedule by day of week
CREATE INDEX IF NOT EXISTS idx_schedules_day 
ON schedules (day_of_week);

-- Teacher schedule lookup
CREATE INDEX IF NOT EXISTS idx_schedules_teacher 
ON schedules (teacher_id, day_of_week);

-- ============================================================
-- SERVICE ROUTES
-- ============================================================

-- Active routes lookup
CREATE INDEX IF NOT EXISTS idx_service_routes_active 
ON service_routes (is_active);

-- Route by driver
CREATE INDEX IF NOT EXISTS idx_service_routes_driver 
ON service_routes (driver_id);

-- ============================================================
-- SERVICE TRACKING LOGS
-- ============================================================

-- Real-time tracking by route and date
CREATE INDEX IF NOT EXISTS idx_service_tracking_route_date 
ON service_tracking_logs (route_id, recorded_at DESC);

-- Geospatial index for location queries (requires PostGIS)
-- CREATE INDEX IF NOT EXISTS idx_service_tracking_location 
-- ON service_tracking_logs USING GIST (location);

-- ============================================================
-- DOCUMENTS
-- ============================================================

-- Document lookup by owner
CREATE INDEX IF NOT EXISTS idx_documents_owner 
ON documents (owner_id, created_at DESC);

-- Document type filtering
CREATE INDEX IF NOT EXISTS idx_documents_type 
ON documents (type);

-- ============================================================
-- USERS
-- ============================================================

-- User lookup by role (for RBAC)
CREATE INDEX IF NOT EXISTS idx_users_role 
ON up_users (role);

-- Active users only
CREATE INDEX IF NOT EXISTS idx_users_confirmed 
ON up_users (confirmed) 
WHERE confirmed = true;

-- Email lookup (for login)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON up_users (email);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Unread notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications (user_id, is_read) 
WHERE is_read = false;

-- Recent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recent 
ON notifications (created_at DESC);

-- ============================================================
-- ERP ROLES
-- ============================================================

-- Role lookup by name
CREATE INDEX IF NOT EXISTS idx_erp_roles_name 
ON erp_roles (name);

-- System roles filter
CREATE INDEX IF NOT EXISTS idx_erp_roles_system 
ON erp_roles (is_system);

-- ============================================================
-- ANALYZE TABLES
-- ============================================================

-- Run ANALYZE to update statistics after creating indexes
ANALYZE student_profiles;
ANALYZE attendance_logs;
ANALYZE schedules;
ANALYZE service_routes;
ANALYZE service_tracking_logs;
ANALYZE documents;
ANALYZE up_users;
ANALYZE erp_roles;

-- ============================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Find missing indexes:
-- SELECT schemaname, relname, seq_scan, seq_tup_read,
--        idx_scan, idx_tup_fetch,
--        CASE WHEN seq_scan > 0 THEN round(idx_scan::numeric/seq_scan, 2) ELSE 0 END AS idx_ratio
-- FROM pg_stat_user_tables
-- WHERE seq_scan > 0
-- ORDER BY seq_tup_read DESC;

-- ============================================================
-- MAINTENANCE COMMANDS
-- ============================================================

-- Run periodically for optimal performance:
-- VACUUM ANALYZE;
-- REINDEX DATABASE arkadaserp;
