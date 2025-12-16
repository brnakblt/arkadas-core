"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

interface TeamMember {
  id: number;
  name: string;
  title: string;
  category: string[]; // JSON field returns array directly
  image: {
    url: string;
    alternativeText?: string;
  } | null;
  specialization: string;
  description: string;
  objectPosition?: string;
  order: number;
  link?: string;
}

const Team: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const STRAPI_URL = "http://127.0.0.1:1337"; // Strapi sunucunuzun adresi

  const fetchTeamMembers = useCallback(async () => {
    const defaultCategories = [
      "Yönetim",
      "Eğitim Danışmanı",
      "Psikolog",
      "Dil ve Konuşma Terapisti",
      "Öğretmen",
      "Fizyoterapist",
    ];
    try {
      setLoading(true);
      const response = await fetch(
        `${STRAPI_URL}/api/team-members?populate=image&sort[0]=order:asc`
      );
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("HTTP error! status:", response.status, "body:", errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Strapi v5 returns flattened data in data.data
      const formattedMembers: TeamMember[] = data.data.map((member: any) => {
        // category is a JSON field. We need to normalize it to string[].
        let category: string[] = [];
        const rawCat = member.category;

        if (Array.isArray(rawCat)) {
          category = rawCat.map((c: any) => typeof c === 'string' ? c : c?.role || JSON.stringify(c));
        } else if (typeof rawCat === 'string') {
          category = [rawCat];
        } else if (typeof rawCat === 'object' && rawCat !== null) {
          if (rawCat.role) category = [rawCat.role];
          else category = [];
        }

        return {
          ...member,
          category: category,
        };
      }).sort((a: TeamMember, b: TeamMember) => (a.order || 0) - (b.order || 0));


      setTeamMembers(formattedMembers);

      const uniqueCategories = [
        ...new Set(
          formattedMembers.flatMap((member) => member.category)
        ),
      ];
      // Remove "Tümü" and ensure categories are unique and valid, excluding English roles
      const excludedCategories = ["Specialist", "Coordinator", "Psychologist"];
      setCategories(
        [...defaultCategories, ...uniqueCategories].filter(
          (value, index, self) =>
            self.indexOf(value) === index &&
            value &&
            !excludedCategories.includes(value)
        )
      );
    } catch (err) {
      console.error("Failed to fetch team members:", err);
      setError("Ekip üyeleri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [STRAPI_URL]);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const filteredMembers = useMemo(() => {
    if (!activeCategory) {
      return teamMembers.slice(0, 8);
    }
    return teamMembers.filter(
      (member) =>
        member.category &&
        member.category.includes(activeCategory)
    );
  }, [activeCategory, teamMembers]);

  if (loading) {
    return (
      <section id="team" tabIndex={-1} className="py-20 bg-gray-50 text-center focus:outline-none">
        <p className="font-body text-lg text-neutral-dark/80">Yükleniyor...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section id="team" tabIndex={-1} className="py-20 bg-gray-50 text-center text-red-600 focus:outline-none">
        <p className="font-body text-lg">{error}</p>
      </section>
    );
  }

  const TeamMemberCard = ({ member }: { member: TeamMember }) => {
    const cardClasses = "group relative overflow-hidden bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col mx-auto w-full max-w-sm md:max-w-none";
    const CardContent = (
      <>
        <div className="relative z-20 h-full flex flex-col">
          <div className="w-48 h-48 mx-auto mb-4 rounded-2xl overflow-hidden relative flex-shrink-0">
            <Image
              unoptimized
              src={
                member.image?.url
                  ? `${STRAPI_URL}${member.image.url}`
                  : "/images/placeholder.webp"
              }
              alt={
                member.image?.alternativeText || member.name
              }
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-2xl"
              style={{
                objectPosition:
                  member.objectPosition || "center",
              }}
            />
          </div>

          <div className="text-center px-2 pb-2 flex-shrink-0">
            <h3 className="font-display text-lg font-bold text-neutral-dark mb-1 leading-normal pb-1">
              {member.name}
            </h3>

            <p className="text-primary font-body font-medium text-sm mb-3">
              {member.title}
            </p>
          </div>
        </div>

        {/* Gradient Hover Effect - Starts from the card bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-t from-secondary/60 via-secondary/20 to-secondary/0 transform translate-y-full transition-transform duration-500 ease-in-out group-hover:translate-y-0 z-10 pointer-events-none"></div>
      </>
    );

    return member.link ? (
      <Link
        key={member.id}
        href={member.link}
        className={`${cardClasses} cursor-pointer`}
      >
        {CardContent}
      </Link>
    ) : (
      <div
        key={member.id}
        className={cardClasses}
      >
        {CardContent}
      </div>
    );
  };

  return (
    <section id="team" tabIndex={-1} className="py-20 bg-gray-50 focus:outline-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-dark mt-4 mb-6 leading-normal pb-2">
            <span className="text-gradient inline-block leading-tight pb-2 mr-2">Uzman</span>
            <span className="inline-block leading-tight pb-2">Kadromuz</span>
          </h2>
          <p className="font-body text-lg text-neutral-dark/80 max-w-3xl mx-auto leading-relaxed">
            Alanında uzman ve deneyimli ekibimizle öğrencilerimize en iyi
            eğitimi sunuyoruz.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <Swiper
            slidesPerView="auto"
            spaceBetween={16}
            freeMode={true}
            modules={[FreeMode]}
            className="!py-4"
          >
            {categories.map((category) => (
              <SwiperSlide key={category} className="!w-auto">
                <button
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-3 rounded-full font-body font-medium transition-all duration-300 whitespace-nowrap ${activeCategory === category
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-gray-100 text-neutral-dark hover:bg-gray-200"
                    }`}
                >
                  {category}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Mobile View - Swiper */}
        <div className="block md:hidden">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1.2}
            centeredSlides={true}
            loop={filteredMembers.length > 4}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true
            }}
            className="!pb-16"
          >
            {filteredMembers.map((member) => (
              <SwiperSlide key={member.id} className="h-auto">
                <TeamMemberCard member={member} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop View - Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
