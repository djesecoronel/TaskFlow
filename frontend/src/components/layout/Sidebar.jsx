import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderKanban, User, LogOut, 
  BarChart3, Users, Shield, Zap, Sun, Moon 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProjects } from '../../context/ProjectContext';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { syncThemeWithBackend } = useProjects(); 
  const location = useLocation();

  // --- [DETECCIÓN DE RE-RENDERS] ---
  console.log("%c 🛰️ [SIDEBAR]: NODO CARGADO ", "color: #10b981; font-weight: bold;");

  // Memorizamos los items para evitar recrear la navegación innecesariamente
  const menuItems = useMemo(() => [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Proyectos', icon: FolderKanban, path: '/projects' },
    { name: 'Equipo', icon: Users, path: '/team' },
    { name: 'Reportes', icon: BarChart3, path: '/reports' },
    { name: 'Mi Perfil', icon: User, path: '/profile' },
  ], []);

  const handleThemeToggle = async (e) => {
    // Matamos cualquier interferencia de otros elementos
    e.preventDefault();
    e.stopPropagation();

    console.log("%c ⚡ [EVENTO]: DISPARO CAPTURADO ", "background: #4f46e5; color: white; padding: 4px; border-radius: 4px;");
    
    const nextTheme = isDarkMode ? 'LIGHT' : 'DARK';
    
    // 1. Cambio visual (Fábrica)
    toggleTheme();
    
    // 2. Persistencia (Nodo Central)
    if (syncThemeWithBackend && typeof syncThemeWithBackend === 'function') {
      console.log(`📡 [SYNC]: Sincronizando instrucción '${nextTheme}'...`);
      await syncThemeWithBackend(nextTheme);
    } else {
      console.error("❌ [CRITICAL]: Error de enlace con ProjectContext.");
    }
  };

  return (
    <div className={`w-72 h-screen ${theme.sidebarBg} border-r ${theme.sidebarBorder} flex flex-col relative z-[999] transition-colors duration-500`}>
      
      {/* BRANDING Y BOTÓN MAESTRO */}
      <div className="p-10 mb-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <Zap size={24} className={`${theme.accent} fill-current`} />
          <div className="flex flex-col">
            <h1 className={`text-2xl font-black ${theme.textMain} tracking-[0.1em] italic uppercase leading-none`}>
              Task<span className={theme.accent}>Flow</span>
            </h1>
            <p className={`text-[7px] ${theme.textSecondary} font-black tracking-[0.5em] mt-1 uppercase`}>
              Sistema Operativo
            </p>
          </div>
        </div>

        {/* BOTÓN: Con aislamiento de puntero para evitar capas invisibles */}
        <button 
          onMouseDown={handleThemeToggle} // Usamos onMouseDown para ganar a cualquier overlay
          className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-110 active:scale-90 ${theme.card} ${theme.sidebarBorder} ${theme.textSecondary} hover:text-indigo-500 shadow-2xl cursor-pointer relative z-[1000]`}
          style={{ isolation: 'isolate', pointerEvents: 'all' }}
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all duration-300 group ${
                isActive 
                ? 'bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)]' 
                : `${theme.textSecondary} hover:bg-slate-900/40 hover:text-white`
              }`}
            >
              <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
              <span className="font-black uppercase italic text-[10px] tracking-[0.2em]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER: CARD DE OPERATIVO (Diseño Original Intacto) */}
      <div className="p-6 mt-auto">
        <div className={`${theme.userCard} border ${theme.sidebarBorder} rounded-[2rem] p-5 space-y-4 shadow-sm`}>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
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
                <span className="text-[6px] text-emerald-600 font-black uppercase">Acceso Verificado</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { if(window.confirm("¿CIERRE DE SESIÓN?")) logout(); }}
            className="w-full flex items-center justify-between px-4 py-3 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all duration-300"
          >
            <span className="font-black uppercase italic text-[9px] tracking-[0.2em]">Cerrar Sesión</span>
            <LogOut size={16} />
          </button>
        </div>
        <p className="text-center mt-6 text-[7px] text-slate-800 font-black uppercase tracking-[0.5em]">
          TF_OS v2.0 // 2026
        </p>
      </div>
    </div>
  );
}