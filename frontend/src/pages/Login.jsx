import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, ChevronRight, Cpu, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // CONEXIÓN AL NODO: Enviamos las credenciales reales al AuthContext
      console.log("KERNEL_AUTH: Iniciando secuencia de autenticación...");
      await login({ email, password });
      
      // Si el servidor responde 200, procedemos al sector de perfil
      navigate('/profile');
    } catch (err) {
      // Capturamos el 401 o cualquier fallo de red
      setError("ACCESO_DENEGADO: Credenciales no reconocidas por el núcleo.");
      console.error("AUTH_ERROR: Fallo en el protocolo de enlace.");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* DECORACIÓN DE FONDO ALPHA */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className={`max-w-md w-full p-10 rounded-[3rem] border shadow-2xl transition-all duration-500 transform hover:scale-[1.01] ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-black/50' : 'bg-white border-slate-100 shadow-slate-200'
      }`}>
        
        {/* LOGO & HEADER */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.3)] mb-4">
            <Cpu className="text-white" size={32} />
          </div>
          <h2 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme.textMain}`}>
            Task<span className="text-indigo-500">Flow</span>
          </h2>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme.textSecondary}`}>
            Access Protocol // OS_v2.0
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* MENSAJE DE ERROR CRÍTICO */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-shake">
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
            </div>
          )}

          {/* CAMPO EMAIL */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ml-2 ${theme.textSecondary}`}>Core_Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="email" 
                required
                placeholder="operator@taskflow.com"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-bold text-sm ${
                  isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5'
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* CAMPO PASSWORD */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ml-2 ${theme.textSecondary}`}>Security_Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-bold text-sm ${
                  isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`w-full group flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl ${
              isDarkMode 
              ? 'bg-white text-black hover:bg-indigo-500 hover:text-white shadow-white/5' 
              : 'bg-slate-900 text-white hover:bg-black'
            }`}
          >
            Authenticate_Node
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-8 pt-8 border-t border-slate-800/30 text-center">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-indigo-500 font-black hover:text-indigo-400 transition-colors ml-2 underline decoration-2 underline-offset-4">
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* SECURITY BADGE */}
          <div className="flex justify-center items-center gap-2 opacity-30 mt-4">
            <ShieldCheck size={12} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
            <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${theme.textSecondary}`}>End-to-End Encryption Active</span>
          </div>
        </form>
      </div>
    </div>
  );
}