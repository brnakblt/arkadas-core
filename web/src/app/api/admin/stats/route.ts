/**
 * Admin Stats API - System Overview Metrics
 * GET /api/admin/stats
 */

import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(request: Request) {
    // Get auth token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const jwtMatch = cookieHeader.match(/jwt=([^;]+)/);
    const jwt = jwtMatch ? jwtMatch[1] : null;

    if (!jwt) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const headers = {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
        };

        // Fetch counts in parallel
        const [tenantsRes, usersRes, studentsRes, attendanceRes, schedulesRes] = await Promise.all([
            fetch(`${STRAPI_URL}/api/tenants?pagination[limit]=1`, { headers }),
            fetch(`${STRAPI_URL}/api/users?pagination[limit]=1`, { headers }),
            fetch(`${STRAPI_URL}/api/student-profiles?pagination[limit]=1`, { headers }),
            fetch(`${STRAPI_URL}/api/attendance-logs?filters[date][$eq]=${new Date().toISOString().split('T')[0]}&pagination[limit]=1`, { headers }),
            fetch(`${STRAPI_URL}/api/schedules?filters[date][$eq]=${new Date().toISOString().split('T')[0]}&pagination[limit]=1`, { headers }),
        ]);

        // Parse responses
        const tenantData = tenantsRes.ok ? await tenantsRes.json() : { meta: { pagination: { total: 0 } } };
        const userData = usersRes.ok ? await usersRes.json() : [];
        const studentData = studentsRes.ok ? await studentsRes.json() : { meta: { pagination: { total: 0 } } };
        const attendanceData = attendanceRes.ok ? await attendanceRes.json() : { meta: { pagination: { total: 0 } } };
        const scheduleData = schedulesRes.ok ? await schedulesRes.json() : { meta: { pagination: { total: 0 } } };

        // Count by role
        interface StrapiUser {
            role?: { type: string };
            blocked?: boolean;
        }

        const userList = Array.isArray(userData) ? userData : [];
        const teacherCount = userList.filter((u: StrapiUser) => u.role?.type === 'teacher').length;
        const parentCount = userList.filter((u: StrapiUser) => u.role?.type === 'parent').length;
        const activeUsers = userList.filter((u: StrapiUser) => !u.blocked).length;

        // Calculate attendance rate
        const totalStudents = studentData.meta?.pagination?.total || 0;
        const attendedToday = attendanceData.meta?.pagination?.total || 0;
        const attendanceRate = totalStudents > 0 ? Math.round((attendedToday / totalStudents) * 100) : 0;

        return NextResponse.json({
            tenants: {
                total: tenantData.meta?.pagination?.total || 0,
                active: tenantData.meta?.pagination?.total || 0,
            },
            users: {
                total: userList.length,
                active: activeUsers,
                teachers: teacherCount,
                parents: parentCount,
            },
            students: {
                total: totalStudents,
                active: totalStudents, // Assume all active
            },
            attendance: {
                today: attendedToday,
                rate: attendanceRate,
            },
            sessions: {
                today: scheduleData.meta?.pagination?.total || 0,
                completed: 0, // Would need to fetch with filter
            },
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
