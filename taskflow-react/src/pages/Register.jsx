import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate(); // El "chofer" que nos llevará de vuelta

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Aquí iría la lógica de guardar en la base de datos (RF-01.1)
    console.log("Usuario registrado:", formData);

    // Simulamos un pequeño retraso para que parezca que está guardando
    alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
    
    // Redirigimos al Login
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl text-center">
        <h2 className="text-3xl font-bold mb-2 text-white tracking-tight">Crea tu cuenta</h2>
        <p className="text-slate-400 text-sm mb-8">Únete a TaskFlow y organiza tus proyectos</p>
        
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-400">Nombre Completo</label>
            <input 
              type="text" 
              required
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Ej. Juan Pérez"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-400">Correo Electrónico</label>
            <input 
              type="email" 
              required
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="correo@ejemplo.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-400">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-emerald-500/20">
            Registrarse
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}