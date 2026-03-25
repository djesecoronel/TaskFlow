/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // RF-09.2: Mantenemos la estrategia por clase para el switch de sol/luna
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          500: '#6366f1', 
          900: '#312e81',
        },
        // Superficies dinámicas
        surface: {
          light: '#ffffff', // Blanco nuclear
          soft: '#f8fafc',  // Gris tenue para hovers/secciones
          dark: '#05070a',  // Tu darkCard original
        },
        // Semántica para modo oscuro
        darkBg: '#020408',
        darkCard: '#05070a',
        // Bordes ultra-finos para que el modo claro se vea premium
        'border-light': '#f1f5f9', 
      },
      animation: {
        'pulse-slow': 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        // Sombra muy suave para que las tarjetas no necesiten bordes negros
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
        'cyber-indigo': '0 0 20px rgba(99, 102, 241, 0.15)',
      }
    },
  },
  plugins: [],
}