import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Users, Calendar, Trash2, 
  Pencil, UserPlus, Archive, LayoutGrid, 
  ArrowRight, Lock, Search, AlertTriangle,
  Zap, ChevronRight, Binary
} from 'lucide-react';

import NewProjectModal from '../components/projects/NewProjectModal';

export default function Projects() {
  const projectContext = useProjects() || {};
  const { 
    projects = [], 
    updateProjectStatus, 
    deleteProject, 
    inviteMember,
    isOwner = () => false 
  } = projectContext;
  
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Filtrado optimizado y blindado
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (!project) return false;
      const matchesStatus = showArchived 
        ? project.status === 'ARCHIVADO' 
        : project.status !== 'ARCHIVADO';
      const matchesSearch = (project.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [projects, showArchived, searchTerm]);

  const handleCreate = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project) => {
    if (!isOwner(project.owner)) {
      return alert("ACCESO DENEGADO: Solo el OWNER puede modificar el protocolo.");
    }
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Error de contexto (Elegante)
  if (!projectContext.projects && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-rose-950 rounded-[4rem] bg-rose-500/5 animate-pulse">
        <AlertTriangle size={48} className="text-rose-500 mb-6" />
        <h2 className="text-rose-500 font-black uppercase text-xs tracking-[0.5em] italic">Critical_Link_Error</h2>
        <p className="text-rose-900/60 font-bold text-[8px] uppercase tracking-widest mt-2">Reiniciando Nodo de Contexto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-1000 pb-20">
      
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-slate-800/60 pb-12 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -z-10" />
        
        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-indigo-600/10 rounded-[1.5rem] border border-indigo-500/20 shadow-2xl">
              <Binary className="text-indigo-500" size={32} />
            </div>
            <div>
              <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
                Core <span className="text-indigo-500 text-glow">Projects</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`w-2 h-2 rounded-full animate-ping ${showArchived ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.4em]">
                  {filteredProjects.length} Unidades Activas Detectadas // OS_v2.0
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES DE CONTROL */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* BUSCADOR INTEGRADO */}
          <div className="relative flex-1 md:min-w-[300px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="BUSCAR PROTOCOLO..."
              className="w-full bg-[#0a0c10] border border-slate-800/80 rounded-[1.5rem] py-5 pl-16 pr-6 text-[10px] font-black text-white uppercase outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-8 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all border flex items-center gap-3 ${
              showArchived 
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-500/5' 
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
            }`}
          >
            {showArchived ? <LayoutGrid size={16} /> : <Archive size={16} />}
            {showArchived ? 'Activos' : 'Archivo'}
          </button>

          <button 
            onClick={handleCreate}
            className="px-10 py-5 bg-white text-black rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-xl hover:bg-indigo-500 hover:text-white group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Nueva Unidad
          </button>
        </div>
      </div>

      {/* GRID DE PROTOCOLOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const userIsOwner = isOwner(project.owner);

            return (
              <div key={project.id} className="group relative bg-[#07090d] border border-slate-800/60 p-10 rounded-[3.5rem] hover:border-indigo-500/40 transition-all duration-500 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* Overlay de fondo decorativo */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                   <Zap size={120} className="text-white" />
                </div>

                {/* Status & Actions Bar */}
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <select 
                    disabled={!userIsOwner}
                    value={project.status}
                    onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                    className={`text-[8px] font-black px-5 py-2.5 rounded-full tracking-[0.2em] border-none outline-none cursor-pointer transition-all disabled:opacity-50 uppercase italic shadow-2xl ${
                      project.status === 'EN_PROGRESO' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 
                      project.status === 'COMPLETADO' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 
                      'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <option value="PLANIFICADO">PLANIFICADO</option>
                    <option value="EN_PROGRESO">EN PROGRESO</option>
                    <option value="PAUSADO">PAUSADO</option>
                    <option value="COMPLETADO">COMPLETADO</option>
                    <option value="ARCHIVADO">ARCHIVADO</option>
                  </select>

                  <div className="flex gap-2">
                    {userIsOwner ? (
                      <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                        <button onClick={() => handleEdit(project)} className="text-slate-500 hover:text-indigo-400 p-2 transition-all hover:scale-110">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteProject(project.id)} className="text-slate-500 hover:text-rose-500 p-2 transition-all hover:scale-110">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 text-slate-700" title="Solo Lectura">
                        <Lock size={14} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Title & Metadata */}
                <div className="mb-10 relative z-10">
                  <Link to={`/project/${project.id}`} className="block group/link">
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-[0.9] group-hover/link:text-indigo-400 transition-all mb-4">
                      {project.name}
                    </h3>
                  </Link>
                  <p className="text-slate-600 text-[10px] font-bold uppercase italic leading-relaxed tracking-wider line-clamp-2 min-h-[40px]">
                    {project.description || 'SIN ESPECIFICACIONES DE PROTOCOLO...'}
                  </p>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-4 mb-10 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em] italic">Efficiency_Node</span>
                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">
                      {project.progress}<span className="text-indigo-500 text-xs">%</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-[2px] border border-slate-900 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-700 via-indigo-400 to-violet-600 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Main Action */}
                <Link 
                  to={`/project/${project.id}`}
                  className="mt-auto flex items-center justify-between px-8 py-5 bg-slate-900/50 hover:bg-white text-slate-500 hover:text-black rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-slate-800 hover:border-white shadow-xl group/btn overflow-hidden relative"
                >
                  <span className="relative z-10 italic">Open_Console</span>
                  <ArrowRight size={18} className="relative z-10 group-hover/btn:translate-x-2 transition-transform" />
                </Link>

                {/* Stats Footer */}
                <div className="flex justify-between items-center pt-8 border-t border-slate-800/40 mt-10 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Users size={14} className="text-indigo-500" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase italic">{project.members?.length || 0} OPS</span>
                    </div>
                    {userIsOwner && (
                      <button onClick={() => inviteMember(project.id, prompt("EMAIL DEL NUEVO OPERATIVO:"))} className="text-slate-600 hover:text-indigo-400 transition-all hover:scale-125">
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 px-4 py-2 bg-slate-950 rounded-xl border border-slate-900">
                    <Calendar size={12} className="text-slate-700" />
                    <span className="text-[9px] font-black text-slate-600 uppercase italic">
                      {new Date(project.endDate || Date.now()).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-900 rounded-[4rem] bg-slate-950/20">
            <Archive size={64} className="mx-auto text-slate-900 mb-8 opacity-40" />
            <h3 className="text-slate-700 font-black uppercase text-xs tracking-[0.5em] italic">-- No_Protocols_Found --</h3>
            <p className="text-slate-800 text-[8px] font-bold uppercase tracking-widest mt-4">Esperando Ingesta de Datos en Nodo {showArchived ? 'ARCHIVE' : 'ACTIVE'}</p>
          </div>
        )}
      </div>

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        projectToEdit={selectedProject} 
      />
    </div>
  );
}