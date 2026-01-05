/**
 * Admin Face Enrollments API
 * GET /api/admin/face-enrollments
 */

import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function GET(request: Request) {
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

        // Fetch all students from Strapi
        const studentsRes = await fetch(
            `${STRAPI_URL}/api/student-profiles?populate=photo&pagination[limit]=100`,
            { headers }
        );

        if (!studentsRes.ok) {
            throw new Error('Failed to fetch students');
        }

        const studentsData = await studentsRes.json();
        const strapiStudents = studentsData.data || [];

        // Fetch enrolled users from AI service
        let enrolledUserIds: string[] = [];
        try {
            const aiRes = await fetch(
                `${AI_SERVICE_URL}/api/users?tenant_id=arkadas`,
                {
                    headers: {
                        'X-API-Key': process.env.AI_SERVICE_API_KEY || 'dev-key',
                        'x-tenant-id': 'arkadas',
                    },
                }
            );

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                interface AIUser {
                    user_id: string;
                }

                enrolledUserIds = (aiData.users || []).map((u: AIUser) => u.user_id);
            }
        } catch (error) {
            console.error('Failed to fetch AI enrollments:', error);
        }

        interface StrapiStudent {
            id: number;
            documentId?: string;
            attributes?: {
                firstName?: string;
                ad?: string;
                lastName?: string;
                soyad?: string;
                photo?: {
                    data?: {
                        attributes?: { url: string };
                    };
                    url?: string;
                };
            };
            // Flattened structure fallback
            firstName?: string;
            ad?: string;
            lastName?: string;
            soyad?: string;
            photo?: {
                url?: string;
            };
        }

        // Map students with enrollment status
        const students = strapiStudents.map((s: StrapiStudent) => {
            const attrs = (s.attributes || s) as any;
            const studentIdStr = `student_${s.id}`;
            const isEnrolled = enrolledUserIds.includes(studentIdStr);

            return {
                id: s.id,
                documentId: s.documentId || s.id.toString(),
                firstName: attrs.firstName || attrs.ad || '',
                lastName: attrs.lastName || attrs.soyad || '',
                fullName: `${attrs.firstName || attrs.ad || ''} ${attrs.lastName || attrs.soyad || ''}`.trim(),
                photo: attrs.photo?.data?.attributes
                    ? { url: attrs.photo.data.attributes.url }
                    : attrs.photo?.url
                        ? { url: attrs.photo.url }
                        : null,
                hasFaceEncoding: isEnrolled,
                faceEncodingDate: isEnrolled ? new Date().toISOString() : null,
            };
        });

        return NextResponse.json({ students });
    } catch (error) {
        console.error('Face enrollments error:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
}
