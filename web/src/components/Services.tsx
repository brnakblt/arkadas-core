'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Modal from './Modal';
import { ServiceData } from '@/services/contentService';
import Image from 'next/image';

// Dynamically import the slider component to reduce TBT
const ServicesSlider = dynamic(() => import('./ServicesSlider'), {
  ssr: true,
  loading: () => <div className="h-[400px] flex items-center justify-center">Yükleniyor...</div>
});

interface ServicesProps {
  data: ServiceData[];
}

interface ServiceModalData extends Omit<ServiceData, 'features'> {
  features: string[];
}

const iconMap: { [key: string]: string } = {
  comments: '💬',
  brain: '🧠',
  users: '👥',
  book: '📖',
  speech: '🗨️',
};

const Services: React.FC<ServicesProps> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceModalData | null>(null);

  const openModal = (service: ServiceData) => {
    const modalService = {
      ...service,
      icon: iconMap[service.icon] || service.icon || '🔧',
      features: service.features.map((f) => f.text),
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
        <Image
          src="/images/decor_hands.webp"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          quality={60}
        />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"></div>

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
            Uzman kadromuz ve kanıta dayalı yöntemlerimizle, her çocuğun bireysel ihtiyaçlarına
            uygun özel eğitim ve rehabilitasyon hizmetleri sunuyoruz.
          </p>
        </div>

        {/* Services Slider */}
        <ServicesSlider data={data} openModal={openModal} iconMap={iconMap} />
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} service={selectedService} />
    </section>
  );
};

export default Services;
