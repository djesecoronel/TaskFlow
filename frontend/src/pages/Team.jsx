import { useState, useMemo, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { 
  Users, Mail, ShieldCheck, Shield, 
  Search, ExternalLink, Globe, Filter, 
  UserPlus, Edit3, Power, CheckCircle2,
  AlertCircle, LayoutGrid, X, Database, Trash2
} from 'lucide-react';

// Sub-Componente: Modal para Añadir/Editar Operativo
function MemberModal({ isOpen, onClose, onSubmit, memberToEdit, projects = [] }) {
  const { theme, isDarkMode } = useTheme(); 
  const [formData, setFormData] = useState({
    id: '', 
    name: '', 
    email: '',
    role: 'EDITOR',
    projectId: ''
  });

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        id: memberToEdit.id || '',
        name: memberToEdit.name || '',
        email: memberToEdit.email || '',
        role: memberToEdit.role || 'EDITOR',
        projectId: memberToEdit.projectId || ''
      });
    } else {
      setFormData({ id: '', name: '', email: '', role: 'EDITOR', projectId: '' });
    }
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
      <div className={`border w-full max-w-lg rounded-[3rem] p-10 relative overflow-hidden transition-all duration-500 shadow-2xl ${theme.card}`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${theme.textMain}`}>
              {memberToEdit ? 'Modificar Registro' : 'Nuevo Operativo'}
            </h2>
            <p className={`text-[8px] font-bold uppercase tracking-[0.3em] mt-1 ${theme.textSecondary}`}>RF-02.3: Gestión de Acceso de Red</p>
          </div>
          <button onClick={onClose} className={`p-3 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-white/5 text-slate-500 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-black'}`}>
            <X size={18} />
          </button>
        </div>

        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
          onClose();
        }}>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Nombre Operativo</label>
            <input 
              required
              className={`w-full border rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:border-indigo-500 transition-all ${
                isDarkMode ? 'bg-black/50 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              placeholder="E.G. ALEJANDRO CASTRO"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Identificador de Red (Email)</label>
            <input 
              required
              className={`w-full border rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:border-indigo-500 transition-all ${
                isDarkMode ? 'bg-black/50 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              placeholder="E.G. OPERATIVO@TASKFLOW.COM"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Nivel de Acceso</label>
              <select 
                className={`w-full border rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:border-indigo-500 appearance-none cursor-pointer ${
                  isDarkMode ? 'bg-black/50 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
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
                className={`w-full border rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:border-indigo-500 appearance-none cursor-pointer disabled:opacity-30 ${
                  isDarkMode ? 'bg-black/50 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
                value={formData.projectId}
                disabled={!!memberToEdit} 
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              >
                <option value="" disabled>SELECCIONAR...</option>
                <option value="1">SISTEMA_CENTRAL</option>
                {projects.filter(p => String(p.id) !== "1").map(p => (
                  <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className={`w-full py-5 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl mt-4 active:scale-95 ${
              isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' : 'bg-slate-900 hover:bg-black text-white'
            }`}
          >
            {memberToEdit ? 'Actualizar Credenciales' : 'Desplegar Operativo'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const { theme, isDarkMode } = useTheme(); 
  const projectContext = useProjects();
  const projects = projectContext?.projects || [];
  
  const globalUsers = projectContext?.globalUsers || [];
  const fetchGlobalUsers = projectContext?.fetchGlobalUsers;
  const addMemberToProject = projectContext?.addMemberToProject; 
  const updateMember = projectContext?.updateMember;
  const updateMemberStatus = projectContext?.updateMemberStatus;
  const deleteMember = projectContext?.deleteMember; // Nueva funcionalidad añadida
  const fetchProjects = projectContext?.fetchProjects; 

  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const isGlobalAdmin = currentUser?.email === 'admin@taskflow.com' || 
                        currentUser?.role === 'ADMIN' || 
                        currentUser?.email === 'davidjesecoronelhinojosa@gmail.com';

  useEffect(() => {
    console.log("DEBUG AUTH:", { email: currentUser?.email, role: currentUser?.role, isGlobalAdmin });
  }, [currentUser]);

  useEffect(() => {
    if (typeof fetchProjects === 'function') fetchProjects();
    if (typeof fetchGlobalUsers === 'function') fetchGlobalUsers();
  }, [fetchProjects, fetchGlobalUsers]);

  const allMembers = useMemo(() => {
    if (Array.isArray(globalUsers) && globalUsers.length > 0) {
      return globalUsers.map(u => {
        const assignedProj = projects.find(p => String(p.id) === String(u.projectId)) || { name: 'SISTEMA_CENTRAL', id: '1' };
        return {
          id: u.id,
          name: u.name || '',
          email: u.email,
          role: u.role || 'EDITOR',
          status: u.status || 'ACTIVE',
          projectName: assignedProj.name,
          projectId: assignedProj.id,
          isOwner: u.role === 'ADMIN'
        };
      });
    }

    return projects.flatMap(p => {
      const projectStaff = [];
      if (p.owner) {
        projectStaff.push({
          id: '',
          name: '',
          email: p.owner,
          role: 'ADMIN',
          status: p.status || 'ACTIVE',
          projectName: p.name || 'SISTEMA_CENTRAL',
          projectId: p.id,
          isOwner: true,
          projectOwnerEmail: p.owner
        });
      }
      if (Array.isArray(p.members)) {
        p.members.forEach(m => {
          const isString = typeof m === 'string';
          const targetEmail = isString ? m : (m?.email || m?.user_email || m?.name);
          if (targetEmail && targetEmail !== p.owner) {
            projectStaff.push({
              id: m?.id || '',
              name: m?.name || '',
              email: targetEmail,
              role: isString ? 'EDITOR' : (m?.role || 'EDITOR'),
              status: isString ? 'ACTIVE' : (m?.status || 'ACTIVE'), 
              projectName: p.name || 'SISTEMA_CENTRAL',
              projectId: p.id,
              isOwner: false,
              projectOwnerEmail: p.owner 
            });
          }
        });
      }
      return projectStaff;
    });
  }, [projects, globalUsers]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter(m => {
      const isAuthorized = isGlobalAdmin || 
                           (currentUser?.projectId && String(m.projectId) === String(currentUser.projectId)) ||
                           String(m.projectId) === "1"; 
      
      const projectScope = isGlobalAdmin ? filterProject : String(currentUser?.projectId || "all");
      const matchesProject = projectScope === 'all' || String(m.projectId) === String(projectScope);
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (m.email || '').toLowerCase().includes(searchTermLower) || 
                            (m.name || '').toLowerCase().includes(searchTermLower) || 
                            (m.projectName || '').toLowerCase().includes(searchTermLower);
      
      return isAuthorized && matchesProject && matchesSearch;
    });
  }, [allMembers, filterProject, searchTerm, isGlobalAdmin, currentUser?.projectId]);

  const handleToggleStatus = async (projectId, memberIdOrEmail, currentStatus) => {
    if (typeof updateMemberStatus !== 'function') return alert("Error: Operación no disponible.");
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    const targetUser = globalUsers.find(u => u.id === memberIdOrEmail || u.email === memberIdOrEmail);
    
    if (targetUser?.id) {
      await updateMemberStatus(targetUser.id, newStatus);
    } else {
      await updateMemberStatus(projectId, memberIdOrEmail, newStatus);
    }
  };

  const handleDelete = async (memberId) => {
    if (window.confirm("¿Confirmar eliminación permanente del registro?")) {
      if (typeof deleteMember === 'function') {
        await deleteMember(memberId);
      }
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  const handleModalSubmit = async (data) => {
    if (editingMember) {
      if (editingMember.id) {
        await updateMember?.(editingMember.id, { 
          email: data.email, 
          role: data.role.toUpperCase(), 
          name: data.name 
        });
      } else {
        await updateMember?.(editingMember.projectId, editingMember.email, { 
          email: data.email, 
          role: data.role.toUpperCase() 
        });
      }
    } else {
      if (typeof addMemberToProject === 'function') {
        await addMemberToProject(data.email, data.role, data.name);
      }
    }
    setEditingMember(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-1000 pb-20">
      
      <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-12 border-b relative ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-[1.8rem] border shadow-2xl transition-all ${isDarkMode ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-white border-slate-100 shadow-xl'}`}>
               <Globe size={32} className="text-indigo-500" />
            </div>
            <div>
              <h1 className={`text-6xl font-black uppercase italic tracking-tighter leading-none transition-colors duration-500 ${theme.textMain}`}>
                Global <span className="text-indigo-500 text-glow">Staff</span>
              </h1>
              <div className={`flex items-center gap-3 mt-2 font-black text-[9px] uppercase tracking-[0.4em] ${theme.textSecondary}`}>
                <Database size={12} className="text-indigo-600" /> Directorio_Red_Terciaria // Node_v2.0
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto relative z-10">
          {isGlobalAdmin && (
            <button 
              onClick={() => { setEditingMember(null); setModalOpen(true); }}
              className={`px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-xl hover:scale-105 group ${
                isDarkMode ? 'bg-white text-black hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> AÑADIR OPERATIVO
            </button>
          )}
          
          <div className="relative group">
            <Filter size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 z-10" />
            <select 
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className={`border rounded-[1.5rem] py-5 pl-14 pr-12 text-[10px] font-black uppercase outline-none appearance-none cursor-pointer w-full transition-all shadow-sm ${
                isDarkMode ? 'bg-[#0a0c10] border-slate-800 text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
              }`}
            >
              <option value="all">TODAS LAS UNIDADES</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:min-w-[280px]">
            <Search className={`absolute left-6 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`} size={18} />
            <input 
              type="text"
              placeholder="FILTRAR EN LA RED..."
              className={`w-full border rounded-[1.5rem] py-5 pl-16 pr-6 text-[10px] font-black uppercase outline-none transition-all shadow-sm ${
                isDarkMode ? 'bg-[#0a0c10] border-slate-800 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member, idx) => {
            const isInactive = member.status === 'INACTIVE';
            const initial = (member.name || member.email || "U")[0].toUpperCase();
            
            const canEdit = isGlobalAdmin || (String(member.projectId) === String(currentUser?.projectId));

            return (
              <div 
                key={`${member.projectId}-${member.email}-${idx}`}
                className={`p-8 rounded-[3.5rem] border transition-all duration-500 flex flex-col lg:flex-row items-center justify-between gap-10 group relative overflow-hidden ${
                  isInactive 
                  ? (isDarkMode ? 'bg-black/60 border-rose-900/40 grayscale opacity-60' : 'bg-slate-50 border-rose-100 grayscale opacity-60')
                  : (isDarkMode ? 'bg-[#07090d] border-slate-800/60 hover:border-indigo-500/40 hover:bg-[#0a0c10]' : 'bg-white border-slate-100 hover:border-indigo-400/50 hover:shadow-2xl shadow-sm')
                }`}
              >
                <div className="flex items-center gap-8 w-full lg:w-1/3 relative z-10">
                  <div className={`w-20 h-20 rounded-[2rem] border flex items-center justify-center text-3xl font-black italic shadow-2xl transition-all duration-500 ${
                    isInactive 
                    ? (isDarkMode ? 'bg-rose-950/20 border-rose-900/40 text-rose-800' : 'bg-rose-50 border-rose-100 text-rose-400')
                    : (isDarkMode ? 'bg-gradient-to-br from-slate-800 to-black border-slate-700 text-indigo-500' : 'bg-slate-50 border-slate-100 text-indigo-600 group-hover:scale-105')
                  }`}>
                    {initial}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      {member.name && (
                        <span className={`text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5`}>
                          {member.name}
                        </span>
                      )}
                      <div className="flex items-center gap-4">
                        <span className={`font-black text-lg tracking-tighter uppercase transition-colors ${
                          isInactive ? (isDarkMode ? 'text-slate-600' : 'text-slate-400') : theme.textMain
                        }`}>
                          {member.email}
                        </span>
                        {isInactive && (
                          <div className={`flex items-center gap-1.5 border px-3 py-1 rounded-full ${isDarkMode ? 'bg-rose-950/30 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                             <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                             <span className="text-[7px] text-rose-500 font-black tracking-widest uppercase">Disconnected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col items-center justify-center px-10 py-5 rounded-[2rem] border min-w-[280px] transition-all ${
                    isInactive ? 'opacity-20' : (isDarkMode ? 'bg-black/40 border-slate-800/40' : 'bg-slate-50 border-slate-100')
                }`}>
                  <span className={`text-[9px] font-black uppercase tracking-[0.4em] mb-2 ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>Unidad_Designada</span>
                  <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase italic tracking-widest">
                    {member.projectName}
                    <ExternalLink size={12} className={isDarkMode ? 'text-slate-800' : 'text-slate-300'} />
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end relative z-10">
                  <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${
                    member.isOwner 
                    ? 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-500/5 dark:border-amber-500/20' 
                    : isInactive 
                      ? 'text-slate-400 bg-slate-200 dark:text-slate-700 dark:bg-black/20 dark:border-white/5' 
                      : 'text-slate-500 bg-slate-50 dark:bg-black/50 border-slate-100 dark:border-white/5'
                  }`}>
                    {member.isOwner ? <ShieldCheck size={16} /> : <Shield size={16} />}
                    <span className="text-[10px] font-black uppercase italic tracking-widest">
                      {member.isOwner ? 'Project Leader' : member.role || 'Colaborador'}
                    </span>
                  </div>

                  {canEdit ? (
                    <div className={`flex items-center gap-3 pl-8 border-l ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                      <button 
                        onClick={() => openEditModal(member)}
                        className={`p-4 transition-all rounded-2xl border ${
                          isInactive 
                          ? 'text-slate-200 cursor-not-allowed opacity-20' 
                          : isDarkMode 
                              ? 'bg-slate-950 border-white/5 text-slate-400 hover:text-white hover:border-indigo-500' 
                              : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-500 shadow-sm'
                        }`}
                        disabled={isInactive}
                      >
                        <Edit3 size={20} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(member.projectId, member.id || member.email, member.status)}
                        className={`p-4 rounded-2xl transition-all border shadow-2xl ${
                          isInactive 
                          ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600' 
                          : 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white'
                        }`}
                        title={isInactive ? "Reactivar Operativo" : "Desactivar Operativo"}
                      >
                        {isInactive ? <CheckCircle2 size={22} /> : <Power size={22} />}
                      </button>
                      {isGlobalAdmin && (
                        <button 
                          onClick={() => handleDelete(member.id)}
                          className="p-4 rounded-2xl transition-all border bg-slate-900 hover:bg-red-600 border-slate-800 text-white"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pl-8 border-l border-transparent">
                      <span className="text-[8px] font-black uppercase text-slate-400 opacity-50">SISTEMA_BLOQUEADO</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={`py-40 text-center border-2 border-dashed rounded-[4rem] ${isDarkMode ? 'border-slate-900 bg-slate-950/20' : 'border-slate-200 bg-slate-50'}`}>
            <AlertCircle size={48} className={`mx-auto mb-6 opacity-30 ${isDarkMode ? 'text-slate-900' : 'text-slate-200'}`} />
            <h3 className={`font-black uppercase text-xs tracking-[0.5em] italic ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>-- Null_Staff_Response --</h3>
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