'use client';

import { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import Image from 'next/image';

interface SliderProps {
    children: ReactNode[];
    autoPlay?: boolean;
    autoPlayInterval?: number;
    showDots?: boolean;
    showArrows?: boolean;
    pauseOnHover?: boolean;
    className?: string;
}

/**
 * Modern Responsive Slider Component
 * Features: autoplay, touch gestures, keyboard navigation, responsive
 */
export default function Slider({
    children,
    autoPlay = true,
    autoPlayInterval = 5000,
    showDots = true,
    showArrows = true,
    pauseOnHover = true,
    className = '',
}: SliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const totalSlides = children.length;

    // Minimum swipe distance
    const minSwipeDistance = 50;

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay || isPaused || totalSlides <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalSlides);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [autoPlay, autoPlayInterval, isPaused, totalSlides]);

    // Navigation functions
    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }, [totalSlides]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, [totalSlides]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };

        const slider = sliderRef.current;
        if (slider) {
            slider.addEventListener('keydown', handleKeyDown);
            return () => slider.removeEventListener('keydown', handleKeyDown);
        }
    }, [goToNext, goToPrevious]);

    // Touch handlers for swipe
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) goToNext();
        if (isRightSwipe) goToPrevious();
    };

    if (totalSlides === 0) return null;

    return (
        <div
            ref={sliderRef}
            className={`relative overflow-hidden rounded-2xl ${className}`}
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            tabIndex={0}
            role="region"
            aria-label="Slider"
            aria-live="polite"
        >
            {/* Slides Container */}
            <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {children.map((child, index) => (
                    <div
                        key={index}
                        className="w-full flex-shrink-0"
                        aria-hidden={index !== currentIndex}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {showArrows && totalSlides > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110 backdrop-blur-sm"
                        aria-label="Önceki slayt"
                    >
                        ←
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110 backdrop-blur-sm"
                        aria-label="Sonraki slayt"
                    >
                        →
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {showDots && totalSlides > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {children.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full ${index === currentIndex
                                ? 'w-8 h-3 bg-white shadow-lg'
                                : 'w-3 h-3 bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Slayt ${index + 1}`}
                            aria-current={index === currentIndex ? 'true' : 'false'}
                        />
                    ))}
                </div>
            )}

            {/* Progress Bar (optional) */}
            {autoPlay && totalSlides > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                        className="h-full bg-white transition-all duration-300"
                        style={{
                            width: `${((currentIndex + 1) / totalSlides) * 100}%`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * Hero Slider - Full-width image slider with text overlay
 */
export function HeroSlider({
    slides,
    className = '',
}: {
    slides: { image: string; title: string; subtitle?: string; cta?: { text: string; href: string } }[];
    className?: string;
}) {
    return (
        <Slider className={`aspect-[21/9] ${className}`} autoPlayInterval={6000}>
            {slides.map((slide, index) => (
                <div key={index} className="relative w-full h-full">
                    <Image
                        src={slide.image}
                        unoptimized // Bypass Next.js local image optimization blocking
                        alt={slide.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                        <div className="px-8 md:px-16 max-w-2xl">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                                {slide.title}
                            </h2>
                            {slide.subtitle && (
                                <p className="text-lg md:text-xl text-white/80 mb-6">
                                    {slide.subtitle}
                                </p>
                            )}
                            {slide.cta && (
                                <a
                                    href={slide.cta.href}
                                    className="inline-block px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    {slide.cta.text}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </Slider>
    );
}

/**
 * Card Slider - For testimonials, team members, etc.
 */
export function CardSlider({
    children,
    className = '',
}: {
    children: ReactNode[];
    className?: string;
}) {
    return (
        <Slider
            autoPlay={false}
            showArrows={true}
            showDots={true}
            className={className}
        >
            {children}
        </Slider>
    );
}
