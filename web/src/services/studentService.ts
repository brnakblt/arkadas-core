
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export interface Student {
    id: number;
    documentId: string;
    fullName: string;
    tcIdentity: string;
    birthDate: string;
    diagnosis: string;
    status: string;
    ramReportEndDate: string;
    parentName: string;
    parentPhone: string;
    avatarUrl: string;
}

export const studentService = {
    async getStudents(): Promise<Student[]> {
        const response = await fetch(`${STRAPI_URL}/api/students`, {
            headers: {
                // Add Authorization header if needed, for public endpoints it might work without if configured
                // "Authorization": `Bearer ${token}` 
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch students");
        }

        const json = await response.json();
        // Strapi v5 / v4 format usually: { data: [ { id: 1, documentId: "...", ...attributes } ] }
        return json.data || [];
    },

    async getStudentStats() {
        // For MVP, we can calculate stats from the list or use a count endpoint
        const students = await this.getStudents();
        return {
            total: students.length,
            active: students.filter(s => s.status === 'ACTIVE').length,
            critical: students.filter(s => s.status === 'SUSPENDED').length // Mock critical determination
        };
    }
};
