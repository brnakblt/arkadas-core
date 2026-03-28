"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCookieBite, faTimes } from "@fortawesome/free-solid-svg-icons";
import { usePolicyModal } from "@/context/PolicyModalContext";
import { useCookie } from "@/context/CookieContext";

const CookieConsent: React.FC = () => {
    const policyContext = usePolicyModal();
    const cookieContext = useCookie();
    
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (cookieContext?.consentStatus === 'pending') {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [cookieContext?.consentStatus]);

    if (!isVisible || !policyContext || !cookieContext) return null;

    const { openPolicyModal } = policyContext;
    const { acceptAll, rejectAll } = cookieContext;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-full px-4">
            <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md border border-gray-200 dark:border-neutral-700 shadow-2xl rounded-2xl p-4 flex flex-col gap-4 animate-slide-up relative">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    aria-label="Kapat"
                >
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3">
                    <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg text-primary dark:text-primary-light shrink-0">
                        <FontAwesomeIcon icon={faCookieBite} className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-dark dark:text-white text-sm mb-1">Çerez Politikası</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            Deneyiminizi iyileştirmek için çerezleri kullanıyoruz.
                            Detaylar için{" "}
                            <button onClick={() => openPolicyModal('cookie')} className="text-primary dark:text-primary-light hover:underline font-medium">
                                Politikamızı
                            </button>{" "}
                            inceleyin.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full">
                    <button
                        onClick={() => openPolicyModal('cookie')}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all border border-gray-200 dark:border-neutral-600"
                    >
                        Ayarlar
                    </button>
                    <button
                        onClick={rejectAll}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all border border-gray-200 dark:border-neutral-600"
                    >
                        Reddet
                    </button>
                    <button
                        onClick={acceptAll}
                        className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        Kabul Et
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
