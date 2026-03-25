import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Inicializamos buscando en localStorage o respetando la preferencia del sistema
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('tf_theme');
    // Mantenemos tu preferencia: Por defecto Dark Mode
    if (savedTheme) return savedTheme === 'dark';
    return true; 
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Forzamos la limpieza y aplicación de la clase en el HTML
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light'); // Aseguramos limpieza
      localStorage.setItem('tf_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light'); // Ayuda a Tailwind a resetear estados
      localStorage.setItem('tf_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
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