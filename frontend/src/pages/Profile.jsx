import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  if (!user) return null;

  const handleSave = () => {
    updateProfile({ name: newName });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800">
        
        {/* Avatar con simulación de cambio de foto */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden border-4 border-slate-800">
              {user.avatar ? <img src={user.avatar} alt="avatar" /> : user.name.charAt(0)}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white font-bold">Cambiar</span>
            </div>
          </div>
          <p className="mt-2 text-indigo-400 font-bold text-sm tracking-widest uppercase">{user.role}</p>
        </div>

        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <input 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nuevo nombre"
              />
              <button onClick={handleSave} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">
                Guardar Cambios
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-6">{user.name}</h1>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-all"
              >
                Editar Perfil
              </button>
            </div>
          )}

          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Registro de actividad</p>
            <p className="text-slate-400 text-xs font-mono">Último acceso: {user.lastAccess}</p>
          </div>

          <button onClick={logout} className="w-full py-3 text-red-500 text-sm font-bold hover:underline">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}