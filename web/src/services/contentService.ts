const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_DATA === 'true';

import {
  mockHero,
  mockServices,
  mockProcesses,
  mockFAQs,
  mockGallery,
  mockAbout
} from '../mocks/strapiMocks';

export interface StrapiSingleResponse<T> {
  data: T & {
    id: number;
    documentId: string;
  };
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiCollectionResponse<T> {
  data: (T & {
    id: number;
    documentId: string;
  })[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface Image {
  id: number;
  url: string;
  alternativeText: string;
  width: number;
  height: number;
}

export interface ImageArray {
  data: Image[];
}

export interface HeroData {
  title: string;
  subtitle: string;
  description: string;
  images: Image[] | null; // Unified images type

  stats: {
    id: number;
    value: string;
    label: string;
  }[];
}

export interface ServiceData {
  title: string;
  description: string;
  icon: string;
  slug: string;
  features: {
    id: number;
    text: string;
  }[];
}

export interface ProcessData {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export interface FAQData {
  question: string;
  answer: string;
}

export interface GalleryData {
  title: string;
  category: string;
  alt: string;
  image: Image;
}

export interface AboutData {
  title: string;
  blocks: {
    __component: string;
    id: number;
    body?: string;
  }[];
}

export const contentService = {
  async getHero(): Promise<StrapiSingleResponse<HeroData>> {
    if (USE_MOCK) return Promise.resolve(mockHero);

    const params = new URLSearchParams();
    params.append("populate[0]", "images");
    params.append("populate[1]", "stats");

    const response = await fetch(`${STRAPI_URL}/api/hero?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Failed to fetch hero data");
    return response.json();
  },

  async getServices(): Promise<StrapiCollectionResponse<ServiceData>> {
    if (USE_MOCK) return Promise.resolve(mockServices);

    const params = new URLSearchParams();
    params.append("populate[0]", "features");

    const response = await fetch(`${STRAPI_URL}/api/services?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Failed to fetch services data");
    return response.json();
  },

  async getProcesses(): Promise<StrapiCollectionResponse<ProcessData>> {
    if (USE_MOCK) return Promise.resolve(mockProcesses);

    // Strapi sorting: sort[0]=field:asc
    const params = new URLSearchParams();
    params.append("sort[0]", "number:asc");

    const response = await fetch(`${STRAPI_URL}/api/processes?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Failed to fetch processes data");
    return response.json();
  },

  async getFAQs(): Promise<StrapiCollectionResponse<FAQData>> {
    if (USE_MOCK) return Promise.resolve(mockFAQs);

    const response = await fetch(`${STRAPI_URL}/api/faqs`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Failed to fetch FAQs data");
    return response.json();
  },

  async getGallery(): Promise<StrapiCollectionResponse<GalleryData>> {
    if (USE_MOCK) return Promise.resolve(mockGallery);

    const params = new URLSearchParams();
    params.append("populate[0]", "image");

    const response = await fetch(`${STRAPI_URL}/api/galleries?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Failed to fetch gallery data");
    return response.json();
  },

  async getAbout(): Promise<StrapiSingleResponse<AboutData>> {
    if (USE_MOCK) return Promise.resolve(mockAbout);

    const params = new URLSearchParams();
    params.append("populate[0]", "blocks");

    const response = await fetch(`${STRAPI_URL}/api/about?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Failed to fetch about data");
    return response.json();
  },

  getStrapiUrl(path: string) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${STRAPI_URL}${path}`;
  }
};
