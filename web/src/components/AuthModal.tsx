"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import LoginForm from "./auth/LoginForm";
import ForgotPasswordForm from "./auth/ForgotPasswordForm";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthView = 'login' | 'forgot-password';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const [view, setView] = useState<AuthView>('login');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
            // Reset view to login on open
            setView('login');
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = "unset";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleLoginSuccess = () => {
        onClose();
        router.push("/dashboard");
    };

    if (!isVisible && !isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
        >
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`relative bg-white dark:bg-surface rounded-3xl w-full max-w-md p-8 shadow-2xl transform transition-all duration-300 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="font-display text-2xl font-bold text-neutral-dark dark:text-neutral-100 mb-2 leading-normal pb-1">
                        {view === 'login' && "Hoş Geldiniz"}
                        {view === 'forgot-password' && "Şifre Sıfırlama"}
                    </h2>
                    <p className="font-body text-gray-500 dark:text-gray-400 text-sm">
                        {view === 'login' && "Hesabınıza giriş yaparak devam edin"}
                        {view === 'forgot-password' && "E-posta adresinizi girerek şifrenizi sıfırlayın"}
                    </p>
                </div>

                {/* Forms */}
                {view === 'login' && (
                    <LoginForm
                        onSuccess={handleLoginSuccess}
                        onForgotPassword={() => setView('forgot-password')}
                    />
                )}

                {view === 'forgot-password' && (
                    <ForgotPasswordForm
                        onBackToLogin={() => setView('login')}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthModal;

