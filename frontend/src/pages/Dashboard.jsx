import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  CheckCircle2, Clock, BarChart3, 
  ArrowUpRight, Search, Zap, ExternalLink, Undo2,
  Activity, Target, Layers, Terminal
} from 'lucide-react';

export default function Dashboard() {
  const projectContext = useProjects() || {};
  const { 
    projects = [], 
    undoLastAction, 
    historyLength = 0 
  } = projectContext;

  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
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
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      
      {/* HEADER DE BIENVENIDA: CORE_COMMAND */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-8 border-b pb-12 transition-colors duration-500 ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-2xl border shadow-2xl transition-all ${isDarkMode ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-white border-slate-100 shadow-xl'}`}>
                <Activity size={24} className="text-indigo-500 animate-pulse" />
             </div>
             <div>
               <h1 className={`text-6xl font-black uppercase italic tracking-tighter leading-none transition-colors ${theme.textMain}`}>
                 CORE_<span className="text-indigo-500 text-glow">COMMAND</span>
               </h1>
               <div className={`flex items-center gap-3 mt-2 font-black text-[9px] uppercase tracking-[0.4em] ${theme.textSecondary}`}>
                 <Terminal size={12} className="text-indigo-600" /> STATUS: OPERATIVO // USER: {user?.email?.split('@')[0] || 'UNK_ID'}
               </div>
             </div>
          </div>
        </div>

        {historyLength > 0 && (
          <button 
            onClick={() => undoLastAction?.()}
            className={`flex items-center gap-4 px-8 py-4 border rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group ${
              isDarkMode 
                ? 'bg-white text-black border-transparent hover:bg-indigo-500 hover:text-white' 
                : 'bg-slate-900 text-white border-transparent hover:bg-black'
            }`}
          >
            <Undo2 size={16} className="group-hover:-rotate-90 transition-transform" />
            REVERTIR_ULTIMA_ACCION (Ctrl+Z)
          </button>
        )}
      </div>

      {/* SEARCH SCANNER */}
      <div className="relative max-w-4xl mx-auto xl:mx-0 group">
        <div className={`absolute -inset-2 bg-indigo-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700`}></div>
        <div className={`relative border rounded-[2rem] p-2 flex items-center gap-4 backdrop-blur-3xl transition-all duration-500 ${theme.card} ${isDarkMode ? 'border-slate-800 focus-within:border-indigo-500/50' : 'border-slate-200 focus-within:border-indigo-500/50'}`}>
          <div className="pl-6 text-indigo-500">
            <Search size={24} strokeWidth={3} />
          </div>
          <input 
            type="text"
            placeholder="ESCANEAR RED DE DATOS Y TAREAS..."
            className={`flex-1 bg-transparent border-none outline-none text-xs font-black uppercase italic py-5 tracking-[0.3em] placeholder:text-slate-500 ${theme.textMain}`}
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch('')} className="pr-6 text-rose-500 hover:scale-125 transition-transform">
              <Zap size={20} className="fill-current" />
            </button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-6 border rounded-[2.5rem] overflow-hidden z-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 duration-300 ${theme.card}`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-black/40' : 'border-slate-100 bg-slate-50/80'}`}>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500">Resultados de Escaneo</span>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>LOCAL_CACHE</span>
            </div>
            {searchResults.map(task => (
              <button 
                key={task.id}
                onClick={() => handleJumpToTask(task.projectId, task.id)}
                className={`w-full flex items-center justify-between p-7 transition-all border-b last:border-none group/item ${
                    isDarkMode ? 'hover:bg-indigo-500/10 border-slate-900/50' : 'hover:bg-slate-100/50 border-slate-50'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-2 h-10 rounded-full transition-all group-hover/item:h-12 ${isDarkMode ? 'bg-slate-800 group-hover/item:bg-indigo-500' : 'bg-slate-200 group-hover/item:bg-indigo-600'}`}></div>
                  <div>
                    <h4 className={`text-sm font-black uppercase italic tracking-tighter ${theme.textMain}`}>
                      {task.title}
                    </h4>
                    <p className={`text-[8px] font-bold uppercase mt-1 tracking-widest ${theme.textSecondary}`}>
                      Sector_Asignado: <span className="text-indigo-500">{task.projectName}</span>
                    </p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-slate-500 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* METRIC SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard icon={<Layers size={24} />} label="Unidades_Activas" value={totalProjects} sub="Nodos de Proyecto" color="indigo" theme={theme} isDarkMode={isDarkMode} />
        <StatCard icon={<Target size={24} />} label="Objetivos_Logrados" value={completedProjects} sub="Sincronización 100%" color="emerald" theme={theme} isDarkMode={isDarkMode} />
        <StatCard icon={<Activity size={24} />} label="Carga_de_Datos" value={totalTasks} sub="Registros de Tarea" color="amber" theme={theme} isDarkMode={isDarkMode} />
      </div>

      {/* PERFORMANCE ANALYSIS */}
      <div className={`border rounded-[3.5rem] p-12 relative overflow-hidden transition-all duration-700 ${theme.card} ${!isDarkMode && 'shadow-2xl'}`}>
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-10 pointer-events-none rotate-12">
            <BarChart3 size={180} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
        </div>
        
        <div className="flex justify-between items-center mb-12 relative z-10">
          <div className="space-y-2">
            <h2 className={`text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4 ${theme.textMain}`}>
              <BarChart3 size={32} className="text-indigo-500" />
              Análisis_Rendimiento
            </h2>
            <p className={`text-[9px] font-black uppercase tracking-[0.5em] ${theme.textSecondary}`}>Monitor_Sincronización_Nodal_v4.0</p>
          </div>
        </div>

        <div className="grid gap-6 relative z-10">
          {projects.length > 0 ? (
            projects.map(project => (
              <Link 
                key={project.id} 
                to={`/project/${project.id}`}
                className={`group border p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col md:flex-row md:items-center gap-10 ${
                    isDarkMode 
                    ? 'bg-black/40 border-slate-800/40 hover:bg-indigo-500/5 hover:border-indigo-500/40' 
                    : 'bg-white border-slate-100 hover:border-indigo-500/40 hover:shadow-2xl'
                }`}
              >
                <div className="flex-grow space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${project.progress === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500'}`}></div>
                        <h3 className={`text-xl font-black uppercase italic tracking-tighter transition-colors ${theme.textMain} group-hover:text-indigo-500`}>
                         {project.name}
                        </h3>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-5 py-2 rounded-2xl border transition-all ${
                        isDarkMode ? 'bg-black text-slate-500 border-slate-800 group-hover:border-indigo-500/20' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      STATUS: {project.status || 'STABLE'}
                    </span>
                  </div>
                  
                  <div className={`relative w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-black' : 'bg-slate-200/50'}`}>
                    <div 
                      className={`absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-violet-400 transition-all duration-1000 group-hover:brightness-125`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-8 min-w-[150px] justify-end">
                  <span className={`text-4xl font-black italic tracking-tighter opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all ${theme.textMain}`}>
                    {project.progress}%
                  </span>
                  <div className={`p-4 border rounded-2xl transition-all group-hover:rotate-45 shadow-2xl ${
                      isDarkMode ? 'bg-slate-900 border-transparent group-hover:bg-indigo-600' : 'bg-white border-slate-100 group-hover:bg-indigo-600 group-hover:border-transparent'
                  }`}>
                    <ArrowUpRight className="text-slate-500 group-hover:text-white" size={24} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className={`text-center py-32 border-2 border-dashed rounded-[4rem] ${isDarkMode ? 'border-slate-800/40 bg-black/20' : 'border-slate-100 bg-slate-50/50'}`}>
              <p className={`font-black uppercase text-xs tracking-[0.8em] italic animate-pulse ${isDarkMode ? 'text-slate-800' : 'text-slate-300'}`}>
                -- NINGUNA_UNIDAD_DETECTADA_EN_EL_CORE --
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, theme, isDarkMode }) {
  const colorMap = {
    indigo: {
      border: "group-hover:border-indigo-500/50",
      text: "text-indigo-500",
      iconBg: isDarkMode ? "bg-indigo-500/10" : "bg-indigo-50"
    },
    emerald: {
      border: "group-hover:border-emerald-500/50",
      text: "text-emerald-500",
      iconBg: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50"
    },
    amber: {
      border: "group-hover:border-amber-500/50",
      text: "text-amber-500",
      iconBg: isDarkMode ? "bg-amber-500/10" : "bg-amber-50"
    },
  };

  const currentStyle = colorMap[color];

  return (
    <div className={`border p-10 rounded-[3rem] transition-all duration-700 group relative overflow-hidden ${theme.card} ${!isDarkMode && 'shadow-2xl'} ${currentStyle.border}`}>
      {/* Icono de fondo fantasmático */}
      <div className={`absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-20 group-hover:scale-150 transition-all duration-1000 ${currentStyle.text}`}>
         {icon}
      </div>

      <div className="flex items-center gap-6 mb-8 relative z-10">
        <div className={`p-5 rounded-[1.5rem] border group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-xl ${currentStyle.iconBg} ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} ${currentStyle.text}`}>
          {icon}
        </div>
        <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${theme.textSecondary}`}>{label}</span>
      </div>
      <div className="flex items-baseline gap-4 relative z-10">
        <span className={`text-6xl font-black italic tracking-tighter group-hover:translate-x-2 transition-transform duration-500 ${theme.textMain}`}>{value}</span>
        <span className={`text-[10px] font-black uppercase italic tracking-widest ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>{sub}</span>
      </div>
    </div>
  );
}