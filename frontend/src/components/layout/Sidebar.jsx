import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  User, 
  LogOut, 
  BarChart3, 
  Users,
  Shield,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext'; // Patrón Abstract Factory
import { useProjects } from '../../context/ProjectContext'; // Conector con Nodo Central

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme(); // Obtenemos el producto de la fábrica
  const { syncThemeWithBackend } = useProjects(); // Importamos el protocolo de sincronización
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Proyectos', icon: FolderKanban, path: '/projects' },
    { name: 'Equipo', icon: Users, path: '/team' },
    { name: 'Reportes', icon: BarChart3, path: '/reports' },
    { name: 'Mi Perfil', icon: User, path: '/profile' },
  ];

  // --- [COMMAND: CONMUTACIÓN DE PROTOCOLO VISUAL] ---
const handleThemeToggle = () => {
    console.log("--- INICIO PROTOCOLO CONMUTACIÓN ---");
    
    // Estación 1: Verificación de Estado Local
    const nextTheme = isDarkMode ? 'LIGHT' : 'DARK';
    console.log("1. Estado actual DarkMode:", isDarkMode, "-> Cambiando a:", nextTheme);
    
    // Estación 2: Ejecución Abstract Factory (Frontend)
    try {
      toggleTheme();
      console.log("2. ToggleTheme ejecutado en UI");
    } catch (e) {
      console.error("Fallo en Estación 2:", e);
    }
    
    // Estación 3: Intento de Sincronización (Backend)
    console.log("3. Verificando función de sincronización...", syncThemeWithBackend);
    
    if (typeof syncThemeWithBackend === 'function') {
      console.log("4. Función detectada. Disparando petición...");
      syncThemeWithBackend(nextTheme);
    } else {
      console.warn("⚠️ ALERTA: syncThemeWithBackend NO ES UNA FUNCIÓN. Es de tipo:", typeof syncThemeWithBackend);
    }
  };

  return (
    <div className={`w-72 h-screen ${theme.sidebarBg} border-r ${theme.sidebarBorder} flex flex-col relative z-50 transition-colors duration-500`}>
      
      {/* BRANDING */}
      <div className="p-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="relative">
            <div className="absolute -inset-2 bg-indigo-500 rounded-lg blur opacity-[0.03] dark:opacity-20 group-hover:opacity-10 transition duration-500"></div>
            <Zap size={24} className={`${theme.accent} relative fill-current`} />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-2xl font-black ${theme.textMain} tracking-[0.1em] italic uppercase leading-none`}>
              Task<span className={theme.accent}>Flow</span>
            </h1>
            <p className={`text-[7px] ${theme.textSecondary} font-black tracking-[0.5em] mt-1 uppercase`}>
              Sistema Operativo
            </p>
          </div>
        </div>

        {/* SWITCH DE TEMA - ABSTRACT FACTORY TRIGGER */}
        <button 
          onClick={handleThemeToggle}
          className={`p-2 rounded-xl border transition-all duration-500 hover:scale-110 ${theme.card} ${theme.sidebarBorder} ${theme.textSecondary} hover:text-indigo-500 shadow-sm`}
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all duration-300 group relative overflow-hidden ${
                isActive 
                ? 'bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.15)]' 
                : `${theme.textSecondary} hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-indigo-600 dark:hover:text-slate-100`
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30"></div>
              )}
              
              <Icon 
                size={18} 
                className={`${isActive ? 'animate-pulse' : 'group-hover:scale-110'} transition-all`} 
              />
              
              <span className={`font-black uppercase italic text-[10px] tracking-[0.2em]`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER - USER CARD */}
      <div className="p-6 mt-auto">
        <div className={`${theme.userCard} border ${theme.sidebarBorder} rounded-[2rem] p-5 space-y-4 shadow-sm dark:shadow-none transition-colors`}>
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-black italic shadow-md border border-white/10">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[7px] font-black ${theme.textSecondary} uppercase tracking-widest`}>Operativo Actual</p>
              <p className={`text-[11px] font-black ${theme.accent} truncate uppercase italic tracking-tighter`}>
                {user?.email?.split('@')[0] || 'Unknown_Node'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield size={8} className="text-emerald-500" />
                <span className="text-[6px] text-emerald-600 dark:text-emerald-500 font-black uppercase">Acceso Verificado</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if(window.confirm("¿CONFIRMA CIERRE DE SESIÓN DEL SISTEMA?")) logout();
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 dark:bg-rose-500/5 hover:bg-rose-600 dark:hover:bg-rose-500 text-rose-600 dark:text-rose-500 hover:text-white rounded-xl transition-all duration-300 group"
          >
            <span className="font-black uppercase italic text-[9px] tracking-[0.2em]">Cerrar Sesión</span>
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <p className="text-center mt-6 text-[7px] text-slate-200 dark:text-slate-800 font-black uppercase tracking-[0.5em]">
          TF_OS v2.0 // 2026
        </p>
      </div>
    </div>
  );
}