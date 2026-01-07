import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: ["node_modules/", ".expo/", "dist/", "web-build/", "babel.config.js", "metro.config.js"]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx}"],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                ecmaFeatures: { jsx: true }
            }
        }
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "no-console": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }]
        }
    }
];
