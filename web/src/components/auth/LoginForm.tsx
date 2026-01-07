import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../hooks/useAuth";
import { authService, Tenant } from "../../services/authService";

interface LoginFormProps {
    onSuccess: () => void;
    onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
    const { login, isLoading, error, successMessage } = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>();
    const [tenantsLoading, setTenantsLoading] = useState(true);

    useEffect(() => {
        const loadTenants = async () => {
            try {
                const tenantList = await authService.getTenants();
                setTenants(tenantList);
                if (tenantList.length === 1) {
                    setSelectedTenantId(tenantList[0].id);
                }
            } catch (err) {
                console.error("Failed to load tenants:", err);
            } finally {
                setTenantsLoading(false);
            }
        };
        loadTenants();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await login(identifier, password, selectedTenantId);
        if (response) {
            setTimeout(() => {
                onSuccess();
            }, 1500);
        }
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

            {/* Tenant Selection */}
            {tenants.length > 1 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Kurum Seçimi</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faBuilding} className="text-gray-400 dark:text-gray-500 w-4 h-4" />
                        </div>
                        <select
                            value={selectedTenantId || ""}
                            onChange={(e) => setSelectedTenantId(e.target.value ? Number(e.target.value) : undefined)}
                            disabled={tenantsLoading}
                            required
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body text-neutral-dark dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 appearance-none cursor-pointer"
                        >
                            <option value="">Kurum seçiniz...</option>
                            {tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Email/Username */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">E-posta veya Kullanıcı Adı</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400 dark:text-gray-500 w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        name="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="E-posta veya Kullanıcı Adı"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body text-neutral-dark placeholder-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
                    />
                </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Şifre</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faLock} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-neutral-dark placeholder-gray-400 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:bg-neutral-900"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                    Şifremi Unuttum?
                </button>
            </div>

            <button
                type="submit"
                disabled={isLoading || (tenants.length > 1 && !selectedTenantId)}
                className={`w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary/25 ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
            >
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
        </form>
    );
};

export default LoginForm;
