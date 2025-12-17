"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { usePolicyModal } from "@/context/PolicyModalContext";

const Footer: React.FC = () => {
  const { openPolicyModal } = usePolicyModal();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user is near the bottom of the page (within 300px)
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
      setShowBackToTop(isNearBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Get the current scroll position and target position
      const start = window.pageYOffset || document.documentElement.scrollTop;
      const target = element.getBoundingClientRect().top + start;

      // Calculate scroll duration based on distance
      const distance = Math.abs(start - target);
      const scrollDuration = Math.min(2000, Math.max(1500, distance * 1.5));

      // Start scrolling immediately
      element.scrollIntoView({ behavior: "smooth" });

      // Set focus to the element for accessibility
      // Ensure the element is focusable
      if (!element.hasAttribute('tabIndex')) {
        element.setAttribute('tabIndex', '-1');
      }
      element.focus({ preventScroll: true });

      // Wait for scroll to almost complete before starting fade animation
      setTimeout(() => {
        setIsScrolling(true);

        // Keep the button hidden for fade animation duration
        setTimeout(() => {
          setIsScrolling(false);
        }, 800); // Match the fade-out animation duration
      }, scrollDuration - 200); // Start fade slightly before scroll ends
    }
  };

  return (
    <footer
      className="bg-neutral-dark text-white relative overflow-hidden"
      role="contentinfo"
    >
      {/* Decorative Top Wave */}
      <div className="absolute top-0 left-0 w-full">
        <svg
          className="w-full h-12"
          viewBox="0 0 1000 100"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0C200 50 400 0 600 30C800 60 1000 20 1000 0V100H0V0Z"
            fill="currentColor"
            className="text-neutral-dark"
          />
        </svg>
      </div>

      <div className="py-4 pb-24 md:pb-4 relative z-10">
        <div className="max-w-1xl mx-auto px-2 sm:px-2 lg:px-2">
          {/* Bottom Bar */}
          <div className="">
            <div className="flex flex-col md:flex-row rounded-2xl justify-between items-center space-y-4 md:space-y-0">
              <div className="font-body text-white/60 text-sm">
                © 2025 Arkadaş Özel Eğitim
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-neutral-light/60">
                <Link href="/kvkk-ve-aydinlatma-metni" className="hover:text-white transition-colors">
                  KVKK ve Aydınlatma Metni
                </Link>
                <Link href="/cerez-politikasi" className="hover:text-white transition-colors">
                  Çerez Politikası
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-[10000]">
        {/* WhatsApp Button */}
        <a
          href="https://wa.me/905068103321"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#20bd5a] transition-all duration-300 transform hover:scale-110 ${!showBackToTop ? "mb-0" : "mb-4"
            }`}
          aria-label="WhatsApp ile iletişime geç"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>

        {/* Back to Top Button */}
        {showBackToTop && !isScrolling && (
          <button
            onClick={() => scrollToSection("home")}
            className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-all duration-300 transform hover:scale-110 opacity-100 animate-fade-in"
            aria-label="Başa dön"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;