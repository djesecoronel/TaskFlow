import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, Moon, Sun, Shield, 
  Database, UserCog, Lock, Save, HardDrive,
  Users, UserCheck, UserX, Edit3, ShieldAlert, Cpu, Loader2,
  Terminal
} from 'lucide-react';

export default function Settings() {
  const { user, loading } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  // --- MOCK DATA DE USUARIOS ---
  const [systemUsers, setSystemUsers] = useState([
    { id: 1, email: 'admin@taskflow.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: 2, email: 'david123@gmail.com', role: 'EDITOR', status: 'ACTIVE' },
    { id: 3, email: 'invitado@gnsa.com', role: 'VIEWER', status: 'INACTIVE' },
  ]);

  // --- SUPERUSER VALIDATION ---
  const userEmail = user?.email || "";
  const isAdmin = !loading && (
    userEmail.toLowerCase().includes('admin') || 
    userEmail.toUpperCase().includes('ADASSD')
  );

  const toggleUserStatus = (id) => {
    setSystemUsers(prev => prev.map(u => 
      u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u
    ));
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="text-indigo-500 animate-spin" size={48} />
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.5em] animate-pulse ${theme.textSecondary}`}>
          Sincronizando Kernel_Core...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
      
      {/* HEADER DINÁMICO */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 gap-6 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white border-slate-100 shadow-sm'}`}>
              <SettingsIcon className="text-indigo-500 animate-[spin_8s_linear_infinite]" size={32} />
            </div>
            <h1 className={`text-6xl font-black uppercase italic tracking-tighter leading-none ${theme.textMain}`}>
              System <span className="text-indigo-500 text-glow">Core</span>
            </h1>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-2 ${theme.textSecondary}`}>
            <Cpu size={12} className="text-indigo-600" /> 
            Kernel Configuration // Privileged Access
          </p>
        </div>
        
        <div className={`px-8 py-4 rounded-[1.5rem] border flex items-center gap-4 backdrop-blur-xl transition-all ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] ${isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div className="flex flex-col">
            <span className={`text-[8px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Auth Protocol</span>
            <span className={`text-[11px] font-black uppercase tracking-tighter ${theme.textMain}`}>
              {isAdmin ? 'Root_Administrator' : 'Standard_Operator'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* PANEL IZQUIERDO: PREFERENCIAS */}
        <div className="xl:col-span-4 space-y-8">
          <section className={`border p-8 rounded-[3rem] backdrop-blur-md relative overflow-hidden group transition-all ${theme.card}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
            <h2 className={`text-xs font-black uppercase italic mb-8 flex items-center gap-3 tracking-widest ${theme.textMain}`}>
              <UserCog size={16} className="text-indigo-500" /> User Interface
            </h2>
            
            <div className="space-y-6">
              <div 
                onClick={toggleTheme}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/30' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-400" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMain}`}>Visual Mode</span>
                </div>
                <div className={`w-12 h-6 rounded-full relative p-1 transition-all ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest px-2 ${theme.textSecondary}`}>Operator ID</label>
                <div className="relative">
                  <input 
                    type="text" 
                    disabled
                    value={userEmail.toUpperCase() || 'ANONYMOUS_CORE'}
                    className={`w-full border p-4 rounded-2xl text-[10px] font-black outline-none uppercase italic transition-all ${
                      isDarkMode ? 'bg-slate-950/50 border-slate-800 text-indigo-400' : 'bg-slate-50 border-slate-200 text-indigo-600'
                    }`}
                  />
                  <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" />
                </div>
              </div>
            </div>
          </section>

          <section className={`border p-8 rounded-[3rem] transition-all ${isDarkMode ? 'bg-slate-900/10 border-slate-800/60' : 'bg-white border-slate-100 shadow-sm'}`}>
            <h2 className={`text-xs font-black uppercase italic mb-8 flex items-center gap-3 tracking-widest ${theme.textSecondary}`}>
              <HardDrive size={16} className="text-slate-600" /> Global Constants
            </h2>
            <div className="space-y-4">
              <div className={`flex justify-between items-center py-3 border-b ${isDarkMode ? 'border-slate-800/40' : 'border-slate-100'}`}>
                <span className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>Storage Cap</span>
                <span className={`text-[10px] font-black ${theme.textMain}`}>512GB_POOL</span>
              </div>
              <div className={`flex justify-between items-center py-3 border-b ${isDarkMode ? 'border-slate-800/40' : 'border-slate-100'}`}>
                <span className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>Encryption</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase">AES_256_GCM</span>
              </div>
            </div>
          </section>
        </div>

        {/* PANEL DERECHO: GESTIÓN DE USUARIOS */}
        <div className="xl:col-span-8">
          {isAdmin ? (
            <div className={`border p-10 rounded-[4rem] shadow-2xl relative overflow-hidden border-t-indigo-500/40 transition-all ${theme.card}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
                <div>
                  <h2 className={`text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4 ${theme.textMain}`}>
                    <ShieldAlert size={32} className="text-indigo-500" /> identity_manager
                  </h2>
                  <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${theme.textSecondary}`}>Control de acceso a nivel de aplicación</p>
                </div>
                <button className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
                  isDarkMode ? 'bg-white text-black hover:bg-indigo-500 hover:text-white' : 'bg-slate-900 text-white hover:bg-black'
                }`}>
                  <Terminal size={14} /> + New Operator
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                {systemUsers.map((u) => (
                  <div 
                    key={u.id} 
                    className={`flex flex-col lg:flex-row items-center justify-between p-6 rounded-[2.5rem] border transition-all group ${
                      u.status === 'ACTIVE' 
                      ? isDarkMode ? 'bg-[#0a0c10] border-slate-800/80 hover:border-indigo-500/30' : 'bg-white border-slate-100 hover:border-indigo-300 shadow-sm' 
                      : 'bg-rose-500/5 border-rose-500/10 grayscale'
                    }`}
                  >
                    <div className="flex items-center gap-6 w-full lg:w-auto">
                      <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl italic transition-all ${
                        u.status === 'ACTIVE' 
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white border border-white/10 group-hover:scale-110 shadow-xl' 
                        : 'bg-slate-900 text-slate-700'
                      }`}>
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className={`font-black text-sm uppercase tracking-tight ${theme.textMain}`}>{u.email}</p>
                          {u.id === 1 && <Shield size={12} className="text-amber-500" title="System Administrator" />}
                        </div>
                        <p className="text-[9px] font-black text-indigo-500 uppercase italic tracking-widest mt-1">
                          Role: {u.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6 lg:mt-0 w-full lg:w-auto justify-between lg:justify-end">
                      <button 
                        onClick={() => toggleUserStatus(u.id)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all border ${
                          u.status === 'ACTIVE' 
                          ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10' 
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? <UserCheck size={14}/> : <UserX size={14}/>}
                        {u.status}
                      </button>
                      <button className={`p-4 rounded-2xl transition-all border ${
                        isDarkMode ? 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-900 hover:bg-slate-100'
                      }`}>
                        <Edit3 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Decoración de fondo del panel de usuarios */}
              <div className="absolute -right-20 -bottom-20 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
                <ShieldAlert size={400} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
              </div>
            </div>
          ) : (
            <div className={`h-full min-h-[500px] border-2 border-dashed rounded-[4rem] flex flex-col items-center justify-center p-10 text-center backdrop-blur-sm transition-all ${
              isDarkMode ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="relative mb-8">
                <Lock size={64} className="text-slate-800 animate-pulse relative z-10" />
                <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full" />
              </div>
              <h3 className={`font-black uppercase italic tracking-[0.3em] text-xl mb-4 ${theme.textMain}`}>Access Restricted</h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] max-w-sm leading-loose ${theme.textSecondary}`}>
                Your current credentials [SEC_LVL_0] do not grant authorization to modify system identities. Contact Root Admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}