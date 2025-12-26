"use client";

import React, { useState } from "react";
import { useContactForm } from "../../hooks/useContactForm";

const ContactForm: React.FC = () => {
    const {
        formData,
        errors,
        touched,
        kvkkApproved,
        setKvkkApproved,
        kvkkError,
        setKvkkError,
        isSubmitting,
        handleChange,
        handleBlur,
        submitForm,
    } = useContactForm();

    const [isKvkkOpen, setIsKvkkOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const success = await submitForm();
            if (success) {
                alert("Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.");
            }
        } catch {
            alert("Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
        }
    };

    const handleKvkkHeaderClick = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        if (target.id === "kvkk") return;
        if (target.closest('label[for="kvkk"]')) e.preventDefault();
        setIsKvkkOpen((prev) => !prev);
    };

    return (
        <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md rounded-3xl px-8 pt-8 pb-0 card-shadow border border-gray-200 dark:border-neutral-700 transition-all duration-300 ease-in-out">
            <h3 className="font-display text-2xl font-bold text-neutral-dark dark:text-white mb-6 leading-normal pb-1">
                Bize Mesaj Gönderin
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label
                            htmlFor="name"
                            className="block font-body font-medium text-neutral-dark dark:text-gray-200 mb-2"
                        >
                            Ad Soyad
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            autoComplete="name"
                            aria-required="true"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary transition-all duration-200 font-body text-neutral-dark bg-white ${touched.name && errors.name
                                ? "border-red-500 focus:border-red-500"
                                : "border-gray-300 focus:border-transparent"
                                }`}
                            placeholder="Adınız ve soyadınız"
                        />
                        {touched.name && errors.name && (
                            <p className="mt-1 text-red-500 text-sm">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block font-body font-medium text-neutral-dark dark:text-gray-200 mb-2"
                        >
                            E-posta Adresi
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            autoComplete="email"
                            aria-required="true"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary transition-all duration-200 font-body text-neutral-dark bg-white ${touched.email && errors.email
                                ? "border-red-500 focus:border-red-500"
                                : "border-gray-300 focus:border-transparent"
                                }`}
                            placeholder="ornek@email.com"
                        />
                        {touched.email && errors.email && (
                            <p className="mt-1 text-red-500 text-sm">{errors.email}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="phone"
                        className="block font-body font-medium text-neutral-dark dark:text-gray-200 mb-2"
                    >
                        Telefon Numarası
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        aria-required="true"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary transition-all duration-200 font-body text-neutral-dark bg-white ${touched.phone && errors.phone
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-transparent"
                            }`}
                        placeholder="+90 555 123 45 67"
                    />
                    {touched.phone && errors.phone && (
                        <p className="mt-1 text-red-500 text-sm">{errors.phone}</p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="address"
                        className="block font-body font-medium text-neutral-dark dark:text-gray-200 mb-2"
                    >
                        Adres
                    </label>
                    <textarea
                        id="address"
                        name="address"
                        autoComplete="street-address"
                        aria-required="true"
                        rows={1}
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        style={{ minHeight: "42px", overflowY: "hidden" }}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary transition-all duration-200 font-body text-neutral-dark bg-white ${touched.address && errors.address
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-transparent"
                            }`}
                        placeholder="Sokak, Mahalle, Bina ve Daire No, İlçe / İzmir"
                    />
                    {touched.address && errors.address && (
                        <p className="mt-1 text-red-500 text-sm">{errors.address}</p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="message"
                        className="block font-body font-medium text-neutral-dark dark:text-gray-200 mb-2"
                    >
                        Mesajınız
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        autoComplete="off"
                        aria-required="true"
                        rows={2}
                        value={formData.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        style={{ minHeight: "84px", overflowY: "hidden" }}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary transition-all duration-200 font-body text-neutral-dark bg-white ${touched.message && errors.message
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-transparent"
                            }`}
                        placeholder="Bize çocuğunuzun ve sizin ihtiyaçlarınızı kısaca anlatmak ister misiniz? Böylece size en iyi şekilde destek olabiliriz 💚"
                    />
                    {touched.message && errors.message && (
                        <p className="mt-1 text-red-500 text-sm">{errors.message}</p>
                    )}
                </div>

                <div className="space-y-4">
                    {/* KVKK Section with Accordion */}
                    <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl overflow-hidden">
                        <div
                            onClick={handleKvkkHeaderClick}
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600/50 transition-colors duration-200"
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex items-center h-5 mt-1">
                                    <input
                                        id="kvkk"
                                        name="kvkk"
                                        type="checkbox"
                                        checked={kvkkApproved}
                                        onChange={(e) => {
                                            setKvkkApproved(e.target.checked);
                                            if (e.target.checked) {
                                                setKvkkError("");
                                                setIsKvkkOpen(true);
                                            } else {
                                                setIsKvkkOpen(false);
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>
                                <div className="flex-initial">
                                    <label
                                        htmlFor="kvkk"
                                        className="font-body text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        Kişisel verilerimin işlenmesi hakkında bilgilendirmeyi
                                        okudum ve onaylıyorum.
                                    </label>
                                </div>
                            </div>
                            <svg
                                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isKvkkOpen ? "rotate-180" : ""
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </div>

                        {/* Collapsible Content */}
                        <div
                            className={`transition-all duration-300 ease-in-out ${isKvkkOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                } overflow-hidden`}
                        >
                            <div className="p-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-200 dark:border-neutral-600">
                                <p className="mb-2">İlgili kanun ve yönetmelikler:</p>
                                <ul className="list-disc pl-5 space-y-2 mb-2">
                                    <li>
                                        <a
                                            href="https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6698&MevzuatTur=1&MevzuatTertip=5"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            KVKK
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=24038&MevzuatTur=7&MevzuatTertip=5"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Veri İşleme Yönetmeliği
                                        </a>
                                    </li>
                                </ul>
                                <p>
                                    Kişisel verileriniz hizmet sunumu ve yasal yükümlülükler
                                    kapsamında işlenmekte olup, üçüncü şahıslarla
                                    paylaşılmamaktadır.
                                </p>
                            </div>
                        </div>
                    </div>
                    {kvkkError && (
                        <p className="text-red-500 text-sm">{kvkkError}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-primary text-white py-4 rounded-xl font-body font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                >
                    {isSubmitting ? "Gönderiliyor..." : "Mesaj Gönder"}
                </button>
            </form>
        </div>
    );
};

export default ContactForm;
