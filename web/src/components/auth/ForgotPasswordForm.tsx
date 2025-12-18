import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../hooks/useAuth";

interface ForgotPasswordFormProps {
    onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
    const { forgotPassword, isLoading, error, successMessage } = useAuth();
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await forgotPassword(email);
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Error/Success Messages */}
            {error && (
                <div className="p-3 bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-300 text-sm rounded-lg">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300 text-sm rounded-lg">
                    {successMessage}
                </div>
            )}

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 dark:text-gray-500 w-4 h-4" />
                </div>
                <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta Adresi"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body text-neutral-dark placeholder-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
            </div>

            <div className="flex justify-start">
                <button
                    type="button"
                    onClick={onBackToLogin}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 mr-2" />
                    Giriş Ekranına Dön
                </button>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary/25 ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
            >
                {isLoading ? "İşlem Yapılıyor..." : "Şifre Sıfırla"}
            </button>
        </form>
    );
};

export default ForgotPasswordForm;
