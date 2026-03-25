import { Bell, Check, Trash2, BellOff, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export default function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useNotifications();
  
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="flex items-center gap-3" ref={menuRef}>
      
      {/* INTERRUPTOR DE MODO: bg-white puro en modo claro */}
      <button
        onClick={toggleTheme}
        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 group relative overflow-hidden"
        title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        <div className="relative z-10">
          {isDarkMode ? (
            <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500 text-amber-400" />
          ) : (
            <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500 text-indigo-600" />
          )}
        </div>
        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* CAMPANA DE NOTIFICACIONES */}
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-2xl border transition-all relative group ${
            isOpen 
              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <Bell 
            size={20} 
            className={unreadCount > 0 ? "animate-[wiggle_1s_ease-in-out_infinite]" : ""} 
          />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 border-2 border-white dark:border-[#020408] text-[10px] font-black text-white items-center justify-center">
                {unreadCount > 9 ? '+9' : unreadCount}
              </span>
            </span>
          )}
        </button>

        {/* Panel de Notificaciones: bg-white puro en claro */}
        {isOpen && (
          <div className="absolute right-0 mt-4 w-96 bg-white dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
            
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic">Alertas de Sistema</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Sincronizado en tiempo real</p>
              </div>
              <div className="flex gap-1">
                 <button 
                  onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} 
                  title="Marcar todas como leídas" 
                  className="p-2 hover:bg-emerald-500/10 rounded-xl text-emerald-500 transition-all active:scale-90"
                 >
                   <Check size={16}/>
                 </button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); clearNotifications(); }} 
                  title="Limpiar historial" 
                  className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-all active:scale-90"
                 >
                   <Trash2 size={16}/>
                 </button>
              </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
                    <BellOff size={24} className="text-slate-200 dark:text-slate-800" />
                  </div>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest italic">Bandeja de entrada vacía</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-6 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-indigo-500/5 relative group/item ${
                      !n.isRead ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/5' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {!n.isRead && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]" />
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase italic tracking-tighter ${
                        n.type === 'COMMENT' ? 'text-blue-500 bg-blue-500/10' :
                        n.type === 'ASSIGNMENT' ? 'text-purple-500 bg-purple-500/10' :
                        n.type === 'STATUS_CHANGE' ? 'text-emerald-500 bg-emerald-500/10' :
                        'text-indigo-500 bg-indigo-500/10'
                      }`}>
                        {n.type}
                      </span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-600 font-bold tabular-nums">
                        {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed group-hover/item:text-indigo-600 dark:group-hover/item:text-white transition-colors">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/50 text-center border-t border-slate-50 dark:border-slate-800">
                <button 
                  onClick={handleViewAll}
                  className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-indigo-500 transition-colors w-full py-2"
                >
                  Ver todo el historial
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}