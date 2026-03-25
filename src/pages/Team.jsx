import { useState, useMemo, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Mail, ShieldCheck, Shield, 
  Search, ExternalLink, Globe, Filter, 
  UserPlus, Edit3, Power, CheckCircle2,
  AlertCircle, LayoutGrid, X, Database
} from 'lucide-react';

// Sub-Componente: Modal para Añadir/Editar Operativo
function MemberModal({ isOpen, onClose, onSubmit, memberToEdit, projects = [] }) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'EDITOR',
    projectId: ''
  });

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        email: memberToEdit.email || '',
        role: memberToEdit.role || 'EDITOR',
        projectId: memberToEdit.projectId || ''
      });
    } else {
      setFormData({ email: '', role: 'EDITOR', projectId: '' });
    }
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-[3rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
              {memberToEdit ? 'Modificar Registro' : 'Nuevo Operativo'}
            </h2>
            <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">RF-02.3: Gestión de Acceso de Red</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/5">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
          onClose();
        }}>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Identificador de Red (Email)</label>
            <input 
              required
              className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-6 text-[11px] font-bold text-slate-900 dark:text-white uppercase outline-none focus:border-indigo-500 transition-all"
              placeholder="E.G. OPERATIVO@TASKFLOW.COM"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Nivel de Acceso</label>
              <select 
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-6 text-[11px] font-bold text-slate-900 dark:text-white uppercase outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Unidad Asignada</label>
              <select 
                required
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-6 text-[11px] font-bold text-slate-900 dark:text-white uppercase outline-none focus:border-indigo-500 appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                value={formData.projectId}
                disabled={!!memberToEdit} 
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              >
                <option value="" disabled>SELECCIONAR...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20 mt-4 active:scale-95"
          >
            {memberToEdit ? 'Actualizar Credenciales' : 'Desplegar Operativo'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const projectContext = useProjects();
  const projects = projectContext?.projects || [];
  const updateMemberStatus = projectContext?.updateMemberStatus;
  const addMemberToProject = projectContext?.addMemberToProject;
  const updateMember = projectContext?.updateMember;

  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const isGlobalAdmin = currentUser?.email === 'admin@taskflow.com' || currentUser?.role === 'ADMIN';

  const allMembers = useMemo(() => {
    return projects.flatMap(p => {
      if (!p?.members) return [];
      return p.members.map(m => {
        const memberObj = typeof m === 'string' ? { email: m, role: 'EDITOR', status: 'ACTIVE' } : m;
        return {
          ...memberObj,
          email: memberObj?.email || 'N/A',
          status: memberObj?.status || 'ACTIVE', 
          projectName: p.name || 'NODO_UNKN',
          projectId: p.id,
          isOwner: p.owner === memberObj.email,
          projectOwnerEmail: p.owner 
        };
      });
    });
  }, [projects]);

  const filteredMembers = allMembers.filter(m => {
    const matchesProject = filterProject === 'all' || String(m.projectId) === String(filterProject);
    const matchesSearch = m.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const handleToggleStatus = (projectId, memberEmail, currentStatus) => {
    if (typeof updateMemberStatus !== 'function') return alert("Error: Función de actualización no disponible.");
    if (currentStatus === 'INACTIVE' && !isGlobalAdmin) return alert("PROTOCOLO DENEGADO: Solo el ADMIN puede reactivar operativos.");
    
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateMemberStatus(projectId, memberEmail, newStatus);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  const handleModalSubmit = (data) => {
    if (editingMember) {
      updateMember?.(editingMember.projectId, editingMember.email, { email: data.email, role: data.role.toUpperCase() });
    } else {
      addMemberToProject?.(data.projectId, data.email);
    }
    setEditingMember(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-1000 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-12 border-b border-slate-200 dark:border-slate-800/60 relative">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-indigo-600/10 rounded-[1.8rem] border border-indigo-500/20 shadow-2xl">
               <Globe size={32} className="text-indigo-500" />
            </div>
            <div>
              <h1 className="text-6xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none transition-colors duration-500">
                Global <span className="text-indigo-500 text-glow">Staff</span>
              </h1>
              <div className="flex items-center gap-3 mt-2 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                <Database size={12} className="text-indigo-600" /> Directorio_Red_Terciaria // Node_v2.0
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto relative z-10">
          {isGlobalAdmin && (
            <button 
              onClick={() => { setEditingMember(null); setModalOpen(true); }}
              className="px-10 py-5 bg-indigo-600 text-white dark:bg-white dark:text-black rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-xl hover:bg-indigo-500 hover:scale-105 group"
            >
              <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> AÑADIR OPERATIVO
            </button>
          )}
          <div className="relative group">
            <Filter size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 z-10" />
            <select 
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] py-5 pl-14 pr-12 text-[10px] font-black text-slate-900 dark:text-white uppercase outline-none focus:border-indigo-500 appearance-none cursor-pointer w-full group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-all shadow-sm"
            >
              <option value="all">TODAS LAS UNIDADES</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 md:min-w-[280px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700" size={18} />
            <input 
              type="text"
              placeholder="FILTRAR EN LA RED..."
              className="w-full bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] py-5 pl-16 pr-6 text-[10px] font-black text-slate-900 dark:text-white uppercase outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 gap-6">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member, idx) => {
            const isInactive = member.status === 'INACTIVE';
            const canManage = isGlobalAdmin || (currentUser?.email === member.projectOwnerEmail && !member.isOwner);
            const initial = (member.email || "U")[0].toUpperCase();

            return (
              <div 
                key={`${member.projectId}-${member.email}-${idx}`}
                className={`p-8 rounded-[3.5rem] border transition-all duration-500 flex flex-col lg:flex-row items-center justify-between gap-10 group relative overflow-hidden ${
                  isInactive 
                  ? 'bg-slate-100 dark:bg-black/60 border-rose-200 dark:border-rose-900/40 grayscale opacity-60' 
                  : 'bg-white dark:bg-[#07090d] border-slate-100 dark:border-slate-800/60 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/5 dark:hover:bg-[#0a0c10]'
                }`}
              >
                <div className="flex items-center gap-8 w-full lg:w-1/3 relative z-10">
                  <div className={`w-20 h-20 rounded-[2rem] border flex items-center justify-center text-3xl font-black italic shadow-2xl transition-all duration-500 ${
                    isInactive 
                    ? 'bg-rose-100 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-400 dark:text-rose-800' 
                    : 'bg-slate-50 dark:bg-gradient-to-br dark:from-slate-800 dark:to-black border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-500 group-hover:scale-105'
                  }`}>
                    {initial}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-lg tracking-tighter uppercase transition-colors ${isInactive ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
                        {member.email}
                      </span>
                      {isInactive && (
                        <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20 px-3 py-1 rounded-full">
                           <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                           <span className="text-[7px] text-rose-500 font-black tracking-widest uppercase">Disconnected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col items-center justify-center bg-slate-50 dark:bg-black/40 px-10 py-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 min-w-[280px] transition-all ${isInactive ? 'opacity-20' : ''}`}>
                  <span className="text-[9px] text-slate-400 dark:text-slate-700 font-black uppercase tracking-[0.4em] mb-2">Unidad_Designada</span>
                  <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase italic tracking-widest">
                    {member.projectName}
                    <ExternalLink size={12} className="text-slate-300 dark:text-slate-800" />
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end relative z-10">
                  <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${
                    member.isOwner ? 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-500/5 dark:border-amber-500/20' : 
                    isInactive ? 'text-slate-400 bg-slate-200 dark:text-slate-700 dark:bg-black/20 dark:border-white/5' : 'text-slate-500 bg-slate-50 dark:bg-black/50 border-slate-100 dark:border-white/5'
                  }`}>
                    {member.isOwner ? <ShieldCheck size={16} /> : <Shield size={16} />}
                    <span className="text-[10px] font-black uppercase italic tracking-widest">
                      {member.isOwner ? 'Project Leader' : member.role || 'Colaborador'}
                    </span>
                  </div>

                  {canManage && member.email !== currentUser?.email && (
                    <div className="flex items-center gap-3 pl-8 border-l border-slate-200 dark:border-slate-800/60">
                      <button 
                        onClick={() => openEditModal(member)}
                        className={`p-4 transition-all rounded-2xl border ${isInactive ? 'text-slate-200 cursor-not-allowed opacity-20' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-500'}`}
                        disabled={isInactive}
                      >
                        <Edit3 size={20} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(member.projectId, member.email, member.status)}
                        className={`p-4 rounded-2xl transition-all border shadow-2xl ${
                          isInactive 
                          ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600' 
                          : 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white'
                        }`}
                        title={isInactive ? "Reactivar Nodo" : "Desactivar Nodo"}
                      >
                        {isInactive ? <CheckCircle2 size={22} /> : <Power size={22} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-slate-200 dark:border-slate-900 rounded-[4rem] bg-slate-50 dark:bg-slate-950/20">
            <AlertCircle size={48} className="mx-auto text-slate-200 dark:text-slate-900 mb-6 opacity-30" />
            <h3 className="text-slate-400 dark:text-slate-700 font-black uppercase text-xs tracking-[0.5em] italic">-- Null_Staff_Response --</h3>
          </div>
        )}
      </div>

      <MemberModal 
        isOpen={modalOpen} 
        onClose={() => { setModalOpen(false); setEditingMember(null); }} 
        onSubmit={handleModalSubmit}
        memberToEdit={editingMember}
        projects={projects}
      />
    </div>
  );
}