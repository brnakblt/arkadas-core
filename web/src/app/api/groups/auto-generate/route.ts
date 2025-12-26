import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

interface Student {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    disabilityType?: string;
    skillLevel?: string;
}

interface GroupSuggestion {
    groupName: string;
    groupType: 'yas_grubu' | 'seviye_grubu' | 'beceri_alanı';
    students: Student[];
    reason: string;
    suggestedCapacity: number;
}

/**
 * POST /api/groups/auto-generate
 * Otomatik grup önerisi oluşturur
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current user with tenant
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const currentUser = await userResponse.json();
        const tenantId = currentUser.tenant?.id;

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
        }

        const body = await request.json();
        const { groupingStrategy = 'age' } = body; // age, level, skill

        // Fetch all students for this tenant
        const studentsResponse = await fetch(
            `${STRAPI_URL}/api/student-profiles?filters[tenant][id][$eq]=${tenantId}&populate=*&pagination[pageSize]=500`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        if (!studentsResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
        }

        const studentsData = await studentsResponse.json();
        const students: Student[] = studentsData.data?.map((s: { id: number; documentId?: string; firstName?: string; lastName?: string; birthDate?: string; disabilityType?: string; skillLevel?: string }) => ({
            id: s.id,
            documentId: s.documentId,
            firstName: s.firstName,
            lastName: s.lastName,
            birthDate: s.birthDate,
            disabilityType: s.disabilityType,
            skillLevel: s.skillLevel,
        })) || [];

        if (students.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No students found",
                suggestions: [],
            });
        }

        let suggestions: GroupSuggestion[] = [];

        switch (groupingStrategy) {
            case 'age':
                suggestions = groupByAge(students);
                break;
            case 'level':
                suggestions = groupByLevel(students);
                break;
            case 'skill':
                suggestions = groupBySkill(students);
                break;
            default:
                suggestions = groupByAge(students);
        }

        return NextResponse.json({
            success: true,
            strategy: groupingStrategy,
            totalStudents: students.length,
            suggestions,
            message: `${suggestions.length} grup önerisi oluşturuldu`,
        });
    } catch (error) {
        console.error("Error generating groups:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/groups/auto-generate
 * Returns available grouping strategies
 */
export async function GET() {
    return NextResponse.json({
        strategies: [
            {
                id: 'age',
                name: 'Yaş Grupları',
                description: 'Öğrencileri yaş aralıklarına göre gruplar (3-5, 6-8, 9-12, 13+)',
            },
            {
                id: 'level',
                name: 'Seviye Grupları',
                description: 'Öğrencileri beceri seviyelerine göre gruplar (başlangıç, orta, ileri)',
            },
            {
                id: 'skill',
                name: 'Engel Türü Grupları',
                description: 'Öğrencileri engel türüne göre gruplar',
            },
        ],
    });
}

// ============================================================
// Grouping Functions
// ============================================================

function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function groupByAge(students: Student[]): GroupSuggestion[] {
    const ageGroups: Record<string, { min: number; max: number; students: Student[] }> = {
        'Erken Çocukluk (3-5 yaş)': { min: 3, max: 5, students: [] },
        'Çocukluk (6-8 yaş)': { min: 6, max: 8, students: [] },
        'Orta Çocukluk (9-12 yaş)': { min: 9, max: 12, students: [] },
        'Ergenlik (13-18 yaş)': { min: 13, max: 18, students: [] },
        'Yetişkin (18+ yaş)': { min: 18, max: 100, students: [] },
    };

    students.forEach((student) => {
        if (!student.birthDate) return;
        const age = calculateAge(student.birthDate);

        for (const [_groupName, group] of Object.entries(ageGroups)) {
            if (age >= group.min && age <= group.max) {
                group.students.push(student);
                break;
            }
        }
    });

    return Object.entries(ageGroups)
        .filter(([, group]) => group.students.length > 0)
        .map(([name, group]) => ({
            groupName: name,
            groupType: 'yas_grubu' as const,
            students: group.students,
            reason: `${group.min}-${group.max} yaş aralığındaki ${group.students.length} öğrenci`,
            suggestedCapacity: Math.min(8, Math.ceil(group.students.length * 1.2)),
        }));
}

function groupByLevel(students: Student[]): GroupSuggestion[] {
    const levelGroups: Record<string, Student[]> = {
        'Başlangıç Seviye': [],
        'Orta Seviye': [],
        'İleri Seviye': [],
        'Belirsiz Seviye': [],
    };

    students.forEach((student) => {
        switch (student.skillLevel) {
            case 'baslangic':
                levelGroups['Başlangıç Seviye'].push(student);
                break;
            case 'orta':
                levelGroups['Orta Seviye'].push(student);
                break;
            case 'ileri':
                levelGroups['İleri Seviye'].push(student);
                break;
            default:
                levelGroups['Belirsiz Seviye'].push(student);
        }
    });

    return Object.entries(levelGroups)
        .filter(([, group]) => group.length > 0)
        .map(([groupName, group]) => ({
            groupName,
            groupType: 'seviye_grubu' as const,
            students: group,
            reason: `${groupName} - ${group.length} öğrenci`,
            suggestedCapacity: Math.min(8, Math.ceil(group.length * 1.2)),
        }));
}

function groupBySkill(students: Student[]): GroupSuggestion[] {
    const skillGroups: Record<string, Student[]> = {};

    students.forEach((student) => {
        const skillType = student.disabilityType || 'Genel';
        if (!skillGroups[skillType]) {
            skillGroups[skillType] = [];
        }
        skillGroups[skillType].push(student);
    });

    return Object.entries(skillGroups)
        .filter(([, group]) => group.length > 0)
        .map(([skillType, group]) => ({
            groupName: `${skillType} Grubu`,
            groupType: 'beceri_alanı' as const,
            students: group,
            reason: `${skillType} alanında ${group.length} öğrenci`,
            suggestedCapacity: Math.min(8, Math.ceil(group.length * 1.2)),
        }));
}
