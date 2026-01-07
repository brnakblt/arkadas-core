"use client";

import React, { useRef } from 'react';
import { ProcessData } from '@/services/contentService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import BezierBackground from './BezierBackground';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import {
  faUsers,
  faClipboardList,
  faBullseye,
  faUserFriends,
  faChartLine,
  faHandshake,
  faComments,
  faSearch,
  faMapMarkedAlt,
  faBrain,
  faFileAlt,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface ProcessProps {
  data: ProcessData[];
}

interface IconConfig {
  icon: IconDefinition;
  className: string;
}

const iconMap: { [key: string]: IconConfig } = {
  // Mapping for literal emojis from seed data
  '👥': { icon: faUsers, className: "text-blue-500" },
  '📋': { icon: faClipboardList, className: "text-amber-500" },
  '🚀': { icon: faRocket, className: "text-red-500" },
  '👨‍👩‍👧‍👦': { icon: faUserFriends, className: "text-emerald-500" },
  '📈': { icon: faChartLine, className: "text-violet-500" },
  '🤝': { icon: faHandshake, className: "text-orange-500" },

  // Existing keys
  users: { icon: faUsers, className: "text-blue-500" },
  'clipboard-list': { icon: faClipboardList, className: "text-amber-500" },
  bullseye: { icon: faBullseye, className: "text-red-500" },
  'user-friends': { icon: faUserFriends, className: "text-emerald-500" },
  'chart-line': { icon: faChartLine, className: "text-violet-500" },
  handshake: { icon: faHandshake, className: "text-orange-500" },
  chat: { icon: faComments, className: "text-cyan-500" },
  search: { icon: faSearch, className: "text-indigo-500" },
  map: { icon: faMapMarkedAlt, className: "text-pink-500" },
  comments: { icon: faComments, className: "text-cyan-500" },
  brain: { icon: faBrain, className: "text-rose-500" },
};

const Process: React.FC<ProcessProps> = ({ data }) => {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (!data || data.length === 0) return null;

  // Duplicate items enough times to ensure smooth looping
  // Swiper needs significantly more slides than slidesPerView for smooth loop
  // especially with centeredSlides and multiple breakpoints.
  // We'll target at least 12 items to be safe for 3 visible items.
  let items = [...data];
  while (items.length < 12) {
    items = [...items, ...data];
  }

  return (
    <section
      id="process"
      className="flex flex-col min-h-screen justify-center py-24 scroll-mt-0 relative overflow-hidden bg-neutral-light dark:bg-surface"
      aria-labelledby="process-heading"
    >
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>
        <BezierBackground className="h-full w-full" />
      </div>

      <div className="w-full max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-dark dark:text-neutral-100 mt-4 mb-6 leading-normal pb-2">
            Nasıl
            <span className="text-gradient block leading-tight pb-2">Çalışıyoruz</span>
          </h2>
          <p className="font-body text-lg text-neutral-dark/80 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Kanıta dayalı yöntemlerimiz ve sistematik yaklaşımımızla her çocuğun bireysel gelişim
            sürecini titizlikle planlıyor ve uyguluyoruz.
          </p>
        </div>

        <div className="relative pt-8 px-4 sm:px-12">
          {/* Custom Navigation Buttons */}
          <button
            ref={prevRef}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 hidden md:flex items-center justify-center text-primary hover:scale-110 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none"
            aria-label="Önceki"
          >
            <svg
              width="11"
              height="20"
              viewBox="0 0 11 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z"
                fill="currentColor"
                transform="rotate(180 5.5 10)"
              />
            </svg>
          </button>

          <button
            ref={nextRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 hidden md:flex items-center justify-center text-primary hover:scale-110 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none"
            aria-label="Sonraki"
          >
            <svg
              width="11"
              height="20"
              viewBox="0 0 11 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            loop={true}
            speed={500}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            observer={true}
            observeParents={true}
            centeredSlides={true}
            // loopedSlides={4} // Explicitly set loopedSlides if needed, but usually auto works if we have enough items
            spaceBetween={24}
            slidesPerView={1}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
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
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 24,
                centeredSlides: true,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 32,
                centeredSlides: true,
              },
            }}
            className="!pb-16 px-0 !overflow-visible"
          >
            {items.map((step, index) => (
              <SwiperSlide key={`${index}-${step.number}`} className="h-auto transition-all duration-300">
                <div className="group relative bg-white dark:bg-neutral-800 rounded-3xl p-6 mt-8 card-shadow hover:shadow-2xl transition-all duration-500 h-full min-h-[380px] flex flex-col items-center justify-between">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-neutral-800 z-20">
                    <span className="font-display font-bold text-white text-lg">{step.number}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center w-full mt-6">
                    <div className={`text-4xl mb-4 text-center filter drop-shadow-lg flex justify-center ${iconMap[step.icon]?.className || 'text-primary'}`}>
                      <span className="text-5xl">
                        <FontAwesomeIcon icon={iconMap[step.icon]?.icon || faFileAlt} />
                      </span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-neutral-dark dark:text-neutral-100 mb-3 group-hover:text-primary transition-colors duration-300 text-center leading-normal">
                      {step.title}
                    </h3>
                    <p className="font-body text-neutral-dark/80 dark:text-neutral-300 leading-relaxed text-center text-sm">
                      {step.description}
                    </p>
                  </div>
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
