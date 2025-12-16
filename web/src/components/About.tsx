"use client";

import React from "react";

const About: React.FC = () => {
  return (
    <section
      id="about"
      tabIndex={-1}
      className="py-20 bg-neutral-light relative overflow-hidden focus:outline-none"
      aria-labelledby="about-heading"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-accent/20 rounded-full -translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full translate-x-48 translate-y-48"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <h2
              id="about-heading"
              className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-neutral-dark mb-6 leading-normal pb-2"
            >
              <span className="text-gradient block leading-tight pb-2">Arkadaş Özel Eğitim</span>
              <span className="text block whitespace-nowrap">ve Rehabilitasyon Merkezi</span>
            </h2>

            <p className="font-body text-lg text-neutral-dark/80 mb-6 leading-relaxed">
              2009 yılından bu yana özel eğitim alanında hizmet veren
              merkezimiz, özel gereksinimli çocukların eğitim ve rehabilitasyon
              süreçlerinde ailelerin yanında olmaktadır. Uzman kadromuz ve
              bireysel yaklaşımımızla her çocuğun potansiyelini ortaya çıkarmayı
              hedefliyoruz.
            </p>

            <p className="font-body text-lg text-neutral-dark/80 mb-8 leading-relaxed">
              Bilimsel temelli eğitim yöntemleri, güncel rehabilitasyon
              teknikleri ve aile odaklı yaklaşımımızla çocukların sosyal,
              akademik ve günlük yaşam becerilerini geliştirmelerine destek
              oluyoruz.
            </p>

            {/* Key Points */}
            <div className="space-y-4">
              {[
                "Bireysel Eğitim Programları (BEP) ile kişiye özel yaklaşım",
                "Uzman psikolog, özel eğitim öğretmeni ve fizyoterapist kadrosu",
                "Aile eğitimi ve danışmanlık hizmetleri",
              ].map((point, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="font-body text-neutral-dark/80">{point}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const servicesSection = document.getElementById("services");
                  if (servicesSection) {
                    servicesSection.scrollIntoView({ behavior: "smooth" });
                    servicesSection.focus({ preventScroll: true });
                  }
                }}
                className="bg-primary text-white px-8 py-4 rounded-full font-body font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
              >
                Hizmetlerimizi Keşfedin
              </button>
              <button
                onClick={() => {
                  const teamSection = document.getElementById("team");
                  if (teamSection) {
                    teamSection.scrollIntoView({ behavior: "smooth" });
                    teamSection.focus({ preventScroll: true });
                  }
                }}
                className="bg-secondary text-white px-8 py-4 rounded-full font-body font-semibold hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105"
              >
                Ekibimizle Tanışın
              </button>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="relative bg-white rounded-3xl p-8 card-shadow">
              {/* Mission Statement */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-neutral-dark mb-4 leading-normal pb-1">
                  Misyonumuz
                </h3>
                <p className="font-body text-neutral-dark/80 leading-relaxed">
                  Her çocuğun eşsiz potansiyelini keşfetmesi, bağımsızlık
                  becerilerini geliştirmesi ve toplumsal yaşama aktif katılımını
                  sağlamak için kaliteli özel eğitim ve rehabilitasyon
                  hizmetleri sunmak.
                </p>
              </div>

              {/* Values */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
                {[
                  { icon: "❤️", label: "Sevgi" },
                  { icon: "🎯", label: "Hedef" },
                  { icon: "🤝", label: "İşbirliği" },
                ].map((value, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl mb-2">{value.icon}</div>
                    <div className="font-body text-sm font-medium text-neutral-dark">
                      {value.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;