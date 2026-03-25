import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  User, 
  LogOut, 
  BarChart3, 
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Proyectos', icon: FolderKanban, path: '/projects' },
    { name: 'Equipo', icon: Users, path: '/team' },
    { name: 'Reportes', icon: BarChart3, path: '/reports' },
    { name: 'Mi Perfil', icon: User, path: '/profile' },
  ];

  return (
    /* Sidebar: bg-white puro y borde slate-50 para que sea casi imperceptible en modo claro */
    <div className="w-72 h-screen bg-white dark:bg-[#05070a] border-r border-slate-50 dark:border-slate-800/40 flex flex-col relative z-50 transition-colors duration-500">
      
      {/* BRANDING */}
      <div className="p-10 mb-4">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="relative">
            {/* El brillo del logo ahora es más sutil en blanco para no ensuciar */}
            <div className="absolute -inset-2 bg-indigo-500 rounded-lg blur opacity-[0.03] dark:opacity-20 group-hover:opacity-10 transition duration-500"></div>
            <Zap size={24} className="text-indigo-600 dark:text-indigo-500 relative fill-current" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-[0.1em] italic uppercase leading-none">
              Task<span className="text-indigo-600 dark:text-indigo-500">Flow</span>
            </h1>
            <p className="text-[7px] text-slate-400 dark:text-slate-600 font-black tracking-[0.5em] mt-1 uppercase">
              Sistema Operativo
            </p>
          </div>
        </div>
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
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-indigo-600 dark:hover:text-slate-100'
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
        {/* bg-white y borde slate-100 para look nuclear. En dark usamos slate-950/50 */}
        <div className="bg-white dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/40 rounded-[2rem] p-5 space-y-4 shadow-sm dark:shadow-none transition-colors">
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-black italic shadow-md border border-white/10">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Operativo Actual</p>
              <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 truncate uppercase italic tracking-tighter">
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
        
        {/* Texto de versión: slate-200 para que sea muy discreto sobre el blanco */}
        <p className="text-center mt-6 text-[7px] text-slate-200 dark:text-slate-800 font-black uppercase tracking-[0.5em]">
          TF_OS v2.0 // 2026
        </p>
      </div>
    </div>
  );
}