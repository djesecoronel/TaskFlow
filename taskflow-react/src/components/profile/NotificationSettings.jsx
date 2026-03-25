import { Bell, Mail, Smartphone, ShieldCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationSettings() {
  const { preferences, setPreferences } = useNotifications();

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 max-w-2xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
          <Bell size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Canales de Comunicación</h2>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Configuración de Protocolos RF-05.3</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Opción: In-App (Push) */}
        <div 
          onClick={() => togglePreference('inApp')}
          className={`group flex items-center justify-between p-6 rounded-[2rem] border transition-all cursor-pointer ${
            preferences.inApp 
              ? 'bg-indigo-500/5 border-indigo-500/50' 
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl transition-all ${preferences.inApp ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-900 text-slate-600'}`}>
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">Notificaciones In-App</h3>
              <p className="text-[10px] text-slate-500 font-medium">Alertas en tiempo real dentro de la plataforma.</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-all ${preferences.inApp ? 'bg-indigo-600' : 'bg-slate-800'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.inApp ? 'left-7' : 'left-1'}`} />
          </div>
        </div>

        {/* Opción: Email */}
        <div 
          onClick={() => togglePreference('email')}
          className={`group flex items-center justify-between p-6 rounded-[2rem] border transition-all cursor-pointer ${
            preferences.email 
              ? 'bg-emerald-500/5 border-emerald-500/50' 
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl transition-all ${preferences.email ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-slate-600'}`}>
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">Resumen por Email</h3>
              <p className="text-[10px] text-slate-500 font-medium">Envío de reportes y cambios críticos a tu correo.</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-all ${preferences.email ? 'bg-emerald-600' : 'bg-slate-800'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.email ? 'left-7' : 'left-1'}`} />
          </div>
        </div>
      </div>

      <div className="mt-10 p-6 bg-slate-950/50 rounded-[2rem] border border-slate-800 flex items-center gap-4">
        <ShieldCheck className="text-indigo-400" size={20} />
        <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
          Tus preferencias se sincronizan automáticamente con el motor de notificaciones local.
        </p>
      </div>
    </div>
  );
}