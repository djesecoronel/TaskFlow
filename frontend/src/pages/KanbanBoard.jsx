import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import api from '../api/api'; // Importamos la instancia de Axios configurada
import { 
  Plus, ArrowLeft, Trash2, GripVertical, Tag, 
  Search, X, Save, Star, Lock, FileBarChart, Layers,
  Mail, GitGraph, Edit3 
} from 'lucide-react';

// Componentes
import TaskModal from '../components/modals/TaskModal';
import TeamBar from '../components/kanban/TeamBar';

// --- NUEVA FUNCIONALIDAD: INTERFACES Y PATRONES DE COMPORTAMIENTO ---

// 1. PATRÓN STRATEGY: Estrategias de Filtrado/Ordenamiento en el cliente
const FilteringStrategies = {
  DEFAULT: (tasks, searchVal, priorityVal, typeVal) => {
    return tasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes(searchVal.toLowerCase()) || 
                            (task.description || '').toLowerCase().includes(searchVal.toLowerCase());
      const matchesPriority = priorityVal === 'ALL' || task.priority === priorityVal;
      const matchesType = typeVal === 'ALL' || task.type === typeVal;
      return matchesSearch && matchesPriority && matchesType;
    });
  }
};

// 2. PATRÓN COMMAND: Encapsulación de acciones de UI + Sincronización Backend
class UICommandInvoker {
  constructor() {
    this.history = [];
  }
  execute(command) {
    this.history.push(command);
    command.execute();
  }
}

class MoveTaskCommand {
  constructor(moveTaskFn, projectId, taskId, targetColumn, refreshFn) {
    this.moveTaskFn = moveTaskFn;
    this.projectId = projectId;
    this.taskId = taskId;
    this.targetColumn = targetColumn;
    this.refreshFn = refreshFn;
  }
  async execute() {
    console.log(`🕹️ [UI_COMMAND]: Ejecutando MoveTaskCommand de tarea ${this.taskId} a ${this.targetColumn}`);
    // Llamada al Backend vía API REST
    try {
      await api.patch(`/tasks/${this.taskId}`, { status: this.targetColumn });
      this.moveTaskFn(this.projectId, this.taskId, this.targetColumn);
      // Forzamos refresco de UI inmediato tras el éxito
      if (this.refreshFn) this.refreshFn(prev => prev + 1);
    } catch (err) { console.error("❌ [BACKEND_SYNC_ERROR]:", err); }
  }
}

class DeleteTaskCommand {
  constructor(deleteTaskFn, projectId, taskId) {
    this.deleteTaskFn = deleteTaskFn;
    this.projectId = projectId;
    this.taskId = taskId;
  }
  async execute() {
    console.log(`🕹️ [UI_COMMAND]: Ejecutando DeleteTaskCommand para unidad física ${this.taskId}`);
    // Llamada al Backend vía API REST
    try {
      await api.delete(`/tasks/${this.taskId}`);
    } catch (err) { console.error("❌ [BACKEND_SYNC_ERROR]:", err); }
    
    this.deleteTaskFn(this.projectId, this.taskId);
  }
}

// --- NUEVA FUNCIONALIDAD: COMANDOS PARA CREACIÓN Y ACTUALIZACIÓN ---
class AddTaskCommand {
  constructor(addTaskFn, projectId, payload) {
    this.addTaskFn = addTaskFn;
    this.projectId = projectId;
    this.payload = payload;
  }
  async execute() {
    try { await api.post(`/projects/${this.projectId}/tasks`, this.payload); } 
    catch (err) { console.error("❌ [BACKEND_SYNC_ERROR]:", err); }
    this.addTaskFn(this.projectId, this.payload);
  }
}

class UpdateTaskCommand {
  constructor(updateTaskFn, projectId, taskId, payload) {
    this.updateTaskFn = updateTaskFn;
    this.projectId = projectId;
    this.taskId = taskId;
    this.payload = payload;
  }
  async execute() {
    try { await api.put(`/tasks/${this.taskId}`, this.payload); } 
    catch (err) { console.error("❌ [BACKEND_SYNC_ERROR]:", err); }
    this.updateTaskFn(this.projectId, this.taskId, this.payload);
  }
}

// Inicialización del invocador de frontend
const uiInvoker = new UICommandInvoker();

// --- NUEVA FUNCIONALIDAD: UTILERÍA DE TELEMETRÍA CENTRALIZADA ---
const Telemetry = {
  log: (msg, type = 'info') => {
    const styles = {
      info: "background: #3b82f6; color: white; padding: 2px 5px;",
      error: "background: #ef4444; color: white; padding: 2px 5px;",
      warn: "background: #f59e0b; color: black; padding: 2px 5px;"
    };
    console.log(`%c[SYSTEM_TELEMETRY]: ${msg}`, styles[type] || styles.info);
  }
};

export default function KanbanBoard() {
  const { id } = useParams();
  const { search } = useLocation(); 
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme(); 
  
  const [refreshKey, setRefreshKey] = useState(0);
  // --- [ESCUDO DE IDEMPOTENCIA] ---
  const isProcessingRef = useRef(false);
  
  // --- [CORE_COMMAND: INYECCIÓN DE LÓGICA DE PROYECTOS] ---
  const { 
    projects, 
    addTask, 
    moveTask, 
    cloneTask, 
    deleteTask, 
    addSubtask, 
    updateTask, 
    exportProjectReport,
    notifyTaskByEmail,
    globalProjectSubject 
  } = useProjects();
  
  const queryParams = new URLSearchParams(search);
  const focusedTaskId = queryParams.get('focus');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState('');
  const [editingTask, setEditingTask] = useState(null); 
  const [parentTaskId, setParentTaskId] = useState(null); 
  const [filters, setFilters] = useState({ search: '', priority: 'ALL', type: 'ALL' });
  
  const [currentStrategy, setCurrentStrategy] = useState('DEFAULT');

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

  // --- SUSCRIPCIÓN A CAMBIOS PARA REACTIVIDAD ---
  useEffect(() => {
    if (!globalProjectSubject) return;
    const subscription = globalProjectSubject.subscribe(() => {
      // [IDEMPOTENCY_FILTER]: Evitar ciclos de refresco si estamos bloqueando la UI
      if (isProcessingRef.current) return;
      Telemetry.log("Sincronización de estado detectada vía Observable");
      setRefreshKey(prev => prev + 1);
    });
    return () => subscription.unsubscribe();
  }, [globalProjectSubject]);

  if (!project) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className={`animate-pulse font-black italic uppercase tracking-widest text-[10px] ${theme.textSecondary}`}>
        Sincronizando Protocolos de Tablero...
      </div>
    </div>
  );

  const columns = project.board?.columns || [];
  const tasks = project.tasks || [];

  const filteredTasks = FilteringStrategies[currentStrategy](
    tasks, 
    filters.search, 
    filters.priority, 
    filters.type
  );

  const handleNotifyOperative = (taskId, recipient) => {
    const finalRecipient = (!recipient || recipient === '?') ? "operativo_fantasma@taskflow.com" : recipient;
    Telemetry.log(`Forzando notification para -> ${finalRecipient}`, 'warn');
    notifyTaskByEmail(taskId, finalRecipient);
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
    const moveCmd = new MoveTaskCommand(moveTask, project.id, taskId, columnTitle, setRefreshKey);
    uiInvoker.execute(moveCmd);
  };

  const openAddTask = (columnTitle) => {
    setEditingTask(null);
    setParentTaskId(null);
    setActiveColumn(columnTitle);
    setIsModalOpen(true);
  };

  const openEditTask = (task) => {
    setParentTaskId(null);
    setEditingTask(task);
    setActiveColumn(task.status || 'POR HACER');
    setIsModalOpen(true);
  };

  const openAddSubtask = (parentTask) => {
    setEditingTask(null);
    setParentTaskId(parentTask.id || parentTask.task_id);
    setActiveColumn(parentTask.status || 'POR HACER');
    setIsModalOpen(true);
  };

  const onSaveTask = async (data) => {
    // --- [ESCUDO: EVITAR DOBLE DISPARO] ---
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const taskPayload = { 
      ...data, 
      assignedTo: typeof data.assignedTo === 'object' ? data.assignedTo.email : data.assignedTo,
      type: data.type || 'TASK'
    };

    console.log("🚀 [DEBUG_PAYLOAD_FINAL]:", taskPayload);
    
    if (editingTask) {
      const updateCmd = new UpdateTaskCommand(updateTask, project.id, editingTask.id || editingTask.task_id, taskPayload);
      await uiInvoker.execute(updateCmd);
    } else if (parentTaskId) {
      await addSubtask(project.id, parentTaskId, taskPayload);
    } else {
      const addCmd = new AddTaskCommand(addTask, project.id, taskPayload);
      await uiInvoker.execute(addCmd);
    }
    
    setIsModalOpen(false);
    // Pequeño delay para asegurar que el DOM se refresque después de la persistencia
    setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        isProcessingRef.current = false;
    }, 800);
  };

  const modalMembers = project.members && project.members.length > 0 
    ? project.members 
    : (user ? [{ email: user.email, role: 'OWNER' }] : []);

  return (
    <div key={refreshKey} className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-700">
      
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
                  const isSubtask = !!task.parent_task;
                  const taskRecipient = task.assignedTo || '?';

                  const typeStyles = {
                    BUG: 'border-l-4 border-l-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:shadow-[0_0_20px_rgba(244,63,94,0.1)]',
                    FEATURE: 'border-l-4 border-l-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:shadow-[0_0_20px_rgba(168,85,247,0.1)]',
                    TASK: 'border-l-4 border-l-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.15)] dark:shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                  };
                  
                  const auraStyle = typeStyles[task.type] || '';

                  return (
                    <div 
                      key={task.id || task.task_id} 
                      draggable 
                      onDragStart={(e) => onDragStart(e, task.id || task.task_id)}
                      className={`border p-5 rounded-[1.8rem] cursor-grab transition-all group relative overflow-hidden ${
                        isSubtask 
                        ? `ml-6 scale-[0.96] border-dashed ${isDarkMode ? 'bg-slate-950/40 border-slate-700 shadow-none' : 'bg-slate-50 border-slate-200'}` 
                        : (isFocused ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-[1.03]' : (isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100 shadow-sm'))
                      } ${isBug ? 'border-l-4 border-l-rose-500' : ''} ${auraStyle}`}
                    >
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditTask(task); }}
                          className={`p-1.5 rounded-lg border transition-all bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm`} 
                          title="EDITAR UNIDAD">
                          <Edit3 size={11} />
                        </button>
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
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.confirm("🧬 ¿INICIAR PROTOCOLO DE CLONACIÓN PROTOTYPE?")) { cloneTask(project.id, task.id || task.task_id); setTimeout(() => setRefreshKey(prev => prev + 1), 100); } }}
                          className={`p-1.5 rounded-lg border transition-all bg-white text-indigo-400 shadow-sm`}>
                          <Layers size={11} />
                        </button>
                        <button onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          if(window.confirm("🧨 [PROTOCOL_CRITICAL]: ¿CONFIRMA LA ELIMINACIÓN PERMANENTE?")) {
                            const deleteCmd = new DeleteTaskCommand(deleteTask, project.id, task.id || task.task_id);
                            uiInvoker.execute(deleteCmd);
                            setTimeout(() => setRefreshKey(prev => prev + 1), 100);
                          }
                        }}
                          className={`p-1.5 rounded-lg border transition-all bg-white text-rose-500 hover:bg-rose-600 hover:text-white shadow-sm`}
                          title="PURGAR UNIDAD"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

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
        taskToEdit={editingTask} 
        isSubtask={!!parentTaskId} 
      />
    </div>
  );
}