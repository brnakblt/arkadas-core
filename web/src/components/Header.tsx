"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthModal from "./AuthModal";

const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const isDashboard = pathname === "/dashboard";

  const menuItems = [
    { id: "home", label: "Ana Sayfa" },
    { id: "about", label: "Hakkımızda" },
    { id: "team", label: "Ekibimiz" },
    { id: "services", label: "Hizmetlerimiz" },
    { id: "process", label: "Sürecimiz" },
    { id: "gallery", label: "Galeri" },
    { id: "faq", label: "SSS" },
    { id: "contact", label: "İletişim" },

  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const scrollPosition = window.scrollY + window.innerHeight / 2;
      let currentSection = "";

      for (const item of menuItems) {
        const element = document.getElementById(item.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            currentSection = item.id;
            break;
          }
        }
      }

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Set initial active section

    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuItems]);

  if (isDashboard) return null;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[9999] bg-white transition-all duration-300 rounded-b-[50px] ${isScrolled ? "shadow-lg" : ""
        }`}
      role="banner"
    >
      {/* Logo - Absolutely positioned */}
      <div className="absolute top-0 left-0 h-16 flex items-center pl-4">
        {/* Added responsive padding */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("home");
          }}
          className="flex items-center"
        >
          <div className="relative h-12 lg:h-16 w-auto aspect-[3/1]">
            <Image
              src="/images/logo.svg"
              alt="Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi"
              fill
              className="object-contain"
              priority
            />
          </div>

        </a>
      </div>

      <div className="max-w-7xl mx-auto h-16">
        {/* Added responsive padding */}
        <div className="flex justify-end items-center h-16 pr-4 lg:pr-20">
          {/* Changed justify-between to justify-end */}
          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-4 lg:space-x-8"
            role="navigation"
            aria-label="Ana menü"
          >
            {!isDashboard && menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="relative font-body text-sm font-medium text-neutral-dark hover:text-primary transition-colors duration-200 group"
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 w-full h-0.5 bg-primary transform transition-transform duration-300 ease-out ${activeSection === item.id ? "scale-x-100" : "scale-x-0"
                    }`}
                ></span>
              </button>
            ))}
            {isDashboard ? (
              <button
                onClick={() => router.push("/")}
                className="ml-4 px-5 py-2.5 bg-red-500 text-white font-body text-sm font-medium rounded-full hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Çıkış Yap
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="ml-4 px-5 py-2.5 bg-primary text-white font-body text-sm font-medium rounded-full hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Giriş Yap
              </button>
            )}
          </nav>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-dark hover:text-primary transition-colors duration-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!isDashboard && menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-3 py-2 font-body text-base font-medium transition-colors duration-200 ${activeSection === item.id
                    ? "text-primary"
                    : "text-neutral-dark"
                    }`}
                >
                  {item.label}
                </button>
              ))}
              {isDashboard ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/");
                  }}
                  className="block w-full text-center mt-4 px-3 py-3 bg-red-500 text-white font-body text-base font-medium rounded-xl hover:bg-red-600 transition-colors duration-200"
                >
                  Çıkış Yap
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="block w-full text-center mt-4 px-3 py-3 bg-primary text-white font-body text-base font-medium rounded-xl hover:bg-primary/90 transition-colors duration-200"
                >
                  Giriş Yap
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
};

export default Header;