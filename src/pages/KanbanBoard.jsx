import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, ArrowLeft, Trash2, GripVertical, Tag, 
  Search, X, Save, Star, Lock 
} from 'lucide-react';

// Componentes
import TaskModal from '../components/modals/TaskModal';
import TeamBar from '../components/kanban/TeamBar';

export default function KanbanBoard() {
  const { id } = useParams();
  const { search } = useLocation(); 
  const { user } = useAuth();
  const { projects, updateColumns, addTask, moveTask, inviteMember, removeMember } = useProjects();
  
  // --- LÓGICA DE FOCO ---
  const queryParams = new URLSearchParams(search);
  const focusedTaskId = queryParams.get('focus');

  // --- ESTADOS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState('');
  const [filters, setFilters] = useState({ search: '', priority: 'ALL', type: 'ALL' });

  const [savedFilters, setSavedFilters] = useState(() => {
    const local = localStorage.getItem(`saved_filters_${id}`);
    return local ? JSON.parse(local) : [];
  });

  const project = projects.find(p => p.id === Number(id));

  // --- LÓGICA DE PERMISOS ---
  const isAdmin = project?.owner === user?.email;

  useEffect(() => {
    localStorage.setItem(`saved_filters_${id}`, JSON.stringify(savedFilters));
  }, [savedFilters, id]);

  if (!project) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-pulse text-slate-400 dark:text-slate-500 font-black italic uppercase tracking-widest text-[10px]">
        Sincronizando Protocolos de Tablero...
      </div>
    </div>
  );

  const columns = project.board?.columns || [];
  const tasks = project.tasks || [];

  // --- LÓGICA DE FILTRADO ---
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                          task.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesPriority = filters.priority === 'ALL' || task.priority === filters.priority;
    const matchesType = filters.type === 'ALL' || task.type === filters.type;
    return matchesSearch && matchesPriority && matchesType;
  });

  // --- HANDLERS ---
  const handleSaveCurrentFilter = () => {
    const filterName = prompt("NOMBRE DEL FILTRO PERSONALIZADO:");
    if (filterName) setSavedFilters([...savedFilters, { id: Date.now(), name: filterName.toUpperCase(), config: { ...filters } }]);
  };

  const onDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e, columnTitle) => {
    const taskId = e.dataTransfer.getData("taskId");
    moveTask(project.id, Number(taskId), columnTitle);
  };

  const openAddTask = (columnTitle) => {
    setActiveColumn(columnTitle);
    setIsModalOpen(true);
  };

  const onSaveTask = (data) => {
    const sanitizedAssignedTo = typeof data.assignedTo === 'object' 
      ? data.assignedTo.email 
      : data.assignedTo;
    
    addTask(project.id, { ...data, assignedTo: sanitizedAssignedTo });
    setIsModalOpen(false);
  };

  const handleAddColumn = () => {
    if (!isAdmin) return;
    const title = prompt("Nombre de la nueva columna:");
    if (title) updateColumns(project.id, [...columns, { id: `col-${Date.now()}`, title, wipLimit: 5 }]);
  };

  const handleDeleteColumn = (columnId) => {
    if (!isAdmin) return;
    if (window.confirm("¿Eliminar bloque? Las tareas quedarán huérfanas.")) {
      updateColumns(project.id, columns.filter(col => col.id !== columnId));
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Link to="/projects" className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/50 transition-all shadow-xl">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.2em] ${isAdmin ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                {isAdmin ? 'Protocolo: Full Admin' : 'Protocolo: Restricted'}
              </span>
            </div>
          </div>
        </div>

        <TeamBar 
          members={project.members || []} 
          isAdmin={isAdmin}
          onInvite={() => {
            const email = prompt("Ingrese el correo electrónico:");
            if (email) inviteMember(project.id, email);
          }}
          onRemove={(email) => {
            if (window.confirm(`¿Revocar acceso a ${email}?`)) removeMember(project.id, email);
          }}
        />
      </div>

      {/* FILTROS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-[1.8rem] backdrop-blur-md">
          <div className="relative flex-1 min-w-[250px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="FILTRAR TAREAS..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black text-slate-900 dark:text-white uppercase outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800"
            />
          </div>
          
          <select 
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-slate-500 uppercase outline-none cursor-pointer hover:border-indigo-500/30 transition-colors"
          >
            <option value="ALL">PRIORIDAD: TODAS</option>
            <option value="URGENTE">URGENTE</option>
            <option value="ALTA">ALTA</option>
            <option value="MEDIA">MEDIA</option>
            <option value="BAJA">BAJA</option>
          </select>

          <div className="flex gap-2">
            <button onClick={handleSaveCurrentFilter} className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
              <Save size={18} />
            </button>
            <button onClick={() => setFilters({ search: '', priority: 'ALL', type: 'ALL' })} className="p-3 text-slate-400 dark:text-slate-700 hover:text-rose-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CHIPS DE FAVORITOS */}
        {savedFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-2">
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-700 uppercase italic tracking-widest flex items-center gap-2">
              <Star size={10} className="fill-current" /> Vistas Guardadas:
            </span>
            {savedFilters.map(sf => (
              <div key={sf.id} className="group flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:border-indigo-500/50 transition-all shadow-sm">
                <button onClick={() => setFilters(sf.config)} className="text-[9px] font-black text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase italic tracking-tighter">{sf.name}</button>
                <button onClick={() => setSavedFilters(savedFilters.filter(f => f.id !== sf.id))} className="text-slate-300 dark:text-slate-700 hover:text-rose-500"><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ÁREA DE TRABAJO KANBAN */}
      <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar items-start h-full">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter(t => t.status === column.title);
          const isOverWIP = columnTasks.length >= column.wipLimit;

          return (
            <div 
              key={column.id} 
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, column.title)}
              className="flex-shrink-0 w-80 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40 rounded-[2.5rem] flex flex-col min-h-[500px] shadow-xl dark:shadow-2xl backdrop-blur-sm"
            >
              <div className="p-6 flex justify-between items-start bg-slate-50 dark:bg-slate-900/60 rounded-t-[2.5rem] border-b border-slate-200 dark:border-slate-800/50">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-widest">{column.title}</h3>
                  <div className="mt-2">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${isOverWIP ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800'}`}>
                      {columnTasks.length} / {column.wipLimit} WIP
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {isAdmin && (
                    <button onClick={() => handleDeleteColumn(column.id)} className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-500 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  )}
                  <button onClick={() => openAddTask(column.title)} className="p-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all shadow-lg">
                    <Plus size={16}/>
                  </button>
                </div>
              </div>

              {/* TAREAS */}
              <div className="p-4 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                {columnTasks.map((task) => {
                  const isFocused = Number(focusedTaskId) === task.id;
                  return (
                    <div 
                      key={task.id} 
                      draggable 
                      onDragStart={(e) => onDragStart(e, task.id)}
                      className={`bg-white dark:bg-slate-800/40 border p-5 rounded-[1.8rem] cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden shadow-sm hover:shadow-md ${
                        isFocused 
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.15)] scale-[1.03] z-10 dark:bg-slate-800/90' 
                          : 'border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg border italic ${
                          task.priority === 'URGENTE' ? 'border-rose-500/40 text-rose-600 dark:text-rose-500 bg-rose-500/5' : 'border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                        }`}>
                          {task.priority}
                        </span>
                        <GripVertical size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      
                      <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase italic mb-6 leading-relaxed">
                        {task.title}
                      </h4>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/30 pt-4">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-tighter">
                          <Tag size={10} className="text-indigo-600 dark:text-indigo-500" />
                          {task.type}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase italic shadow-sm">
                           {typeof task.assignedTo === 'string' 
                              ? task.assignedTo.charAt(0).toUpperCase() 
                              : task.assignedTo?.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* AGREGAR COLUMNA */}
        {isAdmin ? (
          <button 
            onClick={handleAddColumn} 
            className="flex-shrink-0 w-24 h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500/40 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-200 dark:text-slate-800 hover:text-indigo-600 dark:hover:text-indigo-500 transition-all group bg-slate-50/50 dark:bg-slate-900/20"
          >
            <Plus size={28} className="mb-4 group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-[10px] font-black uppercase vertical-text italic tracking-[0.4em] opacity-40 group-hover:opacity-100">Nuevo Bloque</span>
          </button>
        ) : (
          <div className="flex-shrink-0 w-24 h-[300px] border-2 border-dashed border-slate-100 dark:border-slate-900/10 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-200 dark:text-slate-900/20 cursor-not-allowed">
            <Lock size={24} className="mb-4" />
            <span className="text-[10px] font-black uppercase vertical-text italic tracking-[0.4em]">Protegido</span>
          </div>
        )}
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={onSaveTask} 
        projectMembers={project.members}
        initialStatus={activeColumn}
      />
    </div>
  );
}