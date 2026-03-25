import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, Moon, Sun, Shield, 
  Database, UserCog, Lock, Save, HardDrive,
  Users, UserCheck, UserX, Edit3, ShieldAlert, Cpu, Loader2
} from 'lucide-react';

export default function Settings() {
  const { user, loading } = useAuth();
  const [theme, setTheme] = useState('dark');

  // --- MOCK DATA DE USUARIOS (RF-09.1) ---
  const [systemUsers, setSystemUsers] = useState([
    { id: 1, email: 'admin@taskflow.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: 2, email: 'david123@gmail.com', role: 'EDITOR', status: 'ACTIVE' },
    { id: 3, email: 'invitado@gnsa.com', role: 'VIEWER', status: 'INACTIVE' },
  ]);

  // --- SUPERUSER VALIDATION (ULTRA-SAFE) ---
  // Blindaje para evitar el error "toLowerCase of undefined"
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

  // --- KERNEL LOADING STATE ---
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="text-indigo-500 animate-spin" size={48} />
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">
          Sincronizando Kernel_Core...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
      
      {/* HEADER DINÁMICO DE ALTO NIVEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-10 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <SettingsIcon className="text-indigo-500 animate-spin-slow" size={32} />
            </div>
            <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter">
              System <span className="text-indigo-500">Core</span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] flex items-center gap-2">
            <Cpu size={12} className="text-indigo-600" /> 
            Kernel Configuration / Privileged Access
          </p>
        </div>
        
        <div className="bg-slate-900/40 px-8 py-4 rounded-[1.5rem] border border-slate-800 flex items-center gap-4 backdrop-blur-xl">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] ${isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Auth Protocol</span>
            <span className="text-[11px] font-black text-white uppercase tracking-tighter">
              {isAdmin ? 'Root_Administrator' : 'Standard_Operator'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* PANEL IZQUIERDO: PREFERENCIAS (RF-09.2) */}
        <div className="xl:col-span-4 space-y-8">
          <section className="bg-slate-900/40 border border-slate-800 p-8 rounded-[3rem] backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
            <h2 className="text-xs font-black text-white uppercase italic mb-8 flex items-center gap-3 tracking-widest">
              <UserCog size={16} className="text-indigo-500" /> User Interface
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-400" />}
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Visual Mode</span>
                </div>
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-12 h-6 bg-slate-800 rounded-full relative p-1 transition-all"
                >
                  <div className={`w-4 h-4 bg-indigo-500 rounded-full shadow-lg transition-all ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">Operator ID</label>
                <div className="relative">
                  <input 
                    type="text" 
                    disabled
                    value={userEmail.toUpperCase() || 'ANONYMOUS_CORE'}
                    className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-[10px] font-black text-indigo-400 outline-none uppercase italic"
                  />
                  <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" />
                </div>
              </div>
            </div>
          </section>

          {/* PARÁMETROS GLOBALES (RF-09.3) */}
          <section className="bg-slate-900/10 border border-slate-800/60 p-8 rounded-[3rem]">
            <h2 className="text-xs font-black text-slate-400 uppercase italic mb-8 flex items-center gap-3 tracking-widest">
              <HardDrive size={16} className="text-slate-600" /> Global Constants
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-800/40">
                <span className="text-[9px] font-black text-slate-600 uppercase">Storage Cap</span>
                <span className="text-[10px] font-black text-white">512GB_POOL</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800/40">
                <span className="text-[9px] font-black text-slate-600 uppercase">Encryption</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase">AES_256_GCM</span>
              </div>
            </div>
          </section>
        </div>

        {/* PANEL DERECHO: GESTIÓN DE USUARIOS (RF-09.1) */}
        <div className="xl:col-span-8">
          {isAdmin ? (
            <div className="bg-slate-950 border border-slate-800 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden border-t-indigo-500/40">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                    <ShieldAlert size={32} className="text-indigo-500" /> identity_manager
                  </h2>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Control de acceso a nivel de aplicación</p>
                </div>
                <button className="px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">
                  + New Operator
                </button>
              </div>

              <div className="space-y-4">
                {systemUsers.map((u) => (
                  <div 
                    key={u.id} 
                    className={`flex flex-col lg:flex-row items-center justify-between p-6 rounded-[2.5rem] border transition-all group ${
                      u.status === 'ACTIVE' 
                      ? 'bg-slate-900/20 border-slate-800 hover:border-slate-600' 
                      : 'bg-rose-500/5 border-rose-500/10 grayscale'
                    }`}
                  >
                    <div className="flex items-center gap-6 w-full lg:w-auto">
                      <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl italic transition-all ${
                        u.status === 'ACTIVE' 
                        ? 'bg-gradient-to-br from-slate-800 to-slate-950 text-indigo-500 border border-slate-700 group-hover:scale-110 shadow-xl' 
                        : 'bg-slate-900 text-slate-700'
                      }`}>
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-white font-black text-sm uppercase tracking-tight">{u.email}</p>
                          {u.id === 1 && <Shield size={12} className="text-amber-500" />}
                        </div>
                        <p className="text-[9px] font-black text-indigo-500/60 uppercase italic tracking-widest mt-1">
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
                      <button className="p-4 bg-slate-900 text-slate-500 rounded-2xl hover:text-white hover:bg-slate-800 transition-all border border-slate-800">
                        <Edit3 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-900 rounded-[4rem] flex flex-col items-center justify-center p-10 text-center bg-slate-950/40 backdrop-blur-sm">
              <div className="relative mb-8">
                <Lock size={64} className="text-slate-800 animate-pulse" />
                <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full" />
              </div>
              <h3 className="text-white font-black uppercase italic tracking-[0.3em] text-xl mb-4">Access Restricted</h3>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] max-w-sm leading-loose">
                Your current credentials [SEC_LVL_0] do not grant authorization to modify system identities. Contact Root Admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}