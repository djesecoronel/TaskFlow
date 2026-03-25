import { useNotifications } from '../context/NotificationContext';
import { Calendar, Tag, Trash2, BellOff, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markAsRead, clearNotifications } = useNotifications();

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header Estilo Auditoría */}
      <div className="flex justify-between items-end mb-10 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Historial de Auditoría</h1>
          <p className="text-[10px] text-indigo-400 font-black uppercase mt-2 tracking-[0.3em]">Log de eventos del sistema v1.0</p>
        </div>
        <button 
          onClick={clearNotifications}
          className="group flex items-center gap-3 px-6 py-3 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase transition-all border border-rose-500/10"
        >
          <Trash2 size={14} className="group-hover:rotate-12 transition-transform" /> 
          Limpiar Registros
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-800/50">
            <BellOff size={48} className="mx-auto text-slate-800 mb-6" />
            <p className="text-slate-600 font-black italic uppercase tracking-[0.2em]">Sin eventos registrados</p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`group flex items-center gap-8 p-6 rounded-[2rem] border transition-all cursor-pointer relative ${
                n.isRead 
                ? 'bg-slate-900/30 border-slate-800 opacity-50' 
                : 'bg-slate-900 border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.05)]'
              }`}
            >
              <div className={`p-4 rounded-2xl ${
                n.type === 'COMMENT' ? 'bg-blue-500/10 text-blue-400' :
                n.type === 'ASSIGNMENT' ? 'bg-purple-500/10 text-purple-400' :
                'bg-indigo-500/10 text-indigo-400'
              }`}>
                <Tag size={20} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-indigo-400">{n.type}</span>
                  <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1.5 uppercase">
                    <Calendar size={12} /> {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-base text-slate-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,1)] animate-pulse" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}