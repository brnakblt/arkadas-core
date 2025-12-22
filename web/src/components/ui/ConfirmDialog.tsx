'use client';

import { useState, useCallback, ReactNode, createContext, useContext } from 'react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context.confirm;
}

const TYPE_STYLES = {
    danger: {
        icon: '⚠️',
        buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
        icon: '⚡',
        buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    info: {
        icon: 'ℹ️',
        buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
    }, []);

    const handleConfirm = async () => {
        if (!options) return;

        setIsLoading(true);
        try {
            await options.onConfirm();
        } finally {
            setIsLoading(false);
            setOptions(null);
        }
    };

    const handleCancel = () => {
        options?.onCancel?.();
        setOptions(null);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            handleCancel();
        }
    };

    const type = options?.type || 'info';
    const styles = TYPE_STYLES[type];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {options && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={handleBackdropClick}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-scale-in">
                        {/* Header */}
                        <div className="p-6 text-center">
                            <div className="text-4xl mb-4">{styles.icon}</div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {options.title || 'Onay'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {options.message}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 p-4 border-t dark:border-gray-700">
                            <button
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                {options.cancelText || 'İptal'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${styles.buttonClass}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        İşleniyor...
                                    </span>
                                ) : (
                                    options.confirmText || 'Onayla'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

/**
 * Alert Dialog - Non-blocking message
 */
export function AlertDialog({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
}: {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
}) {
    if (!isOpen) return null;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-4xl mb-4">{icons[type]}</div>
                {title && (
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                )}
                <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Tamam
                </button>
            </div>
        </div>
    );
}
