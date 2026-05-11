import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Camera, Shield } from 'lucide-react';

export default function ProfilePreview() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const userName = user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="relative" ref={menuRef}>
      {/* DISPARADOR: Ahora es blanco en modo claro y oscuro en modo dark */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-1 pr-4 rounded-full border transition-all duration-300 ${
          isOpen 
            ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.2)]' 
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-500/20">
          {userInitial}
        </div>
        <div className="text-left hidden md:block">
          {/* El texto ahora cambia de color según el modo */}
          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
            {userName}
          </p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
            Tasker Pro
          </p>
        </div>
      </button>

      {/* PANEL DROPDOWN: bg-white puro para modo claro */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-72 bg-white dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header del Perfil */}
          <div className="p-8 text-center border-b border-slate-50 dark:border-slate-800/50 bg-gradient-to-b from-indigo-500/[0.03] to-transparent">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center text-3xl font-black italic border-4 border-white dark:border-slate-800 shadow-2xl text-white">
                {userInitial}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 shadow-lg"></div>
            </div>
            
            <h4 className="text-slate-900 dark:text-white font-black uppercase text-sm italic mt-4 tracking-tight">
              {userName}
            </h4>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Shield size={10} className="text-indigo-500 dark:text-indigo-400" />
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">
                ADMIN (RF-01.3)
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="p-3 space-y-1">
            <button className="w-full flex items-center gap-3 px-5 py-4 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-500/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest group">
              <Camera size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
              Cambiar Foto de Avatar
            </button>
            
            <div className="h-px bg-slate-50 dark:bg-slate-800 mx-4 my-2" />

            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-5 py-4 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              Cerrar Sesión Activa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}