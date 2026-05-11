import { UserPlus, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TeamBar({ members = [], onInvite, onRemove, isAdmin }) {
  const { user } = useAuth();

  // --- BLINDAJE DE SEGURIDAD PARA EL MAPEO ---
  const safeMembers = Array.isArray(members) ? members : [];

  return (
    <div className="flex items-center gap-4 py-2 px-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.3)]">
      <div className="flex -space-x-3 overflow-hidden">
        {safeMembers.map((member, i) => {
          // Extraemos la inicial con seguridad extrema
          const initial = member?.email?.charAt(0)?.toUpperCase() || member?.name?.charAt(0)?.toUpperCase() || '?';
          const emailDisplay = member?.email || 'USUARIO_ANONIMO';

          return (
            <div 
              key={i} 
              className="group relative w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase hover:z-10 transition-all hover:scale-110 cursor-help shadow-lg"
              title={emailDisplay}
            >
              {/* CORRECCIÓN DEL ERROR CHARAT */}
              {initial}
              
              {/* Tooltip de Rol (Manteniendo tu lógica) */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <span className="text-white text-[9px] font-black italic tracking-tighter">{emailDisplay}</span>
                {member?.role === 'ADMIN' && <Shield size={10} className="text-amber-500 animate-pulse" />}
              </div>

              {/* Botón de expulsar (Blindado contra nulos) */}
              {isAdmin && member?.email !== user?.email && (
                <button 
                  onClick={() => onRemove(member.email)}
                  className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón de Invitación rápida (Estética Alpha) */}
      {isAdmin && (
        <button 
          onClick={onInvite}
          className="flex items-center gap-2 pl-2 pr-4 py-2 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 rounded-xl transition-all border border-transparent hover:border-indigo-500/20 group ml-2"
        >
          <div className="p-1.5 bg-slate-800 group-hover:bg-indigo-500 group-hover:text-white rounded-lg transition-all transform group-active:scale-90">
            <UserPlus size={14} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Invitar_Staff</span>
        </button>
      )}
    </div>
  );
}