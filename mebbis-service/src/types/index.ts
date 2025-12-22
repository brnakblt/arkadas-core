/**
 * Arkadaş MEBBIS Service - Type Definitions
 * 
 * TypeScript type definitions migrated from the C# OzelEgitim.ModelApi models.
 * These types represent the core entities for special education management.
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

/**
 * Seans tipi - Session type (Individual or Group)
 */
export enum SeansType {
    Bireysel = 1,  // Individual
    Grup = 2,      // Group
}

/**
 * Status type for education entry records
 */
export enum StatusType {
    Aktarilacak = 0,  // To be transferred
    Aktarildi = 1,    // Transferred
    Silinecek = 2,    // To be deleted
}

/**
 * Devamsızlık durumu - Attendance status
 */
export enum DevamsizlikStatus {
    Katildi = 0,      // Attended
    Gelmedi = 1,      // Absent
    Telafi = 2,       // Make-up session
}

// ============================================================================
// Student (Öğrenci) Types
// ============================================================================

/**
 * Öğrenci - Student profile
 */
export interface Ogrenci {
    id: string;
    tcKimlikNo: string;           // Turkish ID number
    ad: string;                    // First name
    soyad: string;                 // Last name
    babaAdi: string;               // Father's name
    kayitTarihi: string;           // Registration date (ISO string)
    okulBilgisi?: OgrenciOkul;     // School information
    raporBilgisi?: OgrenciRapor;   // Report information
    modulSureleri?: OgrenciModulSuresi[]; // Module durations
}

/**
 * Öğrenci Okul Bilgisi - Student school information
 */
export interface OgrenciOkul {
    okulAdi?: string;
    sinif?: string;
    okulTuru?: string;
}

/**
 * Öğrenci Rapor Bilgisi - Student report (disability assessment)
 */
export interface OgrenciRapor {
    raporNo: string[];             // Report numbers
    raporTarihi?: string;
    engelGrubu?: string;           // Disability group
    engelOrani?: number;           // Disability percentage
    programlar?: OgrenciRaporProgram[];
}

/**
 * Rapor Program - Program in student report
 */
export interface OgrenciRaporProgram {
    programId: string;
    programAdi: string;
    moduller?: OgrenciRaporModul[];
}

/**
 * Rapor Modül - Module in report program
 */
export interface OgrenciRaporModul {
    modulId: string;
    modulAdi: string;
    sure: number;  // Duration in minutes
}

/**
 * Öğrenci Modül Süresi - Student module duration
 */
export interface OgrenciModulSuresi {
    modulId: string;
    modulAdi: string;
    bireyselSure: number;  // Individual session duration
    grupSure: number;      // Group session duration
}

/**
 * Dönem Öğrenci - Student in a specific term
 */
export interface DonemOgrenci {
    ogrenciId: string;
    tcKimlikNo: string;
    adSoyad: string;
    bireyselDersSayisi: number;
    grupDersSayisi: number;
    bireyselTelafiSayisi: number;
    grupTelafiSayisi: number;
}

// ============================================================================
// Educator (Eğitimci) Types
// ============================================================================

/**
 * Eğitimci - Educator/Therapist profile
 */
export interface Egitimci {
    id: string;
    tcKimlikNo: string;
    ad: string;
    soyad: string;
    unvanId?: string;
    unvanAdi?: string;
    onayNo?: string;              // MEBBIS approval number
    telefon?: string;
    email?: string;
}

/**
 * Eğitimci Ünvan - Educator title/qualification
 */
export interface EgitimciUnvan {
    id: string;
    ad: string;
}

/**
 * Dönem Eğitimci - Educator in a specific term
 */
export interface DonemEgitimci {
    egitimciId: string;
    tcKimlikNo: string;
    adSoyad: string;
    onayNo?: string;
}

// ============================================================================
// Education Entry (Eğitim Bilgisi Giriş) Types
// ============================================================================

/**
 * Eğitim Bilgi Girişi - Education entry record
 */
export interface EgitimBilgiGiris {
    id?: string;
    tarih: string;                 // Date (ISO string)
    saat: string;                  // Time (HH:mm format)
    seansTip: SeansType;
    telafi: boolean;               // Is make-up session
    telafiAy?: number;             // Make-up month
    telafiYil?: number;            // Make-up year

    // Student info
    ogrenciId: string;
    ogrenciTcKimlikNo: string;
    ogrenciAdSoyad: string;
    ogrenciRaporNo: string[];

    // Educator info
    egitimciId: string;
    egitimciTcKimlikNo: string;
    egitimciAdSoyad: string;
    egitimciOnayNo?: string;

    // Program info
    programId: string;
    programAd: string;
    modulId: string;
    modulAd: string;
    bolumId: string;
    bolumAd: string;
    okulProgramId?: string;
    okulProgramAd?: string;

    // Classroom
    derslikId: string;
    derslikAd: string;

    // Session
    seansId: string;
    seansAd: string;

    // Goals and behaviors
    hedefler: EgitimHedef[];

    // Status
    durum: StatusType;
    manuelAktarma?: boolean;
    aciklama?: string;
    error?: boolean;
}

/**
 * Eğitim Hedef - Educational goal
 */
export interface EgitimHedef {
    hedefId: string;
    hedefAd: string;
    hedefDavranislar: string[];    // Target behaviors
}

// ============================================================================
// Invoice (Fatura) Types
// ============================================================================

/**
 * MEB Fatura - Ministry invoice
 */
export interface MebFatura {
    id?: string;
    tcKimlikNo: string;
    adSoyad: string;
    donem: string;                 // Period (YYYY-MM format)
    bireyselDersSayisi?: number;   // Individual lesson count
    grupDersSayisi?: number;       // Group lesson count
    bireyselTelafiSayisi?: number; // Individual make-up count
    grupTelafiSayisi?: number;     // Group make-up count
    faturaTarih?: string;
    faturaSeri?: string;
    faturaNo?: string;
    faturaTutar?: number;
    aciklama?: string;
    error?: boolean;
}

/**
 * Fatura Oluşturma - Create invoice request
 */
export interface CreateFaturaRequest {
    donem: string;
    faturaTarih: string;
    faturaSaat?: string;
    belgeSeri?: string;
    belgeNo?: string;
    bireyselEgitimAd: string;
    grupEgitimAd: string;
    telafiAyriOlustur: boolean;
    telafiSondaOlustur: boolean;
    tcKimlikNo: string;
    adSoyad: string;
    bireyselDersSayisi: number;
    grupDersSayisi: number;
    bireyselTelafiDersSayisi: number;
    grupTelafiDersSayisi: number;
}

/**
 * Fatura Onay - Invoice approval result
 */
export interface FaturaInfo {
    faturaTarih: string;
    belgeSeri: string;
    belgeNo: string;
    faturaTutar: number;
}

// ============================================================================
// BEP (Bireyselleştirilmiş Eğitim Programı) Types
// ============================================================================

/**
 * BEP Öğrenci Listesi - BEP student list
 */
export interface BepOgrenciListesi {
    ogrenciId: string;
    tcKimlikNo: string;
    adSoyad: string;
    programId: string;
    programAdi: string;
    aylikFormDurumu?: string;
}

/**
 * BEP Performans Kayıt - Performance record form (EK-4)
 */
export interface BepPerformansKayit {
    ogrenciId: string;
    programId: string;
    donem: string;
    bolumler: BepBolum[];
}

/**
 * BEP Bölüm - BEP section
 */
export interface BepBolum {
    bolumId: string;
    bolumAdi: string;
    hedefler: BepHedef[];
}

/**
 * BEP Hedef - BEP goal
 */
export interface BepHedef {
    hedefId: string;
    hedefAdi: string;
    davranislar: BepDavranis[];
}

/**
 * BEP Davranış - BEP behavior
 */
export interface BepDavranis {
    davranisId: string;
    davranisAdi: string;
    degerler: BepDeger[];
}

/**
 * BEP Değer - BEP value/score
 */
export interface BepDeger {
    hafta: number;
    deger: string;
}

/**
 * BEP Gelişim İzleme - Development monitoring form (EK-5)
 */
export interface BepGelisimIzleme {
    ogrenciId: string;
    programId: string;
    donem: string;
    ozet: string;
    bolumler: BepGelisimBolum[];
}

/**
 * BEP Gelişim Bölüm - Development section
 */
export interface BepGelisimBolum {
    bolumId: string;
    bolumAdi: string;
    aciklama: string;
}

/**
 * BEP Portfolyo Kontrol Listesi - Portfolio checklist (EK-6)
 */
export interface BepPortfolyoKontrol {
    ogrenciId: string;
    programId: string;
    donem: string;
    urunler: BepUrun[];
}

/**
 * BEP Ürün - Portfolio product
 */
export interface BepUrun {
    urunId: string;
    urunAdi: string;
    tarih?: string;
    aciklama?: string;
}

// ============================================================================
// Classroom & Schedule Types
// ============================================================================

/**
 * Derslik - Classroom
 */
export interface Derslik {
    id: string;
    ad: string;
    kapasite?: number;
    aktif: boolean;
}

/**
 * Seans - Session time slot
 */
export interface Seans {
    id: string;
    ad: string;
    baslangicSaati: string;  // HH:mm format
    bitisSaati: string;      // HH:mm format
}

/**
 * Program - Education program
 */
export interface Program {
    id: string;
    ad: string;
    moduller?: Modul[];
}

/**
 * Modül - Module within a program
 */
export interface Modul {
    id: string;
    ad: string;
    programId: string;
    bolumler?: Bolum[];
}

/**
 * Bölüm - Section within a module
 */
export interface Bolum {
    id: string;
    ad: string;
    modulId: string;
    hedefler?: Hedef[];
}

/**
 * Hedef - Educational goal
 */
export interface Hedef {
    id: string;
    ad: string;
    bolumId: string;
    davranislar?: string[];
}

// ============================================================================
// Attendance Types
// ============================================================================

/**
 * Öğrenci Devamsızlık - Student attendance record
 */
export interface OgrenciDevamsizlik {
    ogrenciId: string;
    tcKimlikNo: string;
    adSoyad: string;
    tarih: string;
    seansTip: SeansType;
    durum: DevamsizlikStatus;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Base API response
 */
export interface ApiResponse<T = void> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
}

/**
 * Job status response
 */
export interface JobStatus {
    jobId: string;
    status: 'waiting' | 'active' | 'completed' | 'failed';
    progress?: number;
    result?: unknown;
    error?: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const OgrenciSchema = z.object({
    tcKimlikNo: z.string().length(11),
    ad: z.string().min(1),
    soyad: z.string().min(1),
    babaAdi: z.string().optional(),
    kayitTarihi: z.string(),
});

export const EgitimBilgiGirisSchema = z.object({
    tarih: z.string(),
    saat: z.string().regex(/^\d{2}:\d{2}$/),
    seansTip: z.nativeEnum(SeansType),
    telafi: z.boolean(),
    ogrenciId: z.string(),
    egitimciId: z.string(),
    programId: z.string(),
    bolumId: z.string(),
    derslikId: z.string(),
    hedefler: z.array(z.object({
        hedefId: z.string(),
        hedefAd: z.string(),
        hedefDavranislar: z.array(z.string()),
    })),
});

export const CreateFaturaSchema = z.object({
    donem: z.string().regex(/^\d{4}-\d{2}$/),
    faturaTarih: z.string(),
    tcKimlikNo: z.string().length(11),
    bireyselDersSayisi: z.number().min(0),
    grupDersSayisi: z.number().min(0),
});
