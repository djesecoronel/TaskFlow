import { useState, useEffect } from 'react';
import { X, Layout, Calendar, AlignLeft } from 'lucide-react'; // Iconos para consistencia visual
import { useProjects } from '../../context/ProjectContext';

export default function NewProjectModal({ isOpen, onClose, projectToEdit }) {
  const { addProject, updateProject } = useProjects();
  
  const initialState = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'PLANIFICADO'
  };

  const [formData, setFormData] = useState(initialState);

  // Efecto para cargar datos (Mantiene la integridad de los datos no editables)
  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        name: projectToEdit.name,
        description: projectToEdit.description,
        startDate: projectToEdit.startDate,
        endDate: projectToEdit.endDate,
        status: projectToEdit.status
      });
    } else {
      setFormData(initialState);
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectToEdit) {
      // Al editar, enviamos solo los campos modificables pero conservando el resto en el contexto
      updateProject(projectToEdit.id, formData);
    } else {
      // Al crear, el ProjectContext se encarga de asignar el owner y los boards
      addProject(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER DEL MODAL */}
        <div className="flex justify-between items-center p-8 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
              {projectToEdit ? 'Modificar Protocolo' : 'Nueva Unidad Operacional'}
            </h2>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">
              {projectToEdit ? 'RF-02.2: Gestión de Cambios' : 'RF-02.1: Registro de Sistema'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Nombre del Proyecto */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Layout size={12} className="text-indigo-500" />
              Identificador del Proyecto
            </label>
            <input 
              required
              placeholder="EJ: SISTEMA DE INVENTARIOS..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <AlignLeft size={12} className="text-indigo-500" />
              Descripción Ejecutiva
            </label>
            <textarea 
              required
              placeholder="DETALLES DEL ALCANCE Y OBJETIVOS..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 outline-none focus:border-indigo-500/50 transition-all h-28 resize-none placeholder:text-slate-700"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Calendar size={12} className="text-indigo-500" />
                Despliegue
              </label>
              <input 
                type="date" required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Calendar size={12} className="text-rose-500" />
                Finalización
              </label>
              <input 
                type="date" required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          {/* Botón de Acción */}
          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl mt-4 transition-all active:scale-95 shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
          >
            {projectToEdit ? 'Actualizar Registro' : 'Lanzar Proyecto'}
          </button>
        </form>
      </div>
    </div>
  );
}