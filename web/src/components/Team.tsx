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
          category = rawCat.map((c: any) => {
            if (typeof c === 'string') return c.replace(/^["']|["']$/g, '').trim();
            if (c?.role) return c.role.replace(/^["']|["']$/g, '').trim();
            if (c?.name) return c.name.replace(/^["']|["']$/g, '').trim();
            return '';
          }).filter(Boolean);
        } else if (typeof rawCat === 'string') {
          // Handle JSON string that might contain array
          try {
            const parsed = JSON.parse(rawCat);
            if (Array.isArray(parsed)) {
              category = parsed.map((c: any) => typeof c === 'string' ? c : c?.role || c?.name || '').filter(Boolean);
            } else {
              category = [rawCat.replace(/^["']|["']$/g, '').trim()];
            }
          } catch {
            category = [rawCat.replace(/^["']|["']$/g, '').trim()];
          }
        } else if (typeof rawCat === 'object' && rawCat !== null) {
          if (rawCat.role) category = [rawCat.role];
          else if (rawCat.name) category = [rawCat.name];
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
      // Remove "Tümü" and ensure categories are unique and valid, excluding English roles and quoted duplicates
      const excludedCategories = ["Specialist", "Coordinator", "Psychologist"];
      setCategories(
        [...defaultCategories, ...uniqueCategories].filter(
          (value, index, self) => {
            // Skip if empty, excluded, or contains quotes
            if (!value || excludedCategories.includes(value) || value.includes('"')) return false;
            // Check for duplicates (case-insensitive)
            return self.findIndex(v => v.toLowerCase() === value.toLowerCase()) === index;
          }
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
    // Case-insensitive category matching
    const activeLower = activeCategory.toLowerCase();
    return teamMembers.filter(
      (member) =>
        member.category &&
        member.category.some(cat => cat.toLowerCase() === activeLower)
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
    const cardClasses = "group relative overflow-hidden bg-white rounded-2xl p-3 md:p-4 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col mx-auto w-full max-w-[280px] md:max-w-sm";
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
        href={member.link}
        className={`${cardClasses} cursor-pointer`}
      >
        {CardContent}
      </Link>
    ) : (
      <div
        className={cardClasses}
      >
        {CardContent}
      </div>
    );
  };

  return (
    <section id="team" tabIndex={-1} className="flex flex-col md:min-h-screen md:justify-center py-8 md:py-32 bg-gray-50 focus:outline-none relative overflow-x-clip">
      <div className="w-full max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        {/* Desktop: Flex wrap centered */}
        <div className="mb-12 hidden md:flex flex-wrap justify-center gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full font-body font-medium transition-all duration-300 whitespace-nowrap ${activeCategory === category
                ? "bg-primary text-white shadow-lg scale-105"
                : "bg-gray-100 text-neutral-dark hover:bg-gray-200"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Mobile: Swiper horizontal scroll */}
        <div className="mb-12 md:hidden overflow-visible">
          <Swiper
            slidesPerView="auto"
            spaceBetween={12}
            freeMode={true}
            modules={[FreeMode]}
            className="!py-6 !overflow-visible"
          >
            {categories.map((category) => (
              <SwiperSlide key={category} className="!w-auto">
                <button
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2.5 rounded-full font-body font-medium text-sm transition-all duration-300 whitespace-nowrap ${activeCategory === category
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
            slidesPerView={1}
            loop={true}
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

        {/* Desktop View - Grid/Flex */}
        <div className="hidden md:flex md:flex-wrap md:justify-center gap-6">
          {filteredMembers.map((member) => (
            <div key={member.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-sm">
              <TeamMemberCard member={member} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;

