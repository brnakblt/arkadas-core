/**
 * MEB Rapor Türleri ve Tanımları
 * 
 * Özel eğitim merkezleri için standart rapor formatları
 * PDF ve Excel export desteği
 */

// ============================================================
// Rapor Türleri
// ============================================================

export const MEB_REPORT_TYPES = {
    // Personel Program Cetvelleri
    PERSONEL_CETVELI: {
        id: 'personel_cetveli',
        name: 'Personel Program Cetveli',
        description: 'Tüm personelin aylık ders programı',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },
    PERSONEL_CETVELI_GRUP: {
        id: 'personel_cetveli_grup',
        name: 'Personel Program Cetveli (Grup Bazında)',
        description: 'Grup bazlı personel program cetveli',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },
    PERSONEL_CETVELI_HAFTALIK: {
        id: 'personel_cetveli_haftalik',
        name: 'Personel Program Cetveli (Haftalık)',
        description: 'Haftalık personel program cetveli',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },
    PERSONEL_CETVELI_OGRENCI_DETAY: {
        id: 'personel_cetveli_ogrenci_detay',
        name: 'Personel Program Cetveli (Öğr. Ad-Grup Detay)',
        description: 'Öğrenci adı ve grup detaylı personel cetveli',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },
    PERSONEL_CETVELI_GUN: {
        id: 'personel_cetveli_gun',
        name: 'Personel Program Cetveli (Öğr. ve Gün Ad)',
        description: 'Öğrenci ve gün bazlı personel cetveli',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },
    PERSONEL_CETVELI_MODULLU: {
        id: 'personel_cetveli_modullu',
        name: 'Personel Program Cetveli (Modüllü)',
        description: 'Modül bazlı personel program cetveli',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },
    PERSONEL_CETVELI_SEANS: {
        id: 'personel_cetveli_seans',
        name: 'Personel Program Cetveli (Öğrenci, Gün, Seans)',
        description: 'Seans detaylı personel program cetveli',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },
    PERSONEL_CETVELI_DERSLIK: {
        id: 'personel_cetveli_derslik',
        name: 'Personel Program Cetveli (Derslik)',
        description: 'Derslik bazlı personel cetveli',
        category: 'personel',
        formats: ['pdf', 'excel'],
    },

    // EK-4: Öğrenci Aylık BEP Çizelgesi
    EK4_BEP_CIZELGESI: {
        id: 'ek4_bep_cizelgesi',
        name: 'Öğrenci Aylık BEP Çizelgesi (EK-4)',
        description: 'MEB EK-4 formatında aylık BEP çizelgesi',
        category: 'bep',
        formats: ['pdf', 'excel'],
        official: true,
    },
    EK4_BEP_FORM: {
        id: 'ek4_bep_form',
        name: 'Öğrenci Aylık BEP Çizelgesi (EK-4) Form',
        description: 'Boş BEP formu',
        category: 'bep',
        formats: ['pdf'],
        official: true,
    },
    EK4_BEP_DETAY: {
        id: 'ek4_bep_detay',
        name: 'Öğrenci Aylık BEP Çizelgesi (EK-4) Detay',
        description: 'Detaylı BEP çizelgesi',
        category: 'bep',
        formats: ['pdf', 'excel'],
        official: true,
    },
    EK4_BEP_MODULLU: {
        id: 'ek4_bep_modullu',
        name: 'Öğrenci Aylık BEP Çizelgesi (EK-4) Modüllü',
        description: 'Modül bazlı BEP çizelgesi',
        category: 'bep',
        formats: ['pdf', 'excel'],
        official: true,
    },
    EK4_BEP_MEBBIS: {
        id: 'ek4_bep_mebbis',
        name: 'Öğrenci Aylık BEP Çizelgesi (EK-4) MEBBİS',
        description: 'MEBBİS formatına uygun BEP çizelgesi',
        category: 'bep',
        formats: ['pdf', 'excel'],
        official: true,
    },
    EK4_BEP_EGITIMCI_GRUP: {
        id: 'ek4_bep_egitimci_grup',
        name: 'Öğrenci Aylık BEP Çizelgesi (Eğitimci Grup Ad)',
        description: 'Eğitimci grup bazlı BEP çizelgesi',
        category: 'bep',
        formats: ['pdf', 'excel'],
    },

    // EK-5: Personel Aylık Çalışma Çizelgesi
    EK5_CALISMA_CIZELGESI: {
        id: 'ek5_calisma_cizelgesi',
        name: 'Personel Aylık Çalışma Çizelgesi (EK-5)',
        description: 'MEB EK-5 formatında aylık çalışma çizelgesi',
        category: 'personel',
        formats: ['pdf', 'excel'],
        official: true,
    },
    EK5_CALISMA_TUMU: {
        id: 'ek5_calisma_tumu',
        name: 'Personel Aylık Çalışma Çizelgesi (EK-5) Tümü',
        description: 'Tüm personel için EK-5 çizelgesi',
        category: 'personel',
        formats: ['pdf', 'excel'],
        official: true,
    },
    EK5_CALISMA_HAFTALIK: {
        id: 'ek5_calisma_haftalik',
        name: 'Personel Aylık Çalışma Çizelgesi (EK-5) Haftalık',
        description: 'Haftalık format EK-5 çizelgesi',
        category: 'personel',
        formats: ['pdf', 'excel'],
        official: true,
    },
    EK5_CALISMA_TATIL: {
        id: 'ek5_calisma_tatil',
        name: 'Personel Aylık Çalışma Çizelgesi (EK-5) Haftalık Tatil',
        description: 'Tatil günleri dahil EK-5 çizelgesi',
        category: 'personel',
        formats: ['pdf', 'excel'],
        official: true,
    },

    // Fatura Raporları
    FATURA_LISTESI: {
        id: 'fatura_listesi',
        name: 'Öğrenci Aylık Fatura Listesi',
        description: 'Aylık öğrenci fatura listesi',
        category: 'finans',
        formats: ['pdf', 'excel'],
    },

    // Eğitimci Raporları
    EGITIMCI_OGRENCI_LISTESI: {
        id: 'egitimci_ogrenci_listesi',
        name: 'Eğitimci - Öğrenci Listesi',
        description: 'Eğitimcilere atanmış öğrenci listesi',
        category: 'egitimci',
        formats: ['pdf', 'excel'],
    },
    DONEMLIK_EGITIMCI_LISTESI: {
        id: 'donemlik_egitimci_listesi',
        name: 'Dönemlik Eğitimci Listesi',
        description: 'Dönem bazlı eğitimci listesi',
        category: 'egitimci',
        formats: ['pdf', 'excel'],
    },
    EGITIMCI_PROGRAMI: {
        id: 'egitimci_programi',
        name: 'Eğitimci Programı',
        description: 'Bireysel eğitimci programı',
        category: 'egitimci',
        formats: ['pdf', 'excel'],
    },
    PLANLANMIS_EGITIMCI_SEANS: {
        id: 'planlanmis_egitimci_seans',
        name: 'Planlanmış Eğitimci Seans Dağılımı',
        description: 'Eğitimci bazlı seans dağılım raporu',
        category: 'egitimci',
        formats: ['pdf', 'excel'],
    },

    // Öğrenci Raporları
    OGRENCI_DERS_DEFTERI: {
        id: 'ogrenci_ders_defteri',
        name: 'Öğrenci Ders Defteri',
        description: 'Gün bazlı öğrenci ders defteri',
        category: 'ogrenci',
        formats: ['pdf', 'excel'],
    },
    OGRENCI_MODUL_LISTESI: {
        id: 'ogrenci_modul_listesi',
        name: 'Öğrenci - Modül Listesi',
        description: 'Öğrenci modül eşleştirme listesi',
        category: 'ogrenci',
        formats: ['pdf', 'excel'],
    },
    PLANLANMIS_OGRENCI_SEANS: {
        id: 'planlanmis_ogrenci_seans',
        name: 'Planlanmış Öğrenci Seans Dağılımı',
        description: 'Öğrenci bazlı seans dağılım raporu',
        category: 'ogrenci',
        formats: ['pdf', 'excel'],
    },
    OGRENCI_SERVIS_LISTESI: {
        id: 'ogrenci_servis_listesi',
        name: 'Öğrenci Servis Listesi',
        description: 'Servis ile gelen öğrenci listesi',
        category: 'ogrenci',
        formats: ['pdf', 'excel'],
    },
    KUTUK_DEFTERI: {
        id: 'kutuk_defteri',
        name: 'Kütük Defteri Listesi',
        description: 'Okula giden çocuklar kütük defteri',
        category: 'ogrenci',
        formats: ['pdf', 'excel'],
    },

    // Diğer
    TAAHHUTNAME: {
        id: 'taahhutname',
        name: 'Taahhütname',
        description: 'Veli taahhütname formu',
        category: 'diger',
        formats: ['pdf'],
    },
} as const;

// ============================================================
// Types
// ============================================================

export type ReportId = typeof MEB_REPORT_TYPES[keyof typeof MEB_REPORT_TYPES]['id'];
export type ReportFormat = 'pdf' | 'excel';
export type ReportCategory = 'personel' | 'bep' | 'finans' | 'egitimci' | 'ogrenci' | 'diger';

export interface ReportRequest {
    reportId: ReportId;
    format: ReportFormat;
    filters: {
        tenantId: number;
        month?: number; // 1-12
        year?: number;
        startDate?: string;
        endDate?: string;
        studentId?: number;
        teacherId?: number;
        groupId?: number;
    };
}

export interface ReportResult {
    success: boolean;
    fileName: string;
    contentType: string;
    data: Buffer | null;
    error?: string;
}

// ============================================================
// Report Categories
// ============================================================

export const REPORT_CATEGORIES = {
    personel: {
        name: 'Personel Raporları',
        icon: 'users',
        color: 'blue',
    },
    bep: {
        name: 'BEP Raporları',
        icon: 'file-text',
        color: 'green',
    },
    finans: {
        name: 'Finans Raporları',
        icon: 'dollar-sign',
        color: 'yellow',
    },
    egitimci: {
        name: 'Eğitimci Raporları',
        icon: 'graduation-cap',
        color: 'purple',
    },
    ogrenci: {
        name: 'Öğrenci Raporları',
        icon: 'user',
        color: 'cyan',
    },
    diger: {
        name: 'Diğer',
        icon: 'file',
        color: 'gray',
    },
};

// ============================================================
// Helper Functions
// ============================================================

export function getReportsByCategory(category: ReportCategory) {
    return Object.values(MEB_REPORT_TYPES).filter(r => r.category === category);
}

export function getOfficialReports() {
    return Object.values(MEB_REPORT_TYPES).filter(r => 'official' in r && r.official);
}

export function getAllReports() {
    return Object.values(MEB_REPORT_TYPES);
}

export function getReportById(id: ReportId) {
    return Object.values(MEB_REPORT_TYPES).find(r => r.id === id);
}

export default MEB_REPORT_TYPES;
