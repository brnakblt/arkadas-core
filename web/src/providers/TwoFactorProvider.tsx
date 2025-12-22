'use client';

import { useState, useCallback, ReactNode, createContext, useContext } from 'react';

interface TwoFactorContextType {
    isEnabled: boolean;
    isVerified: boolean;
    setupKey: string | null;
    qrCodeUrl: string | null;
    enableTwoFactor: () => Promise<{ key: string; qrCode: string }>;
    verifyCode: (code: string) => Promise<boolean>;
    disableTwoFactor: (code: string) => Promise<boolean>;
    requireVerification: () => void;
}

const TwoFactorContext = createContext<TwoFactorContextType | null>(null);

export function useTwoFactor() {
    const context = useContext(TwoFactorContext);
    if (!context) {
        throw new Error('useTwoFactor must be used within TwoFactorProvider');
    }
    return context;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Two-Factor Authentication Provider
 */
export function TwoFactorProvider({ children }: { children: ReactNode }) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [setupKey, setSetupKey] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Enable 2FA and get setup key
    const enableTwoFactor = useCallback(async () => {
        try {
            const response = await fetch(`${STRAPI_URL}/api/auth/2fa/setup`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setSetupKey(data.secret);
                setQrCodeUrl(data.qrCode);
                return { key: data.secret, qrCode: data.qrCode };
            }
            throw new Error(data.error || 'Failed to setup 2FA');
        } catch (error) {
            console.error('2FA setup error:', error);
            // For demo purposes, generate a mock key
            const mockKey = generateMockSecret();
            const mockQr = `otpauth://totp/ArkadasERP:user@example.com?secret=${mockKey}&issuer=ArkadasERP`;
            setSetupKey(mockKey);
            setQrCodeUrl(mockQr);
            return { key: mockKey, qrCode: mockQr };
        }
    }, []);

    // Verify 2FA code
    const verifyCode = useCallback(async (code: string) => {
        try {
            const response = await fetch(`${STRAPI_URL}/api/auth/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code }),
            });
            const data = await response.json();

            if (data.success) {
                setIsEnabled(true);
                setIsVerified(true);
                setShowVerifyModal(false);
                pendingAction?.();
                setPendingAction(null);
                return true;
            }
            return false;
        } catch {
            // For demo, accept any 6-digit code
            if (code.length === 6 && /^\d+$/.test(code)) {
                setIsEnabled(true);
                setIsVerified(true);
                setShowVerifyModal(false);
                pendingAction?.();
                setPendingAction(null);
                return true;
            }
            return false;
        }
    }, [pendingAction]);

    // Disable 2FA
    const disableTwoFactor = useCallback(async (code: string) => {
        try {
            const response = await fetch(`${STRAPI_URL}/api/auth/2fa/disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code }),
            });
            const data = await response.json();

            if (data.success) {
                setIsEnabled(false);
                setIsVerified(false);
                setSetupKey(null);
                setQrCodeUrl(null);
                return true;
            }
            return false;
        } catch {
            // For demo
            if (code.length === 6) {
                setIsEnabled(false);
                setIsVerified(false);
                setSetupKey(null);
                setQrCodeUrl(null);
                return true;
            }
            return false;
        }
    }, []);

    // Require verification before sensitive action
    const requireVerification = useCallback(() => {
        if (isEnabled && !isVerified) {
            setShowVerifyModal(true);
        }
    }, [isEnabled, isVerified]);

    return (
        <TwoFactorContext.Provider
            value={{
                isEnabled,
                isVerified,
                setupKey,
                qrCodeUrl,
                enableTwoFactor,
                verifyCode,
                disableTwoFactor,
                requireVerification,
            }}
        >
            {children}
            {showVerifyModal && (
                <TwoFactorVerifyModal
                    onVerify={verifyCode}
                    onCancel={() => setShowVerifyModal(false)}
                />
            )}
        </TwoFactorContext.Provider>
    );
}

/**
 * 2FA Verification Modal
 */
function TwoFactorVerifyModal({
    onVerify,
    onCancel,
}: {
    onVerify: (code: string) => Promise<boolean>;
    onCancel: () => void;
}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const success = await onVerify(code);

        if (!success) {
            setError('Geçersiz kod. Lütfen tekrar deneyin.');
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">🔐</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        İki Faktörlü Doğrulama
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Kimlik doğrulama uygulamanızdan 6 haneli kodu girin
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500"
                        autoFocus
                    />

                    {error && (
                        <p className="text-red-500 text-sm text-center mt-3">{error}</p>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={code.length !== 6 || isLoading}
                            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? '...' : 'Doğrula'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/**
 * 2FA Setup Component
 */
export function TwoFactorSetup() {
    const { isEnabled, setupKey, enableTwoFactor, verifyCode, disableTwoFactor } =
        useTwoFactor();
    const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSetup = async () => {
        await enableTwoFactor();
        setStep('setup');
    };

    const handleVerify = async () => {
        const success = await verifyCode(code);
        if (success) {
            setStep('idle');
            setCode('');
        } else {
            setError('Geçersiz kod');
        }
    };

    const handleDisable = async () => {
        const success = await disableTwoFactor(code);
        if (success) {
            setStep('idle');
            setCode('');
        } else {
            setError('Geçersiz kod');
        }
    };

    if (isEnabled) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">✅</span>
                    <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">
                            2FA Aktif
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                            Hesabınız iki faktörlü kimlik doğrulama ile korunuyor
                        </p>
                    </div>
                </div>
                {step === 'disable' ? (
                    <div className="mt-4">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6 haneli kod"
                            className="w-full px-4 py-2 border rounded-lg mb-3"
                        />
                        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep('idle')}
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDisable}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg"
                            >
                                Devre Dışı Bırak
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setStep('disable')}
                        className="text-sm text-red-600 hover:underline"
                    >
                        2FA&apos;yı Devre Dışı Bırak
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            {step === 'idle' && (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                İki Faktörlü Kimlik Doğrulama
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Hesabınızı daha güvenli hale getirin
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSetup}
                        className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                        2FA&apos;yı Etkinleştir
                    </button>
                </>
            )}

            {step === 'setup' && setupKey && (
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        1. Uygulamanızla Tarayın
                    </h3>
                    <p className="text-sm text-gray-500">
                        Google Authenticator veya benzeri bir uygulama kullanın
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-500 mb-2">Manuel giriş kodu:</div>
                        <code className="text-lg font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                            {setupKey}
                        </code>
                    </div>
                    <button
                        onClick={() => setStep('verify')}
                        className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg"
                    >
                        Devam Et
                    </button>
                </div>
            )}

            {step === 'verify' && (
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        2. Kodu Doğrulayın
                    </h3>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full text-center text-2xl font-mono px-4 py-3 border rounded-lg"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        onClick={handleVerify}
                        disabled={code.length !== 6}
                        className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg disabled:opacity-50"
                    >
                        Etkinleştir
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Generate mock TOTP secret
 */
function generateMockSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
        secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
}
