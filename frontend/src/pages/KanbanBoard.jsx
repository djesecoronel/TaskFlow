import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { 
  Plus, ArrowLeft, Trash2, GripVertical, Tag, 
  Search, X, Save, Star, Lock, FileBarChart, Layers,
  Mail, GitGraph, Edit3 // GitGraph para Composite, Edit3 para Edición
} from 'lucide-react';

// Componentes
import TaskModal from '../components/modals/TaskModal';
import TeamBar from '../components/kanban/TeamBar';

export default function KanbanBoard() {
  const { id } = useParams();
  const { search } = useLocation(); 
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme(); 
  
  // --- [CORE_COMMAND: INYECCIÓN DE LÓGICA DE PROYECTOS] ---
  const { 
    projects, 
    addTask, 
    moveTask, 
    cloneTask, 
    deleteTask, // <--- PROTOCOLO DE PURGA SIN DAÑAR ESTRUCTURA
    addSubtask, // <--- PROTOCOLO COMPOSITE (JERARQUÍAS)
    updateTask, // <--- PROTOCOLO DE EDICIÓN (MUTACIÓN)
    exportProjectReport,
    notifyTaskByEmail // <--- CONSUMIMOS EL PROTOCOLO ADAPTER DINÁMICO
  } = useProjects();
  
  const queryParams = new URLSearchParams(search);
  const focusedTaskId = queryParams.get('focus');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState('');
  const [editingTask, setEditingTask] = useState(null); // <--- ESTADO PARA IDENTIFICAR EDICIÓN
  const [parentTaskId, setParentTaskId] = useState(null); // <--- ESTADO PARA EL VÍNCULO JERÁRQUICO
  const [filters, setFilters] = useState({ search: '', priority: 'ALL', type: 'ALL' });

  const [savedFilters, setSavedFilters] = useState(() => {
    const local = localStorage.getItem(`saved_filters_${id}`);
    return local ? JSON.parse(local) : [];
  });

  const project = projects.find(p => String(p.id) === String(id));
  const isAdmin = project?.owner === user?.email;

  useEffect(() => {
    if (id) {
      localStorage.setItem(`saved_filters_${id}`, JSON.stringify(savedFilters));
    }
  }, [savedFilters, id]);

  if (!project) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className={`animate-pulse font-black italic uppercase tracking-widest text-[10px] ${theme.textSecondary}`}>
        Sincronizando Protocolos de Tablero...
      </div>
    </div>
  );

  const columns = project.board?.columns || [];
  const tasks = project.tasks || [];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.title || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                          (task.description || '').toLowerCase().includes(filters.search.toLowerCase());
    const matchesPriority = filters.priority === 'ALL' || task.priority === filters.priority;
    const matchesType = filters.type === 'ALL' || task.type === filters.type;
    return matchesSearch && matchesPriority && matchesType;
  });

  // --- [PROTOCOLO ADAPTER: DISPARO DINÁMICO] ---
  const handleNotifyOperative = (taskId, recipient) => {
    if (!recipient || recipient === '?') {
      alert("⚠️ ERROR_PROTOCOL: No hay un operativo asignado para recibir esta unidad.");
      return;
    }
    
    console.log(`%c 📧 [ADAPTER_INIT]: Notificando a -> ${recipient} `, "background: #f59e0b; color: black; font-weight: bold; padding: 2px; border-radius: 4px;");
    
    // Llamada al contexto pasando el ID y el destinatario real
    notifyTaskByEmail(taskId, recipient);
  };

  const handleGenerateReport = (format) => {
    exportProjectReport(project.id, format);
  };

  const handleSaveCurrentFilter = () => {
    const filterName = prompt("NOMBRE DEL FILTRO PERSONALIZADO:");
    if (filterName) setSavedFilters([...savedFilters, { id: Date.now(), name: filterName.toUpperCase(), config: { ...filters } }]);
  };

  const onDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e, columnTitle) => {
    const taskId = e.dataTransfer.getData("taskId");
    moveTask(project.id, taskId, columnTitle);
  };

  const openAddTask = (columnTitle) => {
    setEditingTask(null); // Reseteamos modo edición
    setParentTaskId(null); // Tarea raíz
    setActiveColumn(columnTitle);
    setIsModalOpen(true);
  };

  // --- [NUEVA FUNCIÓN: DISPARAR EDICIÓN TÁCTICA] ---
  const openEditTask = (task) => {
    setParentTaskId(null);
    setEditingTask(task); // Cargamos la unidad a mutar
    setActiveColumn(task.status || 'POR HACER');
    setIsModalOpen(true);
  };

  // --- [NUEVA FUNCIÓN: DISPARAR RAMIFICACIÓN COMPOSITE] ---
  const openAddSubtask = (parentTask) => {
    setEditingTask(null);
    setParentTaskId(parentTask.id || parentTask.task_id);
    setActiveColumn(parentTask.status || 'POR HACER');
    setIsModalOpen(true);
  };

  const onSaveTask = (data) => {
    const sanitizedAssignedTo = typeof data.assignedTo === 'object' ? data.assignedTo.email : data.assignedTo;
    
    if (editingTask) {
      // SI HAY UN OBJETO EN EDICIÓN, DISPARAMOS PROTOCOLO DE MUTACIÓN
      updateTask(project.id, editingTask.id || editingTask.task_id, { ...data, assignedTo: sanitizedAssignedTo });
    } else if (parentTaskId) {
      // SI HAY UN PARENT_ID, DISPARAMOS EL PROTOCOLO COMPOSITE
      addSubtask(project.id, parentTaskId, { ...data, assignedTo: sanitizedAssignedTo });
    } else {
      // SI NO, ES UNA TAREA ESTÁNDAR
      addTask(project.id, { ...data, assignedTo: sanitizedAssignedTo });
    }
    
    setIsModalOpen(false);
  };

  const modalMembers = project.members && project.members.length > 0 
    ? project.members 
    : (user ? [{ email: user.email, role: 'OWNER' }] : []);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Link to="/projects" className={`p-3 border rounded-2xl transition-all shadow-xl ${theme.card} ${isDarkMode ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-400 hover:text-indigo-600'}`}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme.textMain}`}>
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.2em] ${
                isAdmin 
                ? (isDarkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-white') 
                : (isDarkMode ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200')
              }`}>
                {isAdmin ? 'Protocolo: Full Admin' : 'Protocolo: Restricted'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex p-1 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => handleGenerateReport('pdf')} className={`p-2 transition-colors ${isDarkMode ? 'text-slate-500 hover:text-rose-500' : 'text-slate-400 hover:text-rose-600'}`} title="REPORTE PDF (BRIDGE)">
              <FileBarChart size={20} />
            </button>
            <button onClick={() => handleGenerateReport('excel')} className={`p-2 transition-colors ${isDarkMode ? 'text-slate-500 hover:text-emerald-500' : 'text-slate-400 hover:text-emerald-600'}`} title="REPORTE EXCEL (BRIDGE)">
              <Save size={20} />
            </button>
          </div>
          <TeamBar members={project.members || []} isAdmin={isAdmin} />
        </div>
      </div>

      {/* FILTROS */}
      <div className="space-y-4">
        <div className={`flex flex-wrap items-center gap-3 p-4 border rounded-[1.8rem] backdrop-blur-md transition-all ${theme.card} ${!isDarkMode && 'bg-white/70 shadow-sm'}`}>
          <div className="relative flex-1 min-w-[250px] group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-700 group-focus-within:text-indigo-500' : 'text-slate-300 group-focus-within:text-indigo-600'}`} size={16} />
            <input 
              type="text"
              placeholder="FILTRAR TAREAS..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className={`w-full border rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase outline-none focus:border-indigo-500/50 transition-all ${
                isDarkMode ? 'bg-slate-950/50 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
          <button onClick={handleSaveCurrentFilter} className={`p-3 border rounded-xl transition-all ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-sm'}`}>
            <Save size={18} />
          </button>
        </div>
      </div>

      {/* ÁREA KANBAN */}
      <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar items-start h-full">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter(t => {
            const taskStatus = (t.status || '').toUpperCase();
            const colTitle = (column.title || '').toUpperCase();
            return taskStatus === colTitle || taskStatus === column.id.toUpperCase() || 
                   (t.column_id === column.id) ||
                   (taskStatus === 'TO_DO' && colTitle === 'POR HACER') ||
                   (taskStatus === 'IN_PROGRESS' && colTitle === 'EN PROGRESO') ||
                   (taskStatus === 'DONE' && colTitle === 'COMPLETADO');
          });

          return (
            <div key={column.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, column.title)} 
                 className={`flex-shrink-0 w-80 border rounded-[2.5rem] flex flex-col min-h-[500px] backdrop-blur-sm transition-all duration-500 ${theme.card} ${!isDarkMode && 'shadow-xl bg-white/40'}`}>
              
              <div className={`p-6 flex justify-between items-start rounded-t-[2.5rem] border-b transition-colors ${isDarkMode ? 'bg-slate-900/60 border-slate-800/50' : 'bg-slate-50/80 border-slate-100'}`}>
                <h3 className={`text-xs font-black uppercase italic tracking-widest ${theme.textMain}`}>{column.title}</h3>
                <button onClick={() => openAddTask(column.title)} className={`p-2 rounded-xl transition-all shadow-lg text-white ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-indigo-600'}`}>
                  <Plus size={16}/>
                </button>
              </div>

              <div className="p-4 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                {columnTasks.map((task) => {
                  const isFocused = focusedTaskId === task.id || focusedTaskId === task.task_id;
                  const isBug = task.type === 'BUG';
                  const isSubtask = !!task.parent_task; // <--- DETECCIÓN DE RAMA COMPOSITE
                  const taskRecipient = task.assignedTo || '?';

                  return (
                    <div 
                      key={task.id || task.task_id} 
                      draggable 
                      onDragStart={(e) => onDragStart(e, task.id || task.task_id)}
                      className={`border p-5 rounded-[1.8rem] cursor-grab transition-all group relative overflow-hidden ${
                        isSubtask 
                        ? `ml-6 scale-[0.96] border-dashed ${isDarkMode ? 'bg-slate-950/40 border-slate-700 shadow-none' : 'bg-slate-50 border-slate-200'}` 
                        : (isFocused ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-[1.03]' : (isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100 shadow-sm'))
                      } ${isBug ? 'border-l-4 border-l-rose-500' : ''}`}
                    >
                      {/* --- [TÚNEL DE ACCIONES RÁPIDAS] --- */}
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                        
                        {/* --- [TRIGGER EDIT: BOTÓN DE MUTACIÓN] --- */}
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditTask(task); }}
                          className={`p-1.5 rounded-lg border transition-all bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm`} 
                          title="EDITAR UNIDAD">
                          <Edit3 size={11} />
                        </button>

                        {/* --- [TRIGGER COMPOSITE: AÑADIR RAMA HIJA] --- */}
                        {!isSubtask && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAddSubtask(task); }}
                            className={`p-1.5 rounded-lg border transition-all bg-white text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-sm`} 
                            title="AÑADIR SUBTAREA (COMPOSITE)">
                            <GitGraph size={11} />
                          </button>
                        )}

                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNotifyOperative(task.id || task.task_id, taskRecipient); }}
                          className={`p-1.5 rounded-lg border transition-all bg-white text-amber-400 hover:bg-amber-500 hover:text-white shadow-sm`}
                          title={`NOTIFICAR A ${taskRecipient.toUpperCase()} (ADAPTER)`}
                        >
                          <Mail size={11} />
                        </button>

                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.confirm("🧬 ¿INICIAR PROTOCOLO DE CLONACIÓN PROTOTYPE?")) cloneTask(project.id, task.id || task.task_id); }}
                          className={`p-1.5 rounded-lg border transition-all bg-white text-indigo-400 shadow-sm`}>
                          <Layers size={11} />
                        </button>

                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.confirm("🧨 [PROTOCOL_CRITICAL]: ¿CONFIRMA LA ELIMINACIÓN PERMANENTE?")) deleteTask(project.id, task.id || task.task_id); }}
                          className={`p-1.5 rounded-lg border transition-all bg-white text-rose-500 hover:bg-rose-600 hover:text-white shadow-sm`}
                          title="PURGAR UNIDAD">
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* CONECTOR VISUAL COMPOSITE */}
                      {isSubtask && <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-slate-700/30"></div>}

                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg border italic transition-colors ${
                          task.priority === 'URGENTE' || task.priority === 'URGENT' 
                          ? 'border-rose-500/40 text-rose-600 bg-rose-500/5' 
                          : (isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-300')
                        }`}>
                          {task.priority}
                        </span>
                        {(task.subtasks?.length > 0) && (
                          <div className="flex items-center gap-1 text-indigo-500 animate-pulse mr-8">
                            <Layers size={12} />
                            <span className="text-[9px] font-black">{task.subtasks.length}</span>
                          </div>
                        )}
                      </div>
                      
                      <h4 className={`font-bold uppercase italic leading-tight transition-colors pr-8 ${isSubtask ? 'text-[10px]' : 'text-xs mb-4'} ${theme.textMain}`}>
                        {task.title}
                      </h4>
                      
                      {!isSubtask && (
                        <div className={`flex items-center justify-between border-t pt-4 transition-colors ${isDarkMode ? 'border-slate-700/30' : 'border-slate-50'}`}>
                          <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter ${theme.textSecondary}`}>
                            <Tag size={10} className={isBug ? "text-rose-500" : "text-indigo-600"} />
                            {task.type}
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black uppercase italic shadow-sm ${
                              isDarkMode ? 'bg-slate-950 text-indigo-400' : 'bg-slate-900 text-white'
                          }`}>
                              {taskRecipient.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={onSaveTask} 
        projectMembers={modalMembers}
        initialStatus={activeColumn}
        allTasks={tasks}
        taskToEdit={editingTask} // <--- DATOS PARA EL MODO EDICIÓN
        isSubtask={!!parentTaskId} // <--- INDICADOR JERÁRQUICO
      />
    </div>
  );
}