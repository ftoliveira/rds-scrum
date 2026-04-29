import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#00897B',
          'primary-darken-1': '#00695C',
          secondary: '#26A69A',
          surface: '#FFFFFF',
          background: '#F4F6F8',
          error: '#DC2626',
          warning: '#D97706',
          success: '#16A34A',
          info: '#0284C7',
        },
      },
    },
  },
  defaults: {
    VBtn: { style: 'text-transform: none; letter-spacing: 0; font-weight: 500;' },
    VCard: { elevation: 0 },
  },
});
