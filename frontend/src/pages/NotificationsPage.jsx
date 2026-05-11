import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext'; // IMPORTAR TEMA
import { Calendar, Tag, Trash2, BellOff, Binary, ShieldAlert, Cpu } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markAsRead, clearNotifications } = useNotifications();
  const { theme, isDarkMode } = useTheme(); // CONSUMIR TEMA

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-700">
      
      {/* Header Estilo Auditoría Alpha */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b pb-8 relative overflow-hidden ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Cpu size={16} className="text-indigo-500 animate-pulse" />
            <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme.textSecondary}`}>
              Security_Protocol // Log
            </span>
          </div>
          <h1 className={`text-5xl font-black italic uppercase tracking-tighter leading-none ${theme.textMain}`}>
            Historial de <span className="text-indigo-500 text-glow">Auditoría</span>
          </h1>
        </div>

        <button 
          onClick={clearNotifications}
          className={`group flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border mt-6 md:mt-0 ${
            isDarkMode 
            ? 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border-rose-500/10' 
            : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
          }`}
        >
          <Trash2 size={14} className="group-hover:rotate-12 transition-transform" /> 
          Limpiar Registros
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className={`text-center py-32 rounded-[3rem] border-2 border-dashed transition-colors ${
            isDarkMode ? 'bg-slate-900/20 border-slate-800/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <BellOff size={48} className={`mx-auto mb-6 opacity-20 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
            <p className={`font-black italic uppercase tracking-[0.2em] ${theme.textSecondary}`}>
              Sin eventos registrados en el nodo
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`group flex items-center gap-8 p-6 rounded-[2.5rem] border transition-all cursor-pointer relative overflow-hidden ${
                n.isRead 
                ? isDarkMode 
                  ? 'bg-slate-900/30 border-slate-800 opacity-50' 
                  : 'bg-slate-50 border-slate-100 opacity-60'
                : isDarkMode
                  ? 'bg-[#0a0c10] border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.05)] hover:border-indigo-500/60'
                  : 'bg-white border-indigo-100 shadow-xl shadow-indigo-500/5 hover:border-indigo-300'
              }`}
            >
              {/* Icono de Tipo con Glow */}
              <div className={`p-5 rounded-[1.5rem] transition-transform group-hover:scale-110 ${
                n.type === 'COMMENT' ? 'bg-blue-500/10 text-blue-400' :
                n.type === 'ASSIGNMENT' ? 'bg-purple-500/10 text-purple-400' :
                'bg-indigo-500/10 text-indigo-400'
              }`}>
                {n.type === 'ALERT' ? <ShieldAlert size={22} /> : <Binary size={22} />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className={`text-[10px] font-black uppercase italic tracking-widest ${
                    n.isRead ? 'text-slate-500' : 'text-indigo-500'
                  }`}>
                    {n.type}_EVENT
                  </span>
                  <div className={`h-1 w-1 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
                  <span className={`text-[9px] font-bold flex items-center gap-1.5 uppercase ${theme.textSecondary}`}>
                    <Calendar size={12} /> {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={`text-base font-bold leading-relaxed transition-colors ${
                  isDarkMode 
                  ? n.isRead ? 'text-slate-500' : 'text-slate-200 group-hover:text-white'
                  : n.isRead ? 'text-slate-400' : 'text-slate-700 group-hover:text-indigo-900'
                }`}>
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,1)] animate-pulse" />
                  <span className="text-[7px] font-black uppercase text-indigo-500 animate-pulse">New</span>
                </div>
              )}
              
              {/* Decoración de fondo de la tarjeta */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
                <Binary size={100} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}