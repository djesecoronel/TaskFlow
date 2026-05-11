import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('tf_theme');
    // Por defecto Dark Mode según tu requerimiento
    if (savedTheme) return savedTheme === 'dark';
    return true; 
  });

  /**
   * [PATRÓN: ABSTRACT FACTORY]
   * Definimos las familias de colores para que los componentes 
   * no usen clases manuales, sino que consuman la "fábrica" de estilos.
   */
  const themes = {
    dark: {
      bodyBg: 'bg-[#05070a]', // El fondo profundo que ya tienes
      sidebarBg: 'bg-[#05070a]',
      sidebarBorder: 'border-slate-800/40',
      userCard: 'bg-slate-950/50',
      textMain: 'text-white',
      textSecondary: 'text-slate-500',
      accent: 'text-indigo-500',
      card: 'bg-slate-900/50 border-slate-800'
    },
    light: {
      bodyBg: 'bg-slate-50', // Blanco nuclear / gris muy tenue para descanso visual
      sidebarBg: 'bg-white',
      sidebarBorder: 'border-slate-200',
      userCard: 'bg-slate-50',
      textMain: 'text-slate-900',
      textSecondary: 'text-slate-400',
      accent: 'text-indigo-600',
      card: 'bg-white border-slate-200'
    }
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Sincronización con el DOM para que las clases 'dark:' de Tailwind funcionen
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark'; // Avisa al navegador que renderice barras de scroll oscuras
      localStorage.setItem('tf_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light'; // Barras de scroll claras
      localStorage.setItem('tf_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
};