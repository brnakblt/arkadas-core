import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export default defineConfig({
    plugins: [react() as any],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.tsx'],
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: [
            'node_modules',
            '.next',
            'e2e',
            // Skip React component tests due to React 18/19 version conflict in npm workspaces
            // TODO: Fix once Strapi supports React 19 or separate web tests from monorepo
            ...(process.env.CI === 'true' ? [
                '**/components/**/*.test.tsx',
                'src/components/**/__tests__/**',
            ] : []),
        ],
        deps: {
            // Force inline bundling of these modules to use correct React version
            inline: [/@testing-library/],
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '.next/',
                'tests/',
                '**/*.d.ts',
                '**/*.config.*',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            react: path.dirname(require.resolve('react')),
            'react-dom': path.dirname(require.resolve('react-dom')),
        },
    },
});
