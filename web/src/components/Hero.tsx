"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { HeroData, contentService } from "@/services/contentService";

interface HeroProps {
  data: HeroData;
}

const Hero: React.FC<HeroProps> = ({ data }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = data.images?.map(img => contentService.getStrapiUrl(img.url)) || [];

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(nextImage, 5000);
    return () => clearInterval(interval);
  }, [nextImage, images.length]);

  if (!data) return null;

  return (
    <section
      id="home"
      tabIndex={-1}
      className="relative min-h-screen flex items-center overflow-hidden focus:outline-none rounded-b-2xl"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {images.map((src, index) => (
          <Image
            key={src}
            src={src}
            unoptimized // Re-enabled to fix 400 Error
            alt={`Slide ${index + 1}`}
            fill
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 ${index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            priority={index === 0}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevImage}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/50 hover:bg-white/80 text-primary p-2 rounded-full z-20"
        aria-label="Önceki Slayt"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextImage}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/50 hover:bg-white/80 text-primary p-2 rounded-full z-20"
        aria-label="Sonraki Slayt"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Navigation Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-3 h-3 rounded-full border-[6px] border-transparent bg-clip-padding box-content ${index === currentImageIndex ? "bg-white" : "bg-white/50"
              }`}
            aria-label={`Slayt ${index + 1}`}
          ></button>
        ))}
      </div>


      {/* Curved Overlay */}
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <div className="relative w-full h-full">
          <svg
            className="absolute right-0 w-full h-full"
            viewBox="0 0 400 800"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M180 0C320 120 400 300 320 400C260 500 370 600 400 800H400V0H180Z"
              fill="url(#heroGradient)"
              fillOpacity="0.3"
            />
            <defs>
              <linearGradient
                id="heroGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#A5D6A7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-white bg-black/20 p-6 md:p-8 rounded-lg backdrop-blur-sm">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-normal mb-6 pb-2 break-words text-wrap">
              {data.title}
              {data.subtitle && <span className="block text-secondary">{data.subtitle}</span>}
            </h1>
            <p className="font-body text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              {data.description}
            </p>
            <div className="hidden md:flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  const contactSection = document.getElementById("contact");
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: "smooth" });
                    contactSection.focus({ preventScroll: true });
                  }
                }}
                className="bg-secondary text-white px-8 py-4 rounded-full font-body font-semibold hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105"
              >
                Randevu Alın
              </button>
              <button
                onClick={() => {
                  const aboutSection = document.getElementById("about");
                  if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: "smooth" });
                    aboutSection.focus({ preventScroll: true });
                  }
                }}
                className="bg-white text-primary px-8 py-4 rounded-full font-body font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Daha Fazla Bilgi
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-6">
              {data.stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {stat.value}
                  </div>
                  <div className="font-body text-neutral-dark/80">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;