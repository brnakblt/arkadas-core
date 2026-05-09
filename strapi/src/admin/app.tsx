import type { StrapiApp } from '@strapi/strapi/admin';
import AuthLogo from './extensions/logo.svg';
import MenuLogo from './extensions/logo.svg';
import favicon from './extensions/favicon.svg';

export default {
  config: {
    auth: {
      logo: AuthLogo,
    },
    head: {
      favicon: favicon,
    },
    menu: {
      logo: MenuLogo,
    },
    theme: {
      light: {
        colors: {
          primary100: '#eef5e9',
          primary200: '#d5e6c8',
          primary500: '#8ec064',
          primary600: '#689F38',
          primary700: '#4B830D',
          buttonPrimary500: '#689F38',
          buttonPrimary600: '#4B830D',
        }
      },
      dark: {
        colors: {
          primary100: '#eef5e9',
          primary200: '#d5e6c8',
          primary500: '#8ec064',
          primary600: '#689F38',
          primary700: '#4B830D',
          buttonPrimary500: '#689F38',
          buttonPrimary600: '#4B830D',
        }
      }
    },
    locales: [
      // 'ar',
      // 'fr',
      // 'cs',
      // 'de',
      // 'dk',
      // 'es',
      // 'he',
      // 'id',
      // 'it',
      // 'ja',
      // 'ko',
      // 'ms',
      // 'nl',
      // 'no',
      // 'pl',
      // 'pt-BR',
      // 'pt',
      // 'ru',
      // 'sk',
      // 'sv',
      // 'th',
      'tr',
      // 'uk',
      // 'vi',
      // 'zh-Hans',
      // 'zh',
    ],
  },
  bootstrap(app: StrapiApp) {
    console.log(app);
  },
};
