import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { 
  Plus, Users, Calendar, Trash2, 
  Pencil, UserPlus, Archive, LayoutGrid, 
  ArrowRight, Lock, Search, AlertTriangle,
  Zap, ChevronRight, Binary, Cpu
} from 'lucide-react';

import NewProjectModal from '../components/projects/NewProjectModal';

export default function Projects() {
  const projectContext = useProjects() || {};
  const { 
    projects = [], 
    updateProjectStatus, 
    deleteProject, 
    inviteMember,
    addProject, // Importante para la inicialización
    isOwner = () => false 
  } = projectContext;
  
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // --- PROTOCOLO DE INICIALIZACIÓN FORZADA ---
  const initializeMasterNode = () => {
    const masterProject = {
      name: "NODO_MAESTRO_ALPHA",
      description: "Protocolo principal de gestión de tareas sincronizado con Supabase.",
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      members: [user?.email]
    };
    addProject(masterProject);
  };

  const filteredProjects = useMemo(() => {
    return (projects || []).filter(project => {
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

  if (projectContext.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
         <Cpu size={48} className="text-indigo-500 animate-spin mb-6" />
         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Sincronizando con Nodo Central...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-1000 pb-20">
      
      {/* HEADER DE COMANDO */}
      <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b pb-12 relative overflow-hidden ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
        <div className={`absolute -top-10 -left-10 w-64 h-64 blur-[100px] rounded-full -z-10 ${isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-500/10'}`} />
        
        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-[1.5rem] border shadow-2xl ${isDarkMode ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-white border-slate-100 shadow-sm'}`}>
              <Binary className="text-indigo-500" size={32} />
            </div>
            <div>
              <h1 className={`text-6xl font-black uppercase italic tracking-tighter leading-none ${theme.textMain}`}>
                Core <span className="text-indigo-500 text-glow">Projects</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`w-2 h-2 rounded-full animate-ping ${showArchived ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <p className={`font-black text-[9px] uppercase tracking-[0.4em] ${theme.textSecondary}`}>
                  {filteredProjects.length} Unidades Activas Detectadas // OS_v2.0
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES DE CONTROL */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="relative flex-1 md:min-w-[300px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="BUSCAR PROTOCOLO..."
              className={`w-full border rounded-[1.5rem] py-5 pl-16 pr-6 text-[10px] font-black uppercase outline-none focus:border-indigo-500 transition-all ${
                isDarkMode 
                ? 'bg-[#0a0c10] border-slate-800/80 text-white placeholder:text-slate-800' 
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-8 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all border flex items-center gap-3 ${
              showArchived 
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-500/5' 
              : isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm'
            }`}
          >
            {showArchived ? <LayoutGrid size={16} /> : <Archive size={16} />}
            {showArchived ? 'Activos' : 'Archivo'}
          </button>

          <button 
            onClick={handleCreate}
            className={`px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-xl group ${
              isDarkMode 
              ? 'bg-white text-black hover:bg-indigo-500 hover:text-white' 
              : 'bg-slate-900 text-white hover:bg-black'
            }`}
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
              <div key={project.id} className={`group relative border p-10 rounded-[3.5rem] transition-all duration-500 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden ${
                isDarkMode 
                ? 'bg-[#07090d] border-slate-800/60 hover:border-indigo-500/40 shadow-black/50' 
                : 'bg-white border-slate-100 hover:border-indigo-300 shadow-slate-200'
              }`}>
                
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                   <Zap size={120} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
                </div>

                <div className="flex justify-between items-start mb-12 relative z-10">
                  <select 
                    disabled={!userIsOwner}
                    value={project.status}
                    onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                    className={`text-[8px] font-black px-5 py-2.5 rounded-full tracking-[0.2em] border-none outline-none cursor-pointer transition-all disabled:opacity-50 uppercase italic shadow-2xl ${
                      project.status === 'EN_PROGRESO' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 
                      project.status === 'COMPLETADO' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 
                      isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
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
                      <div className={`flex gap-2 p-1.5 rounded-2xl border backdrop-blur-md ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <button onClick={() => handleEdit(project)} className="text-slate-500 hover:text-indigo-400 p-2 transition-all hover:scale-110">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteProject(project.id)} className="text-slate-500 hover:text-rose-500 p-2 transition-all hover:scale-110">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-white/5 text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`} title="Solo Lectura">
                        <Lock size={14} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-10 relative z-10">
                  <Link to={`/project/${project.id}`} className="block group/link">
                    <h3 className={`text-3xl font-black uppercase italic tracking-tighter leading-[0.9] group-hover/link:text-indigo-400 transition-all mb-4 ${theme.textMain}`}>
                      {project.name}
                    </h3>
                  </Link>
                  <p className={`text-[10px] font-bold uppercase italic leading-relaxed tracking-wider line-clamp-2 min-h-[40px] ${theme.textSecondary}`}>
                    {project.description || 'SIN ESPECIFICACIONES DE PROTOCOLO...'}
                  </p>
                </div>

                <div className="space-y-4 mb-10 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] italic ${theme.textSecondary}`}>Efficiency_Node</span>
                    <span className={`text-2xl font-black italic tracking-tighter leading-none ${theme.textMain}`}>
                      {project.progress}<span className="text-indigo-500 text-xs">%</span>
                    </span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden p-[2px] border shadow-inner ${isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-700 via-indigo-400 to-violet-600 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <Link 
                  to={`/project/${project.id}`}
                  className={`mt-auto flex items-center justify-between px-8 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all border shadow-xl group/btn overflow-hidden relative ${
                    isDarkMode 
                    ? 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-black hover:bg-white hover:border-white' 
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-900'
                  }`}
                >
                  <span className="relative z-10 italic">Open_Console</span>
                  <ArrowRight size={18} className="relative z-10 group-hover/btn:translate-x-2 transition-transform" />
                </Link>

                <div className={`flex justify-between items-center pt-8 border-t mt-10 relative z-10 ${isDarkMode ? 'border-slate-800/40' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                        <Users size={14} className="text-indigo-500" />
                      </div>
                      <span className={`text-[10px] font-black uppercase italic ${theme.textSecondary}`}>{project.members?.length || 0} OPS</span>
                    </div>
                    {userIsOwner && (
                      <button onClick={() => inviteMember(project.id, prompt("EMAIL DEL NUEVO OPERATIVO:"))} className="text-slate-600 hover:text-indigo-400 transition-all hover:scale-125">
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-100'}`}>
                    <Calendar size={12} className="text-slate-700" />
                    <span className={`text-[9px] font-black uppercase italic ${theme.textSecondary}`}>
                      {new Date(project.endDate || Date.now()).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`col-span-full py-40 text-center border-2 border-dashed rounded-[4rem] flex flex-col items-center justify-center ${isDarkMode ? 'border-slate-900 bg-slate-950/20' : 'border-slate-200 bg-slate-50/50'}`}>
            <Archive size={64} className="text-slate-900 mb-8 opacity-40" />
            <h3 className={`font-black uppercase text-xs tracking-[0.5em] italic ${theme.textSecondary}`}>-- No_Protocols_Found --</h3>
            <p className={`text-[8px] font-bold uppercase tracking-widest mt-4 mb-10 ${theme.textSecondary}`}>Esperando Ingesta de Datos en Nodo {showArchived ? 'ARCHIVE' : 'ACTIVE'}</p>
            
            <button 
                onClick={initializeMasterNode}
                className="flex items-center gap-4 px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase italic text-[10px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 group"
            >
                <Zap size={20} className="group-hover:animate-pulse fill-current" />
                Inicializar Nodo Maestro Alpha
            </button>
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