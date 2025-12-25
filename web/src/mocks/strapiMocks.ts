import {
    HeroData,
    ServiceData,
    ProcessData,
    FAQData,
    GalleryData,
    AboutData,
    StrapiSingleResponse,
    StrapiCollectionResponse
} from '../services/contentService';

import { AttendanceRecord, AttendanceStats } from '../services/attendanceService';
import { ServiceRoute, LocationLog } from '../services/gpsTrackingService';

const mockImage = {
    id: 1,
    url: '/mock-image.jpg',
    alternativeText: 'Mock Image',
    width: 800,
    height: 600
};

export const mockHero: StrapiSingleResponse<HeroData> = {
    data: {
        id: 1,
        documentId: 'hero-1',
        title: 'Arkadaş Özel Eğitim',
        subtitle: 'Sevgi ve İlgiyle',
        description: 'Uzman kadromuzla yanınızdayız.',
        images: [mockImage],
        stats: [
            { id: 1, value: '10+', label: 'Yıl Deneyim' },
            { id: 2, value: '500+', label: 'Mutlu Aile' }
        ]
    },
    meta: {}
};

export const mockServices: StrapiCollectionResponse<ServiceData> = {
    data: [
        {
            id: 1,
            documentId: 'service-1',
            title: 'Özel Eğitim',
            description: 'Bireysel eğitim programları',
            icon: 'book',
            slug: 'ozel-egitim',
            features: [{ id: 1, text: 'Birebir ilgi' }]
        },
        {
            id: 2,
            documentId: 'service-2',
            title: 'Fizyoterapi',
            description: 'Fizik tedavi hizmetleri',
            icon: 'activity',
            slug: 'fizyoterapi',
            features: [{ id: 2, text: 'Modern ekipman' }]
        }
    ],
    meta: {
        pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 1,
            total: 2
        }
    }
};

export const mockProcesses: StrapiCollectionResponse<ProcessData> = {
    data: [
        {
            id: 1,
            documentId: 'process-1',
            number: '01',
            title: 'Tanışma',
            description: 'İlk görüşme ve değerlendirme',
            icon: 'users'
        }
    ],
    meta: {}
};

export const mockFAQs: StrapiCollectionResponse<FAQData> = {
    data: [
        {
            id: 1,
            documentId: 'faq-1',
            question: 'Eğitim saatleri nedir?',
            answer: 'Hafta içi 09:00 - 18:00 arasıdır.'
        }
    ],
    meta: {}
};

export const mockGallery: StrapiCollectionResponse<GalleryData> = {
    data: [
        {
            id: 1,
            documentId: 'gallery-1',
            title: 'Sınıflarımız',
            category: 'Eğitim',
            alt: 'Sınıf görseli',
            image: mockImage
        }
    ],
    meta: {}
};

export const mockAbout: StrapiSingleResponse<AboutData> = {
    data: {
        id: 1,
        documentId: 'about-1',
        title: 'Hakkımızda',
        blocks: [
            {
                __component: 'shared.rich-text',
                id: 1,
                body: 'Biz Arkadaş Özel Eğitim Kurumuyuz.'
            }
        ]
    },
    meta: {}
};

export const mockAttendanceStats: AttendanceStats = {
    totalStudents: 120,
    presentToday: 95,
    absentToday: 15,
    lateToday: 10,
    attendanceRate: 79.16
};

export const mockAttendanceRecords: AttendanceRecord[] = [
    {
        id: 1,
        documentId: 'att-1',
        checkInTime: new Date().toISOString(),
        status: 'present',
        verificationMethod: 'face_recognition',
        student: { id: 1, fullName: 'Ali Veli' }
    }
];

export const mockServiceRoutes: ServiceRoute[] = [
    {
        id: 1,
        documentId: 'route-1',
        name: 'Sabah Servisi - 1',
        vehiclePlate: '35 ABC 123',
        capacity: 16,
        isActive: true,
        morningDepartureTime: '08:00',
        afternoonDepartureTime: '16:00',
        stops: [
            {
                id: 1,
                documentId: 'stop-1',
                name: 'Durak 1',
                latitude: 38.4192,
                longitude: 27.1287,
                stopOrder: 1,
                estimatedArrivalOffsetMinutes: 10
            }
        ]
    }
];

export const mockLocationLog: LocationLog = {
    id: 1,
    latitude: 38.4192,
    longitude: 27.1287,
    recordedAt: new Date().toISOString(),
    speedKmh: 45
};
