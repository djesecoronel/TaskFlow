import { useState, useMemo } from 'react';
import { useProjects } from '../context/ProjectContext';
import { 
  PieChart, FileText, Clock, ChevronRight, Activity, Zap,
  Layers, Target, ShieldCheck, Database, Filter, Download, TrendingUp, BarChart3
} from 'lucide-react';

export default function Reports() {
  // BLINDAJE DE SEGURIDAD: Evita el crash si el context no está listo
  const projectContext = useProjects() || {};
  const { projects = [] } = projectContext;

  const [activeFilter, setActiveFilter] = useState('ALL'); 

  // Normalización de datos para evitar errores de .filter en undefined
  const safeProjects = useMemo(() => projects || [], [projects]);
  
  const projectsToDisplay = useMemo(() => {
    return activeFilter === 'ALL' 
      ? safeProjects 
      : safeProjects.filter(p => p.id === activeFilter);
  }, [safeProjects, activeFilter]);

  // --- MÉTRICAS KPI (DINÁMICAS Y BLINDADAS) ---
  const totalProjects = activeFilter === 'ALL' ? safeProjects.length : 1;
  const totalTasks = projectsToDisplay.reduce((acc, p) => acc + (p?.tasks?.length || 0), 0);
  const completedTasks = projectsToDisplay.reduce((acc, p) => 
    acc + (p?.tasks?.filter(t => t?.status === 'COMPLETED' || t?.status === 'DONE' || t?.status === 'TERMINADO')?.length || 0), 0
  );
  const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // --- RF-08.2: TEAM VELOCITY (DATOS SINTÉTICOS + REALES) ---
  const velocityBars = useMemo(() => {
    return [
      { week: 'W1', val: 40 },
      { week: 'W2', val: 55 },
      { week: 'W3', val: 35 },
      { week: 'W4', val: 70 },
      { week: 'W5', val: 50 },
      { week: 'NOW', val: efficiency || 12 } 
    ];
  }, [efficiency]);

  // --- RF-08.3: EXPORTACIÓN (PROTOCOLO TASKFLOW) ---
  const handleExport = () => {
    alert(`INICIANDO PROTOCOLO DE AUDITORÍA: GENERANDO REPORTE ${activeFilter === 'ALL' ? 'CONSOLIDADO_GLOBAL' : projectsToDisplay[0]?.name?.toUpperCase()}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-1000 pb-20">
      
      {/* HEADER ALPHA UNIFICADO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-slate-800/60 pb-12 gap-8 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -z-10" />
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <BarChart3 className="text-indigo-500" size={32} />
            </div>
            <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
              Data <span className="text-indigo-500 text-glow">Intelligence</span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] flex items-center gap-2 pl-2">
            <Activity size={12} className="text-indigo-600 animate-pulse" /> Advanced Analytics Node // Protocol OS_v2.0
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          {/* FILTRO DE UNIDAD */}
          <div className="relative group w-full md:w-auto">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 z-10" size={18} />
            <select 
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="appearance-none bg-[#0a0c10] border border-slate-800/60 pl-16 pr-12 py-5 rounded-[1.5rem] text-[10px] font-black text-white uppercase outline-none focus:border-indigo-500 min-w-[300px] cursor-pointer shadow-2xl transition-all hover:bg-slate-900/80"
            >
              <option value="ALL">-- CONSOLIDADO GENERAL --</option>
              {safeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name?.toUpperCase()}</option>
              ))}
            </select>
            <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 rotate-90" />
          </div>

          <button 
            onClick={handleExport}
            className="w-full md:w-auto flex items-center justify-center gap-4 px-10 py-5 bg-white text-black rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-[0_10px_30px_rgba(255,255,255,0.05)] active:scale-95 group"
          >
            <Download size={18} className="group-hover:animate-bounce" />
            Export_Audit_Full
          </button>
        </div>
      </div>

      {/* GRID DE KPIs ALPHA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unidades Activas', val: totalProjects, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: 'Carga de Tareas', val: totalTasks, icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Hitos Logrados', val: completedTasks, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Ratio Eficiencia', val: `${efficiency}%`, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((kpi, i) => (
          <div key={i} className="relative group overflow-hidden p-10 rounded-[3rem] border border-slate-800/50 bg-[#0a0c10]/60 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-500">
            {/* Icono de Fondo Gigante */}
            <kpi.icon className={`absolute -right-6 -bottom-6 opacity-[0.03] ${kpi.color} group-hover:scale-125 group-hover:opacity-[0.08] transition-all duration-1000`} size={160} />
            
            <div className={`w-14 h-14 mb-8 rounded-[1.2rem] ${kpi.bg} border border-white/5 flex items-center justify-center ${kpi.color} shadow-2xl group-hover:scale-110 transition-transform`}>
              <kpi.icon size={26} />
            </div>
            
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{kpi.label}</p>
            <h3 className="text-6xl font-black italic tracking-tighter text-white group-hover:translate-x-2 transition-transform">{kpi.val}</h3>
            
            <div className="flex items-center gap-2 mt-6">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Sincronizado</p>
            </div>
          </div>
        ))}
      </div>

      {/* PANEL DE ANÁLISIS CENTRAL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* GRÁFICA DE VELOCIDAD */}
        <div className="xl:col-span-8">
          <div className="bg-[#07090d] border border-slate-800/80 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
               <TrendingUp size={200} className="text-white" />
            </div>

            <div className="flex justify-between items-start mb-16 relative z-10">
              <div className="space-y-3">
                 <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-5">
                  <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                  Team_Velocity
                </h2>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] pl-7">
                  Status: <span className={efficiency > 70 ? 'text-emerald-500' : 'text-amber-500'}>
                    {efficiency > 80 ? 'CAPACIDAD_CRÍTICA' : efficiency > 40 ? 'FLUJO_ÓPTIMO' : 'INICIALIZANDO'}
                  </span>
                </p>
              </div>
              <div className="px-5 py-2 bg-indigo-500/5 rounded-full border border-indigo-500/10">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Live_Node_01</span>
              </div>
            </div>

            {/* CANVAS DE GRÁFICA */}
            <div className="bg-black/40 p-12 rounded-[3rem] border border-slate-900 shadow-inner relative z-10">
               <div className="flex items-end justify-around gap-4 h-56 px-6 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-slate-800/30" />
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-800/30" />
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-800/30" />

                  {velocityBars.map((bar, i) => (
                    <div key={i} className="group/bar relative flex flex-col items-center flex-1 h-full justify-end">
                      <div 
                        className={`w-full max-w-[16px] rounded-t-xl transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                          i === 5 
                          ? 'bg-gradient-to-t from-indigo-700 to-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)]' 
                          : 'bg-slate-800 group-hover/bar:bg-indigo-500/50'
                        }`}
                        style={{ height: `${bar.val}%` }}
                      />
                      <span className="text-[8px] font-black text-slate-700 mt-5 uppercase tracking-tighter group-hover/bar:text-indigo-400 transition-colors">
                        {bar.week}
                      </span>
                      
                      {/* Floating Tooltip */}
                      <div className="absolute -top-14 opacity-0 group-hover/bar:opacity-100 translate-y-4 group-hover/bar:translate-y-0 transition-all duration-300 bg-white text-black font-black text-[11px] px-4 py-2 rounded-xl shadow-2xl z-50 whitespace-nowrap border-[3px] border-black italic">
                        {Math.round(bar.val)}% LOAD
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-12 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] flex items-start gap-4">
              <Zap size={20} className="text-indigo-500 shrink-0 mt-1" />
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">
                Cálculo de eficiencia basado en el rendimiento de red TaskFlow OS. 
                Los datos reflejan la relación entre tareas asignadas y completadas en el ciclo actual.
              </p>
            </div>
          </div>
        </div>

        {/* AUDIT LOGS */}
        <div className="xl:col-span-4">
          <div className="bg-[#0a0c10] border border-slate-800/80 p-10 rounded-[3.5rem] sticky top-8 shadow-2xl overflow-hidden group">
            <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
               <Database size={200} className="text-white" />
            </div>
            
            <h2 className="text-[11px] font-black text-white uppercase italic mb-12 flex items-center gap-4 tracking-[0.4em] relative z-10">
              <Clock size={20} className="text-indigo-500 animate-spin-slow" /> 
              Terminal_Audit
            </h2>

            <div className="space-y-10 relative z-10">
              <div className="absolute left-[9px] top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-indigo-500/50 via-slate-800 to-transparent" />
              
              {[
                { title: 'DB_REPLICATION', status: 'STABLE', color: 'bg-emerald-500', time: '14:22:01' },
                { title: 'OS_CORE_SYNC', status: 'SUCCESS', color: 'bg-indigo-500', time: '13:45:12' },
                { title: 'TASK_OVERFLOW', status: 'FILTERED', color: 'bg-amber-500', time: '11:20:05' },
                { title: 'ENCRYPTION_KEY', status: 'ACTIVE', color: 'bg-sky-500', time: '09:12:44' },
                { title: 'USER_NODE_AUTH', status: 'VERIFIED', color: 'bg-indigo-400', time: '08:00:10' }
              ].map((log, i) => (
                <div key={i} className="flex gap-8 group/log pl-1 relative">
                  <div className={`w-4 h-4 rounded-full border-[3px] border-[#0a0c10] z-10 ${log.color} group-hover/log:scale-150 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-[12px] text-white font-black uppercase italic tracking-tighter group-hover/log:text-indigo-400 transition-colors">{log.title}</p>
                       <span className="text-[8px] font-black text-slate-700 tracking-widest">{log.status}</span>
                    </div>
                    <p className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em]">{log.time} // 25.03.2026</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-12 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:border-indigo-500 transition-all">
              View_Full_History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}