"use client";

import React, { useState, useRef } from "react";
import Modal from "./Modal";
import { ServiceData } from "@/services/contentService";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface ServicesProps {
  data: ServiceData[];
}

const iconMap: { [key: string]: string } = {
  comments: "💬",
  brain: "🧠",
  users: "👥",
  book: "📖",
  speech: "🗨️",
};

const Services: React.FC<ServicesProps> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const openModal = (service: ServiceData) => {
    const modalService = {
      ...service,
      icon: iconMap[service.icon] || service.icon || "🔧",
      features: service.features.map(f => f.text)
    };
    setSelectedService(modalService);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  if (!data) return null;

  return (
    <section
      id="services"
      className="min-h-screen flex flex-col justify-center py-16 bg-white relative overflow-x-auto"
      aria-labelledby="services-heading"
    >
      {/* Background Image - Hands */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <img
          src="/images/decor_hands.webp"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
      </div>

      <div className="w-full max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            id="services-heading"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-dark mt-4 mb-6 leading-normal pb-2"
          >
            Çocuğunuz İçin
            <span className="text-gradient block leading-tight pb-2">En İyi Hizmetler</span>
          </h2>
          <p className="font-body text-lg text-neutral-dark/80 max-w-3xl mx-auto leading-relaxed">
            Uzman kadromuz ve kanıta dayalı yöntemlerimizle, her çocuğun
            bireysel ihtiyaçlarına uygun özel eğitim ve rehabilitasyon
            hizmetleri sunuyoruz.
          </p>
        </div>

        {/* Services Slider */}
        {/* Services Slider */}
        <div className="services-swiper-container relative">
          {/* Custom Navigation Buttons */}
          <button
            ref={prevRef}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 hidden md:flex items-center justify-center text-primary hover:scale-110 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none"
            aria-label="Önceki"
          >
            <svg width="11" height="20" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z" fill="currentColor" transform="rotate(180 5.5 10)" />
            </svg>
          </button>

          <button
            ref={nextRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 hidden md:flex items-center justify-center text-primary hover:scale-110 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none"
            aria-label="Sonraki"
          >
            <svg width="11" height="20" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z" fill="currentColor" />
            </svg>
          </button>

          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              // @ts-ignore
              swiper.params.navigation.prevEl = prevRef.current;
              // @ts-ignore
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 32,
              },
            }}
            centerInsufficientSlides={true}
            wrapperClass="!justify-center"
            className="!pb-16 !px-4 md:!px-16"
          >
            {data.map((service, index) => (
              <SwiperSlide key={index} className="h-auto">
                <div className="h-full flex flex-col bg-white rounded-3xl p-8 card-shadow hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden group border border-gray-100/50">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10 flex flex-col flex-grow">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-500 shadow-sm group-hover:shadow-md">
                      <span className="text-4xl filter drop-shadow-sm">{iconMap[service.icon] || service.icon || "🔧"}</span>
                    </div>

                    {/* Content */}
                    <h3 className="font-display text-xl font-bold text-neutral-dark mb-4 group-hover:text-primary transition-colors duration-300 leading-normal pb-1">
                      {service.title}
                    </h3>

                    <p className="font-body text-neutral-dark/80 mb-6 leading-relaxed flex-grow">
                      {service.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {service.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-1.5 h-1.5 mt-2 bg-secondary rounded-full flex-shrink-0"></div>
                          <span className="font-body text-sm text-neutral-dark/70">
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Learn More Link */}
                    <div className="mt-auto pt-6 border-t border-gray-100 relative z-20">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openModal(service);
                        }}
                        className="font-body text-primary font-semibold text-sm hover:text-primary/80 transition-colors duration-200 flex items-center space-x-2 group-btn cursor-pointer"
                      >
                        <span>Detayları Görün</span>
                        <svg
                          className="w-4 h-4 transform group-btn-hover:translate-x-1 transition-transform duration-200"
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
                      </button>
                    </div>
                  </div>

                  {/* Decorative Element */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} service={selectedService} />
    </section>
  );
};

export default Services;