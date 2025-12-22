'use client';

/**
 * Form Feedback Components
 * 
 * Components for displaying form validation feedback:
 * - FieldError: Error message for a single field
 * - FieldSuccess: Success message for a field
 * - FieldHint: Helper text for a field
 * - FormMessage: General form-level message
 * - ValidationSummary: Summary of all form errors
 * - InputWrapper: Wrapper with built-in feedback support
 */

import React, { createContext, useContext, useId } from 'react';

// ============================================================
// Types
// ============================================================

export type FeedbackType = 'error' | 'success' | 'warning' | 'info';

export interface FieldState {
    error?: string;
    success?: string;
    warning?: string;
    touched?: boolean;
    dirty?: boolean;
}

// ============================================================
// Field Error Component
// ============================================================

interface FieldErrorProps {
    message?: string | null;
    id?: string;
    className?: string;
}

export function FieldError({ message, id, className = '' }: FieldErrorProps) {
    if (!message) return null;

    return (
        <p
            id={id}
            className={`text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 ${className}`}
            role="alert"
            aria-live="polite"
        >
            <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
            </svg>
            <span>{message}</span>
        </p>
    );
}

// ============================================================
// Field Success Component
// ============================================================

interface FieldSuccessProps {
    message?: string | null;
    id?: string;
    className?: string;
}

export function FieldSuccess({ message, id, className = '' }: FieldSuccessProps) {
    if (!message) return null;

    return (
        <p
            id={id}
            className={`text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1 ${className}`}
            role="status"
            aria-live="polite"
        >
            <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                />
            </svg>
            <span>{message}</span>
        </p>
    );
}

// ============================================================
// Field Warning Component
// ============================================================

interface FieldWarningProps {
    message?: string | null;
    id?: string;
    className?: string;
}

export function FieldWarning({ message, id, className = '' }: FieldWarningProps) {
    if (!message) return null;

    return (
        <p
            id={id}
            className={`text-sm text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1 ${className}`}
            role="status"
            aria-live="polite"
        >
            <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
            </svg>
            <span>{message}</span>
        </p>
    );
}

// ============================================================
// Field Hint Component
// ============================================================

interface FieldHintProps {
    children: React.ReactNode;
    id?: string;
    className?: string;
}

export function FieldHint({ children, id, className = '' }: FieldHintProps) {
    return (
        <p
            id={id}
            className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`}
        >
            {children}
        </p>
    );
}

// ============================================================
// Form Message Component
// ============================================================

interface FormMessageProps {
    type: FeedbackType;
    message: string;
    onDismiss?: () => void;
    className?: string;
}

const messageStyles: Record<FeedbackType, string> = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
};

const messageIcons: Record<FeedbackType, React.ReactNode> = {
    error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
    ),
    success: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
    ),
};

export function FormMessage({ type, message, onDismiss, className = '' }: FormMessageProps) {
    return (
        <div
            className={`rounded-lg border p-4 flex items-start gap-3 ${messageStyles[type]} ${className}`}
            role={type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
        >
            <span className="flex-shrink-0">{messageIcons[type]}</span>
            <p className="flex-1 text-sm">{message}</p>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 hover:opacity-70 transition-opacity"
                    aria-label="Kapat"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );
}

// ============================================================
// Validation Summary Component
// ============================================================

interface ValidationSummaryProps {
    errors: Record<string, string | undefined>;
    title?: string;
    className?: string;
}

export function ValidationSummary({
    errors,
    title = 'Lütfen aşağıdaki hataları düzeltin:',
    className = '',
}: ValidationSummaryProps) {
    const errorList = Object.entries(errors).filter(([, msg]) => msg);

    if (errorList.length === 0) return null;

    return (
        <div
            className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
            role="alert"
            aria-live="assertive"
        >
            <h3 className="text-red-700 dark:text-red-300 font-medium mb-2">{title}</h3>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                {errorList.map(([field, message]) => (
                    <li key={field}>{message}</li>
                ))}
            </ul>
        </div>
    );
}

// ============================================================
// Input Wrapper Component
// ============================================================

interface InputWrapperProps {
    label: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    success?: string;
    warning?: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

export function InputWrapper({
    label,
    htmlFor,
    required = false,
    error,
    success,
    warning,
    hint,
    children,
    className = '',
}: InputWrapperProps) {
    const generatedId = useId();
    const inputId = htmlFor || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
        <div className={`space-y-1 ${className}`}>
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Clone children to add aria attributes */}
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                        id: inputId,
                        'aria-invalid': !!error,
                        'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
                        className: `${(child.props as Record<string, unknown>).className || ''} ${error
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                : success
                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                                    : ''
                            }`.trim(),
                    });
                }
                return child;
            })}

            {/* Feedback messages */}
            {error && <FieldError message={error} id={errorId} />}
            {success && !error && <FieldSuccess message={success} />}
            {warning && !error && !success && <FieldWarning message={warning} />}
            {hint && !error && !success && !warning && <FieldHint id={hintId}>{hint}</FieldHint>}
        </div>
    );
}

// ============================================================
// Form Context for Managing Field States
// ============================================================

interface FormContextValue {
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    setFieldError: (field: string, error: string | undefined) => void;
    setFieldTouched: (field: string, touched: boolean) => void;
    clearErrors: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
    return useContext(FormContext);
}

// ============================================================
// Character Counter Component
// ============================================================

interface CharacterCounterProps {
    current: number;
    max: number;
    className?: string;
}

export function CharacterCounter({ current, max, className = '' }: CharacterCounterProps) {
    const isOver = current > max;
    const isWarning = current > max * 0.9;

    return (
        <span
            className={`text-xs ${isOver
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : isWarning
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-500 dark:text-gray-400'
                } ${className}`}
        >
            {current}/{max}
        </span>
    );
}

// ============================================================
// Password Strength Indicator
// ============================================================

interface PasswordStrengthProps {
    password: string;
    className?: string;
}

export function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
    const getStrength = (pwd: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 1) return { score, label: 'Çok Zayıf', color: 'bg-red-500' };
        if (score === 2) return { score, label: 'Zayıf', color: 'bg-orange-500' };
        if (score === 3) return { score, label: 'Orta', color: 'bg-yellow-500' };
        if (score === 4) return { score, label: 'Güçlü', color: 'bg-green-500' };
        return { score, label: 'Çok Güçlü', color: 'bg-green-600' };
    };

    const strength = getStrength(password);
    const percentage = (strength.score / 5) * 100;

    if (!password) return null;

    return (
        <div className={`mt-2 ${className}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Şifre Güçlüğü</span>
                <span className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>
                    {strength.label}
                </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// ============================================================
// Export all components
// ============================================================

export default {
    FieldError,
    FieldSuccess,
    FieldWarning,
    FieldHint,
    FormMessage,
    ValidationSummary,
    InputWrapper,
    CharacterCounter,
    PasswordStrength,
};
