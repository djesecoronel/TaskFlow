import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import ProfilePreview from './ProfilePreview';
import { useTheme } from '../../context/ThemeContext';

export default function MainLayout({ children }) {
  const { isDarkMode, theme } = useTheme();

  return (
    /**
     * [ORDEN TÁCTICO DE COLORES]
     * bg-white para el modo claro (Nuclear) y bg-[#020408] para el oscuro (Deep Slate).
     * transition-colors asegura que el cambio de tema no sea brusco.
     */
    <div className={`flex min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 overflow-hidden ${
      isDarkMode ? 'bg-[#020408] text-slate-200' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* AMBIENTE DINÁMICO (ORBES) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Orbes ajustados para no ensuciar el blanco en modo claro */}
        <div className={`absolute -top-[15%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse duration-[10s] transition-all ${
          isDarkMode ? 'bg-indigo-600/10 opacity-100' : 'bg-indigo-400/5 opacity-20'
        }`} />
        
        <div className={`absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse duration-[8s] transition-all ${
          isDarkMode ? 'bg-purple-600/10 opacity-100' : 'bg-purple-400/5 opacity-20'
        }`} />

        {/* Textura de grano: Solo visible en modo oscuro para profundidad */}
        <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 transition-opacity duration-500 ${
          isDarkMode ? 'opacity-[0.015]' : 'opacity-0'
        }`} />
      </div>

      {/* NAVEGACIÓN LATERAL (SIDEBAR) */}
      <aside className="relative z-50 shadow-2xl">
        <Sidebar />
      </aside>
      
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* HEADER DINÁMICO */}
        <header className={`h-24 border-b flex items-center justify-end px-10 gap-4 backdrop-blur-2xl sticky top-0 z-40 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-[#020408]/40 border-white/5' 
            : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
          
          {/* Status de Red */}
          <div className={`hidden md:flex items-center gap-3 mr-auto border px-5 py-2.5 rounded-2xl transition-colors ${
            isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-slate-100 shadow-inner'
          }`}>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] italic ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Network_Status: <span className="text-emerald-500">Optimal</span>
            </span>
          </div>

          {/* User Components */}
          <div className="flex items-center gap-2">
            <NotificationBell /> 
            
            <div className={`w-[1px] h-8 mx-3 opacity-50 ${
              isDarkMode ? 'bg-gradient-to-b from-transparent via-slate-800 to-transparent' : 'bg-slate-200'
            }`} />
            
            <div className="hover:scale-105 transition-transform duration-300">
              <ProfilePreview />
            </div>
          </div>
        </header>

        {/* ÁREA DE DESPLIEGUE TÁCTICO (CONTENT) */}
        <section className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children || <Outlet />}
          </div>
          
          {/* Espaciador inferior */}
          <div className="h-20 w-full pointer-events-none" />
        </section>

      </main>
    </div>
  );
}