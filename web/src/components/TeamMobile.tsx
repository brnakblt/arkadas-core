'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { TeamMember } from './Team';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

interface TeamMobileProps {
    members: TeamMember[];
    TeamMemberCard: React.ComponentType<{ member: TeamMember }>;
}

const TeamMobile: React.FC<TeamMobileProps> = ({ members, TeamMemberCard }) => {
    return (
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
            {members.map((member) => (
                <SwiperSlide key={member.id} className="h-auto">
                    <TeamMemberCard member={member} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export default TeamMobile;
