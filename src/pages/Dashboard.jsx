import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, Clock, BarChart3, 
  ArrowUpRight, Search, Zap, ExternalLink, Undo2,
  Activity, Target, Layers
} from 'lucide-react';

export default function Dashboard() {
  const projectContext = useProjects() || {};
  const { 
    projects = [], 
    undoLastAction, 
    historyLength = 0 
  } = projectContext;

  const { user } = useAuth();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (historyLength > 0 && typeof undoLastAction === 'function') {
          undoLastAction();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [undoLastAction, historyLength]);

  const searchResults = globalSearch.length > 1 
    ? projects.flatMap(p => 
        (p.tasks || [])
          .filter(t => 
            t.title?.toLowerCase().includes(globalSearch.toLowerCase()) ||
            t.description?.toLowerCase().includes(globalSearch.toLowerCase())
          )
          .map(t => ({ ...t, projectName: p.name, projectId: p.id }))
      ).slice(0, 5) 
    : [];

  const handleJumpToTask = (projectId, taskId) => {
    navigate(`/project/${projectId}?focus=${taskId}`);
  };

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.progress === 100).length;
  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* HEADER DE BIENVENIDA: CORE_COMMAND */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/60 pb-10 transition-colors duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                <Activity size={20} className="text-indigo-600 dark:text-indigo-500" />
             </div>
             {/* Cambio de Nombre a CORE_COMMAND */}
             <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter transition-colors">
                CORE_<span className="text-indigo-600 dark:text-indigo-500">COMMAND</span>
             </h1>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3 pl-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            STATUS: OPERATIVO // BIENVENIDO, {user?.email?.split('@')[0] || 'USER_UNK'}
          </p>
        </div>

        {historyLength > 0 && (
          <button 
            onClick={() => undoLastAction?.()}
            className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-2xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-md dark:shadow-[0_0_20px_rgba(99,102,241,0.1)] active:scale-95 group"
          >
            <Undo2 size={14} className="group-hover:-rotate-45 transition-transform" />
            Recuperar Sistema (Ctrl+Z)
          </button>
        )}
      </div>

      {/* SEARCH ENGINE: bg-white puro en modo claro */}
      <div className="relative max-w-3xl group mx-auto xl:mx-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2rem] blur opacity-5 group-hover:opacity-15 transition duration-1000"></div>
        <div className="relative bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-[1.8rem] p-1.5 flex items-center gap-4 backdrop-blur-xl group-hover:border-indigo-500/30 transition-all">
          <div className="pl-5 text-indigo-500/50">
            <Search size={22} />
          </div>
          <input 
            type="text"
            placeholder="ESCANEAR RED DE TAREAS..."
            className="flex-1 bg-transparent border-none outline-none text-[11px] font-black uppercase italic text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 py-4 tracking-[0.2em]"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch('')} className="pr-5 text-slate-400 hover:text-rose-500 transition-colors">
              <Zap size={18} className="fill-current" />
            </button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden z-50 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-[0.3em]">Coincidencias en Tiempo Real</span>
            </div>
            {searchResults.map(task => (
              <button 
                key={task.id}
                onClick={() => handleJumpToTask(task.projectId, task.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-all border-b border-slate-50 dark:border-slate-900/50 group/item text-left"
              >
                <div>
                  <h4 className="text-slate-900 dark:text-white text-xs font-black uppercase italic group-hover/item:text-indigo-600 transition-colors tracking-tight">
                    {task.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase mt-1 tracking-widest">
                    Unidad: <span className="text-slate-600 dark:text-slate-400">{task.projectName}</span>
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 group-hover/item:bg-indigo-600 transition-colors">
                  <ExternalLink size={14} className="text-slate-400 group-hover/item:text-white" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GRID DE ESTADÍSTICAS: bg-white en luz */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Layers size={20} />} 
          label="Unidades Activas" 
          value={totalProjects} 
          sub="Proyectos"
          color="indigo"
        />
        <StatCard 
          icon={<Target size={20} />} 
          label="Objetivos Logrados" 
          value={completedProjects} 
          sub="Finalizados"
          color="emerald"
        />
        <StatCard 
          icon={<Activity size={20} />} 
          label="Carga de Datos" 
          value={totalTasks} 
          sub="Tareas Totales"
          color="amber"
        />
      </div>

      {/* PERFORMANCE FEED: bg-white en light mode */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-[3rem] p-10 shadow-xl dark:shadow-none relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] dark:opacity-5 pointer-events-none">
            <BarChart3 size={120} className="text-slate-900 dark:text-white" />
        </div>
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
              <BarChart3 size={24} className="text-indigo-600 dark:text-indigo-500" />
              Análisis de Rendimiento
            </h2>
            <p className="text-[8px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.4em]">Monitorización de Sincronización Global</p>
          </div>
        </div>

        <div className="grid gap-4 relative z-10">
          {projects.length > 0 ? (
            projects.map(project => (
              <Link 
                key={project.id} 
                to={`/project/${project.id}`}
                className="group bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 p-6 rounded-[2.2rem] hover:bg-white dark:hover:bg-slate-900/60 transition-all flex flex-col md:flex-row md:items-center gap-8 hover:border-indigo-500/40 hover:shadow-xl dark:hover:shadow-none"
              >
                <div className="flex-grow space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full group-hover:h-8 transition-all"></div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">
                         {project.name}
                        </h3>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase bg-white dark:bg-black px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50 group-hover:border-indigo-500/20 transition-colors">
                      {project.status || 'STABLE'}
                    </span>
                  </div>
                  
                  <div className="relative w-full h-1.5 bg-slate-200 dark:bg-black rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-violet-400 transition-all duration-1000 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 min-w-[120px] justify-end">
                  <span className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    {project.progress}%
                  </span>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-transparent rounded-2xl group-hover:bg-indigo-600 transition-all group-hover:rotate-45 shadow-sm">
                    <ArrowUpRight className="text-slate-400 group-hover:text-white" size={20} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-slate-100 dark:border-slate-800/40 rounded-[3rem]">
              <p className="text-slate-300 dark:text-slate-800 font-black uppercase text-[11px] tracking-[0.6em] italic animate-pulse">
                -- NINGUNA UNIDAD DETECTADA EN EL CORE --
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const colorMap = {
    indigo: {
      border: "group-hover:border-indigo-500/50",
      text: "text-indigo-600 dark:text-indigo-500",
      iconBg: "bg-indigo-50 dark:bg-indigo-500/10"
    },
    emerald: {
      border: "group-hover:border-emerald-500/50",
      text: "text-emerald-600 dark:text-emerald-500",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    amber: {
      border: "group-hover:border-amber-500/50",
      text: "text-amber-600 dark:text-amber-500",
      iconBg: "bg-amber-50 dark:bg-amber-500/10"
    },
  };

  const currentStyle = colorMap[color];

  return (
    <div className={`bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 p-8 rounded-[2.5rem] transition-all duration-500 group shadow-lg dark:shadow-none relative overflow-hidden ${currentStyle.border}`}>
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700 ${currentStyle.text}`}>
         {icon}
      </div>
      <div className="flex items-center gap-5 mb-6 relative z-10">
        <div className={`p-4 ${currentStyle.iconBg} rounded-[1.2rem] border border-slate-100 dark:border-slate-800 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm dark:shadow-none ${currentStyle.text}`}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{label}</span>
      </div>
      <div className="flex items-baseline gap-3 relative z-10">
        <span className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter group-hover:translate-x-1 transition-transform">{value}</span>
        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase italic tracking-widest">{sub}</span>
      </div>
    </div>
  );
}