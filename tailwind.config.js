/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        crm: {
          base: '#0B0D12', surface: '#0F1218', card: '#141921', sidebar: '#080B10',
          hover: '#0C1520', cyan: '#22D4F0', 'cyan-dim': '#091C28',
          primary: '#E2E8F0', secondary: '#64748B', muted: '#2A3B4C', border: '#1A2535',
          success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
        }
      }
    }
  },
  plugins: []
}
