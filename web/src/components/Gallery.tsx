"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GalleryData, contentService } from "@/services/contentService";

interface GalleryProps {
  data: GalleryData[];
}

const Gallery: React.FC<GalleryProps> = ({ data }) => {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
    width: number;
    height: number;
  } | null>(null);

  // Extract unique categories from data
  const categories = ["Hepsi", ...Array.from(new Set(data.map(item => item.category)))];
  const [activeCategory, setActiveCategory] = useState("Hepsi");

  const filteredImages =
    activeCategory === "Hepsi"
      ? data
      : data.filter((img) => img.category === activeCategory);

  if (!data) return null;

  return (
    <section id="gallery" className="py-20 bg-neutral-light dark:bg-surface relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-dark dark:text-neutral-100 mt-4 mb-6 leading-normal pb-2">
            Merkezimizden
            <span className="text-gradient block leading-tight pb-2">Kareler</span>
          </h2>
          <p className="font-body text-lg text-neutral-dark/80 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Özel eğitim ve rehabilitasyon merkezimizde gerçekleştirdiğimiz
            çalışmalardan ve mutlu anlardan kareler.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`px-6 py-3 rounded-full font-body font-medium transition-all duration-300 ${activeCategory === category
                ? "bg-primary text-white shadow-lg"
                : "bg-gray-100 dark:bg-neutral-800 text-neutral-dark dark:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredImages.map((image, index) => {
            const imageUrl = image.image ? contentService.getStrapiUrl(image.image.url) : "";
            if (!imageUrl) return null;

            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl cursor-pointer transform transition-all duration-500 hover:scale-105"
                onClick={() => setSelectedImage({
                  url: imageUrl,
                  alt: image.alt || image.title || "",
                  width: image.image.width,
                  height: image.image.height
                })}
                role="button"
                tabIndex={0}
                aria-label={`Görüntüle: ${image.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedImage({
                      url: imageUrl,
                      alt: image.alt || image.title || "",
                      width: image.image.width,
                      height: image.image.height
                    });
                  }
                }}
              >
                <div className="relative w-full h-64">
                  <Image
                    src={imageUrl}
                    alt={image.alt || image.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="text-xs font-body font-medium text-secondary mb-2 uppercase tracking-wider">
                      {image.category}
                    </div>
                    <h3 className="font-display text-lg font-bold mb-2 leading-normal pb-1">
                      {image.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-body">Detayları Görün</span>
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center justify-center">
                  <span className="text-xs font-body font-medium text-neutral-dark">
                    {image.category}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt}
                width={selectedImage.width}
                height={selectedImage.height}
                unoptimized
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                style={{ width: 'auto', height: 'auto' }}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-200"
                aria-label="Kapat"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="font-body text-neutral-dark/80 dark:text-neutral-300 mb-6">
            Merkezimizi ziyaret etmek ve daha fazla bilgi almak ister misiniz?
          </p>
          <button
            onClick={() =>
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-primary text-white px-8 py-4 rounded-full font-body font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
          >
            Randevu Alın
          </button>
        </div>
      </div>
    </section >
  );
};

export default Gallery;