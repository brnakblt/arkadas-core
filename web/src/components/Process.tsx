"use client";

import React from "react";
import { ProcessData } from "@/services/contentService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface ProcessProps {
  data: ProcessData[];
}

const iconMap: { [key: string]: string } = {
  users: "👥",
  "clipboard-list": "📋",
  bullseye: "🚀",
  "user-friends": "👨‍👩‍👧‍👦",
  "chart-line": "📈",
  handshake: "🤝",
  chat: "💬",
  search: "🔍",
  map: "🗺️",
  "comments": "💬",
  "brain": "🧠",
};

const Process: React.FC<ProcessProps> = ({ data }) => {
  if (!data) return null;

  return (
    <section
      id="process"
      className="py-20 bg-white relative overflow-hidden"
      aria-labelledby="process-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-dark mt-4 mb-6 leading-normal pb-2">
            Nasıl
            <span className="text-gradient block leading-tight pb-2">Çalışıyoruz</span>
          </h2>
          <p className="font-body text-lg text-neutral-dark/80 max-w-3xl mx-auto leading-relaxed">
            Kanıta dayalı yöntemlerimiz ve sistematik yaklaşımımızla her çocuğun
            bireysel gelişim sürecini titizlikle planlıyor ve uyguluyoruz.
          </p>
        </div>

        <div className="relative pt-8">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={30}
            slidesPerView={1}
            loop={data.length > 4}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            navigation={true}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 40,
              },
            }}
            className="!pb-16 px-4"
            style={{ overflow: 'clip', overflowClipMargin: '40px' }}
          >
            {data.map((step, index) => (
              <SwiperSlide key={index} className="h-auto">
                <div className="group relative bg-white rounded-3xl p-8 mt-8 card-shadow hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full flex flex-col items-center">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-xl border-4 border-white z-20">
                    <span className="font-display font-bold text-white text-xl">
                      {step.number}
                    </span>
                  </div>
                  <div className="text-5xl mb-6 mt-10 text-center filter drop-shadow-lg flex justify-center">
                    <span className="text-6xl">{iconMap[step.icon] || step.icon || "📄"}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-neutral-dark mb-4 group-hover:text-primary transition-colors duration-300 text-center leading-normal pb-1">
                    {step.title}
                  </h3>
                  <p className="font-body text-neutral-dark/80 leading-relaxed text-center flex-grow">
                    {step.description}
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/5 to-secondary/8 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Process;
