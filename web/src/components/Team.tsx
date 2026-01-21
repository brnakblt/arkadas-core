"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from 'next/dynamic';
import BezierBackground from "./BezierBackground";

// Dynamic imports for Swiper components to reduce TBT
const TeamMobile = dynamic(() => import('./TeamMobile'), { ssr: false });
const TeamCategorySwiper = dynamic(() => import('./TeamCategorySwiper'), { ssr: false });

export interface TeamMember {
  id: number;
  name: string;
  title: string;
  category: string[];
  image: {
    url: string;
    alternativeText?: string;
  } | null;
  link?: string;
  objectPosition?: string;
}

const Team: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      // Removed populate=image since avatarUrl is a simple string field in Personnel
      const response = await fetch(
        `${STRAPI_URL}/api/personnels?sort[0]=title:asc`
      );
      if (!response.ok) {
        // If 404/500, we'll just show empty state or error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Map Personnel (Article 7) to TeamMember UI
      const formattedMembers: TeamMember[] = data.data.map((p: any) => {

        // Map Enum Title to UI Category
        let category = "Diğer";
        const t = p.title || "";
        if (t.includes("MUDUR")) category = "Yönetim";
        else if (t.includes("PSIKOLOG")) category = "Psikolog";
        else if (t.includes("FIZYOTERAPIST")) category = "Fizyoterapist";
        else if (t.includes("ODYOLOG") || t.includes("IL")) category = "Terapist"; // Dil/Odyo
        else if (t.includes("OGRETMEN")) category = "Öğretmen";
        else if (t.includes("SOSYAL")) category = "Sosyal Hizmet";

        return {
          id: p.id,
          name: p.fullName || "İsimsiz",
          title: p.specialty || p.title || "Personel", // Show Specialty (e.g. 'Uzman Öğretici') or fallback to Title enum
          category: [category],
          image: p.avatarUrl ? { url: p.avatarUrl, alternativeText: p.fullName } : null,
          link: null
        };
      });

      setTeamMembers(formattedMembers);

      // Extract unique categories from loaded data
      const uniqueCats = Array.from(new Set(formattedMembers.flatMap(m => m.category)));
      // Ensure 'Yönetim' is first if exists
      if (uniqueCats.includes("Yönetim")) {
        uniqueCats.sort((a, b) => a === "Yönetim" ? -1 : b === "Yönetim" ? 1 : 0);
      }
      setCategories(uniqueCats);

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
      // Default: Show all or maybe limit? Let's show all for now.
      return teamMembers;
    }
    return teamMembers.filter((m) => m.category.includes(activeCategory));
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
    const cardClasses = "group relative overflow-hidden bg-white dark:bg-neutral-800 rounded-2xl p-3 md:p-4 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col mx-auto w-full max-w-[280px] md:max-w-sm";
    const CardContent = (
      <>
        <div className="relative z-20 h-full flex flex-col">
          <div className="w-48 h-48 mx-auto mb-4 rounded-2xl overflow-hidden relative flex-shrink-0">
            <Image
              unoptimized
              src={
                member.image?.url
                  ? `${STRAPI_URL}${member.image.url}`
                  : "/images/decor_hands.webp" // Fallback to decor if placeholder missing
              }
              alt={member.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-2xl"
              style={{
                objectPosition: member.objectPosition || "center",
              }}
            />
          </div>

          <div className="text-center px-2 pb-2 flex-shrink-0">
            <h3 className="font-display text-lg font-bold text-neutral-dark dark:text-white mb-1 leading-normal pb-1">
              {member.name}
            </h3>

            <p className="text-primary dark:text-primary-light font-body font-medium text-sm mb-3 capitalize">
              {member.title}
            </p>
          </div>
        </div>

        {/* Gradient Hover Effect */}
        <div className="absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-t from-secondary/60 via-secondary/20 to-secondary/0 transform translate-y-full transition-transform duration-500 ease-in-out group-hover:translate-y-0 z-10 pointer-events-none"></div>
      </>
    );

    return member.link ? (
      <Link href={member.link} className={`${cardClasses} cursor-pointer`}>
        {CardContent}
      </Link>
    ) : (
      <div className={cardClasses}>
        {CardContent}
      </div>
    );
  };

  return (
    <section id="team" tabIndex={-1} className="flex flex-col md:min-h-screen md:justify-center py-8 md:py-32 bg-neutral-light dark:bg-surface focus:outline-none relative overflow-x-clip">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>
        <BezierBackground className="h-full w-full opacity-40" />
      </div>
      <div className="w-full max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-dark dark:text-neutral-100 mt-4 mb-6 leading-normal pb-2">
            <span className="text-gradient inline-block leading-tight pb-2 mr-2">Uzman</span>
            <span className="inline-block leading-tight pb-2">Kadromuz</span>
          </h2>
          <p className="font-body text-lg text-neutral-dark/80 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Alanında uzman ve deneyimli ekibimizle öğrencilerimize en iyi eğitimi sunuyoruz.
          </p>
        </div>

        <div className="mb-12 hidden md:flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-6 py-3 rounded-full font-body font-medium transition-all duration-300 whitespace-nowrap ${activeCategory === null
              ? "bg-primary text-white shadow-lg scale-105"
              : "bg-gray-100 text-neutral-dark hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              }`}
          >
            Tümü
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full font-body font-medium transition-all duration-300 whitespace-nowrap ${activeCategory === category
                ? "bg-primary text-white shadow-lg scale-105"
                : "bg-gray-100 text-neutral-dark hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mb-12 md:hidden overflow-visible">
          <TeamCategorySwiper
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        <div className="block md:hidden">
          <TeamMobile members={filteredMembers} TeamMemberCard={TeamMemberCard} />
        </div>

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

