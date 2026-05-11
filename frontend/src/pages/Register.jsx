import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; 
import { useAuth } from '../context/AuthContext'; // <--- INYECTAMOS EL MOTOR DE AUTH
import { UserPlus, Mail, Lock, User, ChevronLeft, ShieldCheck, Sparkles } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false); // Estado de carga para el botón
  const { theme, isDarkMode } = useTheme(); 
  const { register } = useAuth(); // <--- CONSUMIMOS LA FUNCIÓN REAL
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log("%c 🧬 [REGISTER_PROTOCOL]: Iniciando despliegue de credenciales... ", "color: #10b981; font-weight: bold;");

    try {
      // LLAMADA AL NODO CENTRAL (PROTOCOLO REAL)
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      // Si el registro es exitoso, el AuthContext nos loguea automáticamente
      console.log("%c ✅ [REGISTER_SUCCESS]: Operativo sincronizado. Redirigiendo al Dashboard... ", "color: #10b981; font-weight: bold;");
      navigate('/dashboard'); // O a la ruta principal que uses

    } catch (error) {
      console.error("❌ [REGISTER_FAILED]: Fallo en la secuencia de alta.", error);
      alert(error.response?.data?.message || "ERROR_PROTOCOL: No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* DECORACIÓN DE FONDO ALPHA */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      <div className={`max-w-md w-full p-10 rounded-[3rem] border shadow-2xl transition-all duration-500 ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-black/50' : 'bg-white border-slate-100 shadow-slate-200'
      }`}>
        
        {/* HEADER DE REGISTRO */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-2">
            <UserPlus className="text-white" size={32} />
          </div>
          <h2 className={`text-3xl font-black uppercase italic tracking-tighter ${theme.textMain}`}>
            New <span className="text-emerald-500">Operator</span>
          </h2>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme.textSecondary}`}>
            Provisioning_System // TaskFlow
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* CAMPO NOMBRE */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ml-2 ${theme.textSecondary}`}>Full_Identity</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="text" 
                required
                placeholder="Ej. Juan Pérez"
                disabled={loading}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-bold text-sm ${
                  isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5'
                }`}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          {/* CAMPO EMAIL */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ml-2 ${theme.textSecondary}`}>Core_Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="email" 
                required
                placeholder="correo@ejemplo.com"
                disabled={loading}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-bold text-sm ${
                  isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5'
                }`}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* CAMPO PASSWORD */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ml-2 ${theme.textSecondary}`}>Security_Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                disabled={loading}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-bold text-sm ${
                  isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5'
                }`}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full group flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode 
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            <Sparkles size={18} className={loading ? "animate-spin" : "animate-pulse"} />
            {loading ? 'Sincronizando...' : 'Initialize_Account'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-800/30 text-center">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-emerald-500 font-black hover:text-emerald-400 transition-colors ml-2 underline decoration-2 underline-offset-4 flex items-center justify-center gap-2 mt-2">
              <ChevronLeft size={14} /> Back to Login
            </Link>
          </p>
        </div>

        {/* SECURITY BADGE */}
        <div className="flex justify-center items-center gap-2 opacity-30 mt-4">
          <ShieldCheck size={12} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
          <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${theme.textSecondary}`}>Privacy Protocol 1.1 Enabled</span>
        </div>
      </div>
    </div>
  );
}