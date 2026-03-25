import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import ProfilePreview from './ProfilePreview';
import { useTheme } from '../../context/ThemeContext';

export default function MainLayout({ children }) {
  const { isDarkMode } = useTheme();

  return (
    /* Mantenemos tu lógica original, pero forzamos bg-white en modo claro */
    <div className="flex min-h-screen bg-white dark:bg-[#020408] text-slate-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden transition-colors duration-500">
      
      {/* CAPA DE AMBIENTE DINÁMICO: Mantenemos la funcionalidad pero ajustamos visibilidad */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Orbes: Ahora en modo claro son casi imperceptibles para no manchar el blanco */}
        <div className={`absolute -top-[15%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse duration-[10s] transition-all ${
          isDarkMode ? 'bg-indigo-600/10 opacity-100' : 'bg-indigo-400/5 opacity-30'
        }`} />
        
        <div className={`absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[140px] animate-pulse duration-[8s] transition-all ${
          isDarkMode ? 'bg-purple-600/10 opacity-100' : 'bg-purple-400/5 opacity-30'
        }`} />

        {/* Grano de película: Mantenemos la URL pero con opacidad 0 en modo claro para limpieza total */}
        <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 transition-opacity duration-500 ${
          isDarkMode ? 'opacity-[0.015]' : 'opacity-0'
        }`} />
      </div>

      {/* Navegación Lateral */}
      <aside className="relative z-50">
        <Sidebar />
      </aside>
      
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* HEADER: bg-white/90 para que el efecto glass se vea blanco nuclear en modo claro */}
        <header className="h-24 border-b border-slate-100 dark:border-white/5 flex items-center justify-end px-10 gap-4 bg-white/90 dark:bg-[#020408]/40 backdrop-blur-2xl sticky top-0 z-40 transition-colors duration-500">
          
          {/* Indicador de Status de Red: Mantenemos funcionalidad */}
          <div className="hidden md:flex items-center gap-3 mr-auto bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 px-5 py-2.5 rounded-2xl transition-colors">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 italic">
              Network_Status: <span className="text-emerald-600 dark:text-emerald-500">Optimal</span>
            </span>
          </div>

          {/* Componentes de Usuario */}
          <div className="flex items-center gap-2">
            <NotificationBell /> 
            
            <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-800 to-transparent mx-3 opacity-50" />
            
            <div className="hover:scale-105 transition-transform duration-300">
              <ProfilePreview />
            </div>
          </div>
        </header>

        {/* ÁREA DE DESPLIEGUE TÁCTICO */}
        <section className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children || <Outlet />}
          </div>
          {/* Mantenemos el espaciador inferior */}
          <div className="h-20 w-full pointer-events-none" />
        </section>

      </main>
    </div>
  );
}