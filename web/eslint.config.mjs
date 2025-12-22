import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default [
    // Base JavaScript config
    js.configs.recommended,

    // Ignore patterns
    {
        ignores: [
            '**/node_modules/**',
            '**/.next/**',
            '**/out/**',
            '**/dist/**',
            '**/build/**',
            '**/*.config.js',
            '**/*.config.cjs',
            '**/*.config.mjs',
            '**/src-tauri/**',
            '**/public/**',
            // Test utilities
            '**/*.cjs',
            '**/vitest.config.ts',
        ],
    },

    // TypeScript files
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                FormData: 'readonly',
                Blob: 'readonly',
                File: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                Headers: 'readonly',
                AbortController: 'readonly',
                HTMLElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLButtonElement: 'readonly',
                HTMLDivElement: 'readonly',
                HTMLImageElement: 'readonly',
                HTMLIFrameElement: 'readonly',
                HTMLAnchorElement: 'readonly',
                HTMLTextAreaElement: 'readonly',
                HTMLSelectElement: 'readonly',
                Event: 'readonly',
                MouseEvent: 'readonly',
                KeyboardEvent: 'readonly',
                FocusEvent: 'readonly',
                MessageEvent: 'readonly',
                SpeechSynthesis: 'readonly',
                SpeechSynthesisUtterance: 'readonly',
                speechSynthesis: 'readonly',
                Audio: 'readonly',
                Image: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                IntersectionObserver: 'readonly',
                ResizeObserver: 'readonly',
                MutationObserver: 'readonly',
                MediaQueryList: 'readonly',
                matchMedia: 'readonly',
                google: 'readonly',
                // Node.js globals
                process: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',
                NodeJS: 'readonly',
                // Web APIs
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
                ReadableStream: 'readonly',
                RequestInit: 'readonly',
                HeadersInit: 'readonly',
                Worker: 'readonly',
                AudioContext: 'readonly',
                AudioBufferSourceNode: 'readonly',
                GeolocationPosition: 'readonly',
                GeolocationPositionError: 'readonly',
                performance: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                // React
                React: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react': reactPlugin,
            'react-hooks': reactHooksPlugin,
            '@next/next': nextPlugin,
        },
        rules: {
            // TypeScript rules
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // React rules
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'warn',
            'react/jsx-no-target-blank': 'error',
            'react/jsx-key': 'error',

            // React Hooks rules
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Next.js rules
            '@next/next/no-img-element': 'warn',
            '@next/next/no-html-link-for-pages': 'error',

            // General rules
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'warn',
            'no-unused-vars': 'off', // Using TypeScript version instead
            'prefer-const': 'warn',
            'no-var': 'error',
            'eqeqeq': ['error', 'always', { null: 'ignore' }],
            'curly': ['warn', 'multi-line'], // Allow single-line if statements
            'no-throw-literal': 'error',
            'no-return-await': 'off',
            'require-await': 'off', // Too many false positives
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // JavaScript files (config files, etc.)
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                module: 'readonly',
                require: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                console: 'readonly',
                Buffer: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'prefer-const': 'warn',
            'no-var': 'error',
        },
    },

    // Service Worker files
    {
        files: ['**/public/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                self: 'readonly',
                importScripts: 'readonly',
                fetch: 'readonly',
                caches: 'readonly',
                clients: 'readonly',
                registration: 'readonly',
                URL: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                location: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                Promise: 'readonly',
                ExtendableEvent: 'readonly',
                FetchEvent: 'readonly',
                define: 'readonly',
                trustedTypes: 'readonly',
                _: 'readonly',
            },
        },
        rules: {
            'no-var': 'off',
            'no-unused-vars': 'off',
            'no-empty': 'off',
            'no-undef': 'off',
            'no-constant-condition': 'off',
            'no-cond-assign': 'off',
        },
    },
];
