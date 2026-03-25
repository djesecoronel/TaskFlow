import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <--- FALTABA AGREGAR "Link" AQUÍ
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // RF-01.2 y RF-01.3: Login simulado con rol ADMIN por defecto
    login(email, "ADMIN"); 
    
    // Navegamos a la página de perfil
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-white tracking-tight">TaskFlow</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300 text-left">Correo Electrónico</label>
            <input 
              type="email" 
              required
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300 text-left">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95"
          >
            Iniciar Sesión
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-indigo-400 font-bold hover:underline transition-all">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}