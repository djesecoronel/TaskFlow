import { useState } from 'react';
import { 
  X, AlignLeft, Calendar, Flag, Tag, User, Clock, 
  Plus, CheckCircle2, Trash2, ListTodo, Paperclip, 
  FileText, AlertCircle, MessageSquare, Send 
} from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSave, projectMembers, initialStatus }) {
  // --- ESTADO INICIAL ---
  // CORRECCIÓN: assignedTo ahora se inicializa buscando el email si projectMembers es un array de objetos
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'MEDIA',
    type: 'TASK',
    dueDate: '',
    estimation: '',
    assignedTo: typeof projectMembers[0] === 'object' ? projectMembers[0].email : (projectMembers[0] || ''),
    status: initialStatus,
    subtasks: [],    
    attachments: [], 
    comments: []     
  });

  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // --- LÓGICA DE SUBTAREAS (RF-04.5) ---
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const sub = { id: Date.now(), title: newSubtask, completed: false };
    setTaskData({ ...taskData, subtasks: [...taskData.subtasks, sub] });
    setNewSubtask('');
  };

  const toggleSubtaskLocal = (id) => {
    const updated = taskData.subtasks.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    setTaskData({ ...taskData, subtasks: updated });
  };

  const removeSubtask = (id) => {
    setTaskData({ ...taskData, subtasks: taskData.subtasks.filter(st => st.id !== id) });
  };

  // --- LÓGICA DE ADJUNTOS (RF-04.7) ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 10 * 1024 * 1024; 
    const validFiles = [];
    let hasError = false;

    files.forEach(file => {
      if (file.size > MAX_SIZE) {
        setError(`El archivo ${file.name} supera los 10MB.`);
        hasError = true;
      } else {
        validFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2),
          type: file.type
        });
      }
    });

    if (!hasError) setError('');
    setTaskData({ ...taskData, attachments: [...taskData.attachments, ...validFiles] });
  };

  // --- LÓGICA DE COMENTARIOS (RF-04.6) ---
  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      text: newComment,
      author: "Usuario Actual", 
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTaskData({ ...taskData, comments: [comment, ...taskData.comments] });
    setNewComment('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskData.title.trim()) return;
    
    // Enviamos la data. El KanbanBoard ya se encarga de sanear si algo se escapa,
    // pero aquí ya nos aseguramos de que assignedTo sea un string.
    onSave(taskData);
    onClose();
    
    // Reset del formulario
    setTaskData({ 
      title: '', description: '', priority: 'MEDIA', type: 'TASK', 
      dueDate: '', estimation: '', 
      assignedTo: typeof projectMembers[0] === 'object' ? projectMembers[0].email : (projectMembers[0] || ''), 
      status: initialStatus, subtasks: [], attachments: [], comments: [] 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white">
              <ListTodo size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Terminal de Tarea</h2>
              <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Configuración de Requerimiento v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-full text-slate-500 transition-all hover:rotate-90"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* COLUMNA IZQUIERDA: CONTENIDO */}
          <div className="lg:col-span-7 space-y-10">
            <div className="relative group">
              <input
                autoFocus
                type="text"
                placeholder="¿QUÉ VAMOS A LOGRAR?"
                className="w-full bg-transparent text-4xl font-black text-white placeholder:text-slate-800 outline-none uppercase italic border-l-4 border-indigo-500 pl-6 focus:border-indigo-400 transition-all"
                value={taskData.title}
                onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                required
              />
            </div>

            <DataField label="Descripción del Requerimiento" icon={<AlignLeft size={14}/>}>
              <textarea
                rows="4"
                className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-slate-300 text-sm focus:border-indigo-500 outline-none resize-none transition-all"
                placeholder="Describe los detalles técnicos o funcionales..."
                value={taskData.description}
                onChange={(e) => setTaskData({...taskData, description: e.target.value})}
              />
            </DataField>

            {/* CHECKLIST */}
            <div className="space-y-4 bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800/50">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14}/> Checklist de Progreso
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Añadir paso..."
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                />
                <button type="button" onClick={addSubtask} className="p-3 bg-slate-800 text-white rounded-2xl hover:bg-indigo-600 transition-all"><Plus size={20} /></button>
              </div>
              <div className="space-y-2">
                {taskData.subtasks.map(st => (
                  <div key={st.id} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={st.completed} onChange={() => toggleSubtaskLocal(st.id)} className="w-5 h-5 rounded-lg border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500" />
                      <span className={`text-sm font-medium ${st.completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>{st.title}</span>
                    </div>
                    <button type="button" onClick={() => removeSubtask(st.id)} className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* MURO DE COMENTARIOS */}
            <div className="pt-6 border-t border-slate-800 space-y-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14}/> Muro de Comentarios
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addComment())}
                />
                <button type="button" onClick={addComment} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all">
                  <Send size={18} />
                </button>
              </div>
              <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {taskData.comments.map(c => (
                  <div key={c.id} className="bg-slate-950 p-5 rounded-[2rem] border border-slate-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase italic tracking-widest">{c.author}</span>
                      <span className="text-[9px] text-slate-600 font-bold">{c.date}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: CONFIGURACIÓN */}
          <div className="lg:col-span-5 space-y-8 bg-slate-950/30 p-8 rounded-[3rem] border border-slate-800/50">
            <div className="grid grid-cols-2 gap-6">
              <DataField label="Prioridad" icon={<Flag size={12}/>}>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white font-black outline-none appearance-none hover:border-indigo-500 transition-all" value={taskData.priority} onChange={(e) => setTaskData({...taskData, priority: e.target.value})}>
                  <option value="BAJA">🟢 BAJA</option>
                  <option value="MEDIA">🟡 MEDIA</option>
                  <option value="ALTA">🟠 ALTA</option>
                  <option value="URGENTE">🔴 URGENTE</option>
                </select>
              </DataField>
              <DataField label="Tipo" icon={<Tag size={12}/>}>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white font-black outline-none appearance-none hover:border-indigo-500 transition-all" value={taskData.type} onChange={(e) => setTaskData({...taskData, type: e.target.value})}>
                  <option value="TASK">📝 TAREA</option>
                  <option value="BUG">🐛 BUG</option>
                  <option value="FEATURE">🚀 FEATURE</option>
                </select>
              </DataField>
            </div>

            <DataField label="Asignar a" icon={<User size={12}/>}>
              {/* FIX CRÍTICO: El value del select siempre debe ser el email (m.email) */}
              <select 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white font-black outline-none appearance-none hover:border-indigo-500 transition-all" 
                value={taskData.assignedTo} 
                onChange={(e) => setTaskData({...taskData, assignedTo: e.target.value})}
              >
                {projectMembers.map(m => {
                  const email = typeof m === 'object' ? m.email : m;
                  return <option key={email} value={email}>{email}</option>;
                })}
              </select>
            </DataField>

            <div className="grid grid-cols-2 gap-6">
              <DataField label="Vencimiento" icon={<Calendar size={12}/>}>
                <input type="date" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-all" value={taskData.dueDate} onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})} />
              </DataField>
              <DataField label="Estimación" icon={<Clock size={12}/>}>
                <input type="number" placeholder="Horas" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-all" value={taskData.estimation} onChange={(e) => setTaskData({...taskData, estimation: e.target.value})} />
              </DataField>
            </div>

            {/* ADJUNTOS */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Paperclip size={14}/> Bóveda de Adjuntos (Máx 10MB)
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="cursor-pointer bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 p-4 rounded-[2rem] flex flex-col items-center justify-center w-28 h-28 transition-all group">
                  <Plus size={24} className="text-slate-700 group-hover:text-indigo-500" />
                  <span className="text-[8px] font-black text-slate-700 uppercase mt-2">Upload</span>
                  <input type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
                {taskData.attachments.map(file => (
                  <div key={file.id} className="w-28 h-28 bg-slate-800 rounded-[2rem] p-4 flex flex-col justify-between relative border border-slate-700 group hover:border-indigo-500/50 transition-all">
                    <FileText size={24} className="text-indigo-400" />
                    <div className="overflow-hidden">
                      <p className="text-[9px] text-white font-black truncate">{file.name}</p>
                      <p className="text-[8px] text-slate-500">{file.size} MB</p>
                    </div>
                    <button type="button" onClick={() => setTaskData({...taskData, attachments: taskData.attachments.filter(a => a.id !== file.id)})} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X size={10} /></button>
                  </div>
                ))}
              </div>
              {error && <p className="text-rose-500 text-[10px] font-black flex items-center gap-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20"><AlertCircle size={14}/> {error}</p>}
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-[2.5rem] uppercase text-xs tracking-[0.3em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all mt-6 active:scale-95">
              Confirmar Tarea
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