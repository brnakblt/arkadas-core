"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const isDashboard = pathname === "/dashboard";

  const menuItems = [
    {
      id: "home",
      label: "Ana Sayfa",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: "about",
      label: "Hakkımızda",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: "team",
      label: "Ekibimiz",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: "services",
      label: "Hizmetlerimiz",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: "process",
      label: "Sürecimiz",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: "gallery",
      label: "Galeri",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "faq",
      label: "SSS",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: "contact",
      label: "İletişim",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
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
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] transition-all duration-300 md:hidden ${isMobileMenuOpen ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <header
        className={`fixed top-0 left-0 right-0 z-[9999] bg-white dark:bg-[color:var(--surface)] transition-all duration-300 rounded-b-2xl ${isScrolled ? "shadow-lg" : ""
          }`}
        role="banner"
      >
        {/* Logo - Absolutely positioned on desktop, in-flow on mobile */}
        <div className="hidden md:flex absolute top-0 left-0 h-16 items-center pl-4">
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

        {/* Desktop Auth & Theme Buttons - Absolutely positioned right */}
        <div className="hidden md:flex absolute top-0 right-0 h-16 items-center pr-4 space-x-3">
          <ThemeToggle />

          {isDashboard ? (
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 bg-red-500 text-white font-body text-sm font-medium rounded-3xl hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Çıkış Yap
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <div className="relative h-6 w-6">
                <Image
                  src="/images/favicon.svg"
                  alt="Giriş Yap"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
            </button>
          )}
        </div>

        <div className="max-w-7xl mx-auto h-full">
          {/* Added responsive padding */}
          <div className="flex items-center justify-center h-16 px-4 md:px-0">
            {/* Mobile: Logo on left, hamburger on right. Desktop: Nav centered. */}

            {/* Mobile Logo */}
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("home");
              }}
              className="flex items-center md:hidden mr-auto"
            >
              <div className="relative h-10 w-auto aspect-[3/1]">
                <Image
                  src="/images/logo.svg"
                  alt="Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </a>


            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex flex-1 justify-center items-center space-x-4 lg:space-x-8"
              role="navigation"
              aria-label="Ana menü"
            >
              {!isDashboard && menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="relative font-body text-sm font-medium text-neutral-dark dark:text-neutral-200 hover:text-primary transition-colors duration-200 group"
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 w-full h-0.5 bg-primary transform transition-transform duration-300 ease-out ${activeSection === item.id ? "scale-x-100" : "scale-x-0"
                      }`}
                  ></span>
                </button>
              ))}
            </nav>

            {/* Mobile Menu & Theme Button */}
            <div className="md:hidden flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-neutral-dark dark:text-neutral-200 hover:text-primary transition-colors duration-200"
              >
                <svg
                  className="h-8 w-8"
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
          <div
            className={`md:hidden bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-500 ease-in-out rounded-b-2xl ${isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!isDashboard && menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center w-full text-left px-3 py-2 font-body text-base font-medium transition-colors duration-200 ${activeSection === item.id
                    ? "text-primary bg-primary/5 dark:bg-primary/20 rounded-lg"
                    : "text-neutral-dark dark:text-neutral-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg"
                    }`}
                >
                  <span className={`mr-3 ${activeSection === item.id ? "text-primary" : "text-neutral-400 dark:text-neutral-500 group-hover:text-primary"}`}>
                    {item.icon}
                  </span>
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
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Header;