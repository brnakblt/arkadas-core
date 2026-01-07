'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';

interface TeamCategorySwiperProps {
    categories: string[];
    activeCategory: string | null;
    setActiveCategory: (category: string) => void;
}

const TeamCategorySwiper: React.FC<TeamCategorySwiperProps> = ({
    categories,
    activeCategory,
    setActiveCategory,
}) => {
    return (
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
                            : "bg-gray-100 text-neutral-dark hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                            }`}
                    >
                        {category}
                    </button>
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export default TeamCategorySwiper;
