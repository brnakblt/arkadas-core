
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export interface Personnel {
    id: number;
    documentId: string;
    fullName: string;
    specialty: string;
    email: string;
    phone: string;
    joinDate: string;
    status: string;
    weeklyHours: number;
    maxWeeklyHours: number;
    performanceScore: number;
    avatarUrl: string;
}

export const personnelService = {
    async getPersonnel(): Promise<Personnel[]> {
        const response = await fetch(`${STRAPI_URL}/api/personnels`, {
            headers: {
                // "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch personnel");
        }

        const json = await response.json();
        return json.data || [];
    },

    async updateStatus(id: string, status: string) {
        const response = await fetch(`${STRAPI_URL}/api/personnels/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: { status }
            })
        });

        if (!response.ok) {
            throw new Error("Failed to update status");
        }

        return await response.json();
    }
};
