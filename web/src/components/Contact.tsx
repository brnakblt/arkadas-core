"use client";

import * as React from "react";
import ContactForm from "./contact/ContactForm";
import ContactInfo from "./contact/ContactInfo";

const Contact: React.FC = () => {
  return (
    <section
      id="contact"
      tabIndex={-1}
      className="py-20 bg-neutral-light dark:bg-surface relative overflow-hidden focus:outline-none"
    >
      {/* Background Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-5"
        viewBox="0 0 1000 1000"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 250C200 100 400 700 600 400C800 100 1000 700 1000 400V1000H0V250Z"
          fill="currentColor"
          className="text-primary"
        />
      </svg>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">

          <h2
            id="contact-heading"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-dark dark:text-neutral-100 mt-4 mb-6 leading-normal pb-2"
          >
            Bizimle İletişime
            <span className="text-gradient block leading-tight pb-2">Geçin</span>
          </h2>
          <p className="font-body text-lg text-neutral-dark/80 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Çocuğunuzun eğitim yolculuğuna başlamak için bugün bizimle iletişime
            geçin. Uzman ekibimiz size yardımcı olmak için burada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <ContactForm />

          {/* Contact Information & Social Media */}
          <ContactInfo />
        </div>
      </div>
    </section>
  );
};

export default Contact;