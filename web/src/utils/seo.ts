import { Metadata } from 'next';

interface StrapiSeoData {
  metaTitle: string;
  metaDescription: string;
  shareImage?: {
    data: {
      attributes: {
        url: string;
        width: number;
        height: number;
        alternativeText: string;
      };
    };
  };
  keywords?: string;
  metaRobots?: string;
  canonicalURL?: string;
}

export function getMetadata(seoData: StrapiSeoData): Metadata {
  if (!seoData) return {};

  const metadata: Metadata = {
    title: seoData.metaTitle,
    description: seoData.metaDescription,
    keywords: seoData.keywords,
    robots: seoData.metaRobots,
    alternates: {
      canonical: seoData.canonicalURL,
    },
    openGraph: {
      title: seoData.metaTitle,
      description: seoData.metaDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.metaTitle,
      description: seoData.metaDescription,
    },
  };

  if (seoData.shareImage?.data?.attributes?.url) {
    const imageUrl = seoData.shareImage.data.attributes.url;
    // Ensure absolute URL if needed, depending on how Strapi serves images
    // const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL}${imageUrl}`;
    
    // Assuming Strapi URL might be needed if it's a relative path
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${strapiUrl}${imageUrl}`;

    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: fullImageUrl,
          width: seoData.shareImage.data.attributes.width,
          height: seoData.shareImage.data.attributes.height,
          alt: seoData.shareImage.data.attributes.alternativeText || seoData.metaTitle,
        },
      ],
    };
    metadata.twitter = {
        ...metadata.twitter,
        images: [fullImageUrl],
    }
  }

  return metadata;
}
