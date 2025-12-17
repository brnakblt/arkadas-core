import React, { useRef } from "react";
import { ProcessData } from "@/services/contentService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectCoverflow } from "swiper/modules";
import BezierBackground from "./BezierBackground";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

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
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (!data) return null;

  return (
    <section
      id="process"
      className="flex flex-col min-h-screen justify-center py-24 scroll-mt-0 relative overflow-hidden"
      aria-labelledby="process-heading"
    >
      <BezierBackground className="top-[350px] bottom-0 left-0 right-0 z-0 h-auto absolute" />
      <div className="w-full max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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

        <div className="relative pt-8 px-4 sm:px-12">
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
            modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView={'auto'}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: false,
              scale: 0.9,
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
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
                slidesPerView: 'auto',
                coverflowEffect: {
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  modifier: 2.5,
                  slideShadows: false,
                  scale: 0.95,
                }
              },
              1024: {
                slidesPerView: 'auto',
                coverflowEffect: {
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  modifier: 2.5,
                  slideShadows: false,
                  scale: 1,
                }
              },
            }}
            className="!pb-16 px-0 !overflow-visible"
          >
            {data.map((step, index) => (
              <SwiperSlide key={index} className="h-auto w-[260px] sm:w-[280px] md:!w-[320px] md:!max-w-[320px] transition-all duration-300">
                {({ isActive }) => (
                  <div className={`group relative bg-white rounded-3xl p-6 mt-8 card-shadow hover:shadow-2xl transition-all duration-500 h-full min-h-[380px] flex flex-col items-center justify-between ${isActive ? 'scale-100 ring-4 ring-primary/20' : 'scale-90 opacity-80'}`}>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-xl border-4 border-white z-20">
                      <span className="font-display font-bold text-white text-lg">
                        {step.number}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center w-full mt-6">
                      <div className="text-4xl mb-4 text-center filter drop-shadow-lg flex justify-center">
                        <span className="text-5xl">{iconMap[step.icon] || step.icon || "📄"}</span>
                      </div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-neutral-dark mb-3 group-hover:text-primary transition-colors duration-300 text-center leading-normal">
                        {step.title}
                      </h3>
                      <p className="font-body text-neutral-dark/80 leading-relaxed text-center text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Process;
