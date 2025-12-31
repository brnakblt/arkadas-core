const strapi = require('@strapi/strapi');
const { resolve } = require('path');

// Explicitly define distDir to resolve path issues in Docker/Monorepo
strapi.createStrapi({ distDir: resolve(__dirname, './dist') }).start();
