import { useState, useEffect } from 'react'; // Inyectamos useEffect para la detección de estado
import { 
  X, AlignLeft, Calendar, Flag, Tag, User, Clock, 
  Plus, CheckCircle2, Trash2, ListTodo, Paperclip, 
  FileText, AlertCircle, MessageSquare, Send, GitBranch, Edit3 
} from 'lucide-react';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  projectMembers = [], 
  initialStatus, 
  allTasks = [],
  taskToEdit = null, // <--- INYECTADO: PARA MODO EDICIÓN
  isSubtask = false  // <--- INYECTADO: PARA MODO COMPOSITE
}) {
  
  // --- FUNCIÓN DE EXTRACTOR DE IDENTIDAD (DEFENSIVA) ---
  const getInitialAssignee = () => {
    if (!projectMembers || projectMembers.length === 0) return '';
    const firstMember = projectMembers[0];
    return typeof firstMember === 'object' ? (firstMember.email || '') : (firstMember || '');
  };

  // --- ESTADO INICIAL (PATRÓN BUILDER CON PROTECCIÓN) ---
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'MEDIA',
    type: 'TASK',
    dueDate: '',
    estimation: '',
    assignedTo: getInitialAssignee(),
    status: initialStatus || 'TO_DO',
    parent_id: null, 
    subtasks: [],    
    attachments: [], 
    comments: []     
  });

  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');

  // --- [EFECTO DE CARGA DE PROTOCOLO: EDICIÓN VS CREACIÓN] ---
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        // MODO MUTACIÓN: Mapeamos los datos existentes al Builder
        setTaskData({
          ...taskToEdit,
          assignedTo: taskToEdit.assignedTo || taskToEdit.assigned_to || getInitialAssignee(),
          status: taskToEdit.status || initialStatus
        });
      } else {
        // MODO CREACIÓN: Reset de terminal
        resetForm();
      }
    }
  }, [isOpen, taskToEdit, initialStatus]);

  if (!isOpen) return null;

  // --- LÓGICA DE SUBTAREAS (COMPOSITE INTERNO) ---
  const addSubtaskLocal = () => {
    if (!newSubtask.trim()) return;
    const sub = { id: Date.now(), title: newSubtask.toUpperCase(), completed: false };
    setTaskData({ ...taskData, subtasks: [...(taskData.subtasks || []), sub] });
    setNewSubtask('');
  };

  const toggleSubtaskLocal = (id) => {
    const updated = taskData.subtasks.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    setTaskData({ ...taskData, subtasks: updated });
  };

  // --- LÓGICA DE ADJUNTOS (BUILDER: AGREGAR PIEZAS) ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: file.type
    })).filter(f => parseFloat(f.size) <= 10);

    setTaskData({ ...taskData, attachments: [...(taskData.attachments || []), ...validFiles] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskData.title.trim()) return;
    
    // Disparamos la carga útil hacia el Kernel
    onSave(taskData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setTaskData({ 
      title: '', description: '', priority: 'MEDIA', type: 'TASK', 
      dueDate: '', estimation: '', parent_id: null,
      assignedTo: getInitialAssignee(), 
      status: initialStatus || 'TO_DO', subtasks: [], attachments: [], comments: [] 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER PROTOCOLARIO DINÁMICO */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg text-white ${taskToEdit ? 'bg-indigo-500' : isSubtask ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
              {taskToEdit ? <Edit3 size={24} /> : isSubtask ? <GitBranch size={24} /> : <ListTodo size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                {taskToEdit ? 'Modificar Unidad' : isSubtask ? 'Nueva Subtarea' : 'Terminal de Tarea'}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                  {taskToEdit ? 'Protocolo: Mutación de Datos' : 'Patrón Builder: Configuración de Objeto'}
                </p>
                {isSubtask && (
                  <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                    Vínculo: Subtarea
                  </span>
                )}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-3 hover:bg-slate-800 rounded-full text-slate-500 transition-all hover:rotate-90"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-7 space-y-10">
            <input
              autoFocus
              type="text"
              placeholder="¿QUÉ VAMOS A LOGRAR?"
              className="w-full bg-transparent text-4xl font-black text-white placeholder:text-slate-800 outline-none uppercase italic border-l-4 border-indigo-500 pl-6 focus:border-indigo-400 transition-all"
              value={taskData.title}
              onChange={(e) => setTaskData({...taskData, title: e.target.value})}
              required
            />

            <DataField label="Estructura Jerárquica (Composite)" icon={<GitBranch size={14}/>}>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-indigo-400 font-black outline-none focus:border-indigo-500 transition-all"
                value={taskData.parent_id || ''}
                onChange={(e) => setTaskData({...taskData, parent_id: e.target.value || null})}
                disabled={isSubtask || taskToEdit} // Bloqueamos jerarquía si ya viene definida
              >
                <option value="">TAREA INDEPENDIENTE (NODO RAÍZ)</option>
                {allTasks && allTasks.map(t => (
                  <option key={t.id || t.task_id} value={t.id || t.task_id}>SUBTAREA DE: {t.title?.toUpperCase() || 'UNTITLED'}</option>
                ))}
              </select>
            </DataField>

            <DataField label="Descripción del Requerimiento" icon={<AlignLeft size={14}/>}>
              <textarea
                rows="4"
                className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-slate-300 text-sm focus:border-indigo-500 outline-none resize-none transition-all"
                placeholder="Detalles técnicos..."
                value={taskData.description}
                onChange={(e) => setTaskData({...taskData, description: e.target.value})}
              />
            </DataField>

            <div className="space-y-4 bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800/50">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14}/> Checklist de Progreso</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Añadir paso..."
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                />
                <button type="button" onClick={addSubtaskLocal} className="p-3 bg-indigo-600 text-white rounded-2xl transition-all"><Plus size={20} /></button>
              </div>
              
              {/* RENDER DE CHECKLIST LOCAL */}
              <div className="space-y-2 mt-4">
                {taskData.subtasks && taskData.subtasks.map(st => (
                   <div key={st.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                      <input type="checkbox" checked={st.completed} onChange={() => toggleSubtaskLocal(st.id)} className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500" />
                      <span className={`text-xs font-bold uppercase ${st.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{st.title}</span>
                   </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="lg:col-span-5 space-y-8 bg-slate-950/30 p-8 rounded-[3rem] border border-slate-800/50">
            <div className="grid grid-cols-2 gap-6">
              <DataField label="Prioridad" icon={<Flag size={12}/>}>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white font-black outline-none" value={taskData.priority} onChange={(e) => setTaskData({...taskData, priority: e.target.value})}>
                  <option value="BAJA">🟢 BAJA</option>
                  <option value="MEDIA">🟡 MEDIA</option>
                  <option value="ALTA">🟠 ALTA</option>
                  <option value="URGENTE">🔴 URGENTE</option>
                </select>
              </DataField>
              <DataField label="Tipo (Factory)" icon={<Tag size={12}/>}>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white font-black outline-none" value={taskData.type} onChange={(e) => setTaskData({...taskData, type: e.target.value})}>
                  <option value="TASK">📝 TAREA</option>
                  <option value="BUG">🐛 BUG</option>
                  <option value="FEATURE">🚀 FEATURE</option>
                </select>
              </DataField>
            </div>

            <DataField label="Asignar a" icon={<User size={12}/>}>
              <select 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white font-black outline-none" 
                value={taskData.assignedTo} 
                onChange={(e) => setTaskData({...taskData, assignedTo: e.target.value})}
              >
                {!projectMembers || projectMembers.length === 0 ? (
                  <option value="">SIN OPERATIVOS</option>
                ) : (
                  projectMembers.map((m, idx) => {
                    const email = typeof m === 'object' ? m.email : m;
                    return <option key={idx} value={email}>{email}</option>;
                  })
                )}
              </select>
            </DataField>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14}/> Bóveda de Adjuntos</label>
              <div className="flex flex-wrap gap-4">
                <label className="cursor-pointer bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 p-4 rounded-[2rem] flex flex-col items-center justify-center w-24 h-24 transition-all">
                  <Plus size={20} className="text-slate-700" />
                  <input type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
                {taskData.attachments && taskData.attachments.map(file => (
                  <div key={file.id} className="w-24 h-24 bg-slate-800 rounded-[2rem] p-3 flex flex-col justify-between relative border border-slate-700">
                    <FileText size={20} className="text-indigo-400" />
                    <p className="text-[8px] text-white font-black truncate uppercase">{file.name}</p>
                    <button type="button" onClick={() => setTaskData({...taskData, attachments: taskData.attachments.filter(a => a.id !== file.id)})} className="absolute -top-1 -right-1 bg-rose-500 p-1 rounded-full"><X size={8} /></button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className={`w-full text-white font-black py-6 rounded-[2.5rem] uppercase text-[10px] tracking-[0.3em] shadow-xl transition-all active:scale-95 ${taskToEdit ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
              {taskToEdit ? 'Sincronizar Cambios' : 'Confirmar Requerimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DataField({ label, icon, children }) {
  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 italic">{icon} {label}</label>
      {children}
    </div>
  );
}