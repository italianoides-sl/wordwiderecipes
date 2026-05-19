import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1A1208',
        surface: '#241A0C',
        ink: '#F2EBD9',
        'ink-muted': '#C4B49A',
        gold: '#E8A838',
        pimenton: '#8B3A2A',
        sage: '#4A7A5A',
        border: '#3A2A18',
      },
    },
  },
  plugins: [],
};

export default config;
