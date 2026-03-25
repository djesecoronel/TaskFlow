import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext'; 

const ProjectContext = createContext();

const DEFAULT_COLUMNS = [
  { id: 'col-1', title: 'Por hacer', wipLimit: 5 },
  { id: 'col-2', title: 'En progreso', wipLimit: 3 },
  { id: 'col-3', title: 'En revisión', wipLimit: 3 },
  { id: 'col-4', title: 'Completado', wipLimit: 10 }
];

export const ProjectProvider = ({ children }) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth(); 
  
  const lastActionRef = useRef({ id: null, type: null, time: 0 });
  const [history, setHistory] = useState([]); 

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('tf_projects');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        name: 'SISTEMA DE INVENTARIOS', 
        owner: 'admin@taskflow.com', 
        description: 'Gestión de stock en tiempo real', 
        startDate: '2026-03-01', 
        endDate: '2026-06-01',
        status: 'EN CURSO',
        progress: 0,
        members: [{ email: 'admin@taskflow.com', role: 'ADMIN', status: 'ACTIVE' }], 
        board: { columns: DEFAULT_COLUMNS },
        tasks: [],
        auditLog: [] 
      }
    ];
  });

  // --- UTILIDADES INTERNAS ---
  const createAuditEntry = (action, target) => ({
    id: Date.now() + Math.random(),
    user: user?.email?.split('@')[0] || 'SISTEMA',
    action: action.toUpperCase(),
    target: target.toUpperCase(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: new Date().toISOString()
  });

  const saveSnapshot = () => {
    setHistory(prev => [JSON.stringify(projects), ...prev].slice(0, 10));
  };

  const undoLastAction = () => {
    if (history.length === 0) return false;
    const previousState = JSON.parse(history[0]);
    setProjects(previousState);
    setHistory(prev => prev.slice(1));
    addNotification('SYSTEM', 'Protocolo deshecho correctamente');
    return true;
  };

  const safeNotify = (type, message, taskId) => {
    const now = Date.now();
    const isDuplicate = 
      lastActionRef.current.type === type && 
      lastActionRef.current.id === taskId && 
      (now - lastActionRef.current.time) < 100;

    if (!isDuplicate) {
      addNotification?.(type, message, taskId);
      lastActionRef.current = { id: taskId, type, time: now };
    }
  };

  useEffect(() => {
    localStorage.setItem('tf_projects', JSON.stringify(projects));
  }, [projects]);

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => ['Completado', 'col-4', 'COMPLETADO', 'DONE'].includes(t.status)).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const isOwner = (projectOwnerEmail) => user?.email === projectOwnerEmail;

  const globalAuditLog = (projects || []).flatMap(p => 
    (p.auditLog || []).map(log => ({ ...log, projectName: p.name }))
  ).sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate)).slice(0, 50);

  // --- GESTIÓN DE PROYECTOS ---
  const addProject = (project) => {
    saveSnapshot();
    const newProject = {
      ...project,
      id: Date.now(),
      owner: user?.email || 'admin@taskflow.com', 
      progress: 0,
      members: project.members 
        ? project.members.map(m => typeof m === 'string' ? { email: m, role: 'EDITOR', status: 'ACTIVE' } : m) 
        : [{ email: user?.email, role: 'ADMIN', status: 'ACTIVE' }], 
      status: 'PLANIFICADO',
      board: { columns: DEFAULT_COLUMNS },
      tasks: [],
      auditLog: [createAuditEntry('CREACION', `Proyecto "${project.name}"`)]
    };
    setProjects([...projects, newProject]);
    safeNotify('SYSTEM', `Proyecto ${newProject.name} desplegado`, newProject.id);
  };

  const updateProject = (projectId, updatedData) => {
    saveSnapshot();
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        return { 
          ...proj, 
          ...updatedData, 
          auditLog: [createAuditEntry('EDICION', 'Datos generales'), ...(proj.auditLog || [])]
        };
      }
      return proj;
    }));
  };

  const updateProjectStatus = (projectId, newStatus) => {
    saveSnapshot();
    setProjects(prev => prev.map(p => 
      Number(p.id) === Number(projectId) ? { 
        ...p, 
        status: newStatus,
        auditLog: [createAuditEntry('STATUS', newStatus), ...(p.auditLog || [])]
      } : p
    ));
    safeNotify('STATUS_CHANGE', `Estado de unidad: ${newStatus}`, projectId);
  };

  const deleteProject = (projectId) => {
    if (window.confirm("¿CONFIRMA ELIMINACIÓN PERMANENTE DEL NODO?")) {
      saveSnapshot();
      setProjects(prev => prev.filter(proj => Number(proj.id) !== Number(projectId)));
    }
  };

  // --- GESTIÓN DE MIEMBROS ALPHA (Corregido para reactividad) ---
  const addMemberToProject = (projectId, email) => {
    saveSnapshot();
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        const isAlreadyMember = proj.members.some(m => m.email === email);
        if (!isAlreadyMember) {
          const newMember = { email, role: 'EDITOR', status: 'ACTIVE' };
          return { 
            ...proj, 
            members: [...proj.members, newMember],
            auditLog: [createAuditEntry('ACCESO', `Alta de ${email}`), ...(proj.auditLog || [])]
          };
        }
      }
      return proj;
    }));
    safeNotify('SYSTEM', `Usuario ${email} asignado a unidad`, projectId);
  };

  const updateMemberStatus = (projectId, email, newStatus) => {
    saveSnapshot();
    setProjects(prev => {
      const updatedProjects = prev.map(proj => {
        if (Number(proj.id) === Number(projectId)) {
          // Buscamos y actualizamos el status del miembro específico
          const updatedMembers = proj.members.map(m => 
            m.email === email ? { ...m, status: newStatus } : m
          );
          
          return { 
            ...proj, 
            members: updatedMembers,
            auditLog: [createAuditEntry(newStatus, `Usuario: ${email}`), ...(proj.auditLog || [])]
          };
        }
        return proj;
      });
      return updatedProjects;
    });
    safeNotify('SYSTEM', `Operativo ${email} marcado como ${newStatus}`, projectId);
  };

  const updateMember = (projectId, oldEmail, newData) => {
    saveSnapshot();
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        return {
          ...proj,
          members: proj.members.map(m => 
            m.email === oldEmail ? { ...m, ...newData } : m
          ),
          auditLog: [createAuditEntry('MODIFICACION', `Perfil de ${oldEmail}`), ...(proj.auditLog || [])]
        };
      }
      return proj;
    }));
    safeNotify('SYSTEM', `Credenciales de ${oldEmail} actualizadas`, projectId);
  };

  const removeMember = (projectId, email) => {
    saveSnapshot();
    setProjects(prev => prev.map(p => 
      Number(p.id) === Number(projectId) ? { 
        ...p, 
        members: p.members.filter(m => m.email !== email),
        auditLog: [createAuditEntry('REMOCION', email), ...(p.auditLog || [])]
      } : p
    ));
  };

  // --- GESTIÓN DE TAREAS ---
  const addTask = (projectId, taskData) => {
    saveSnapshot();
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        const newTask = { 
          ...taskData, 
          id: Date.now(), 
          subtasks: taskData.subtasks || [], 
          comments: [],
          createdAt: new Date().toISOString() 
        };
        const updatedTasks = [...(proj.tasks || []), newTask];
        safeNotify('ASSIGNMENT', `Nueva tarea: ${newTask.title}`, newTask.id);
        return { 
          ...proj, 
          tasks: updatedTasks, 
          progress: calculateProgress(updatedTasks),
          auditLog: [createAuditEntry('NUEVA TAREA', newTask.title), ...(proj.auditLog || [])]
        };
      }
      return proj;
    }));
  };

  const moveTask = (projectId, taskId, newStatus) => {
    saveSnapshot();
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        let logTarget = "";
        const updatedTasks = proj.tasks.map(task => {
          if (task.id === taskId) {
            logTarget = `${task.title} A ${newStatus}`;
            if (task.status !== newStatus) {
              safeNotify('STATUS_CHANGE', `Movida a ${newStatus}`, taskId);
            }
            return { ...task, status: newStatus };
          }
          return task;
        });
        return { 
          ...proj, 
          tasks: updatedTasks, 
          progress: calculateProgress(updatedTasks),
          auditLog: [createAuditEntry('MOVIMIENTO', logTarget), ...(proj.auditLog || [])]
        };
      }
      return proj;
    }));
  };

  const deleteTask = (projectId, taskId) => {
    if (!window.confirm("¿CONFIRMA ELIMINACIÓN DE TAREA?")) return;
    saveSnapshot();
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        const taskToDelete = proj.tasks.find(t => t.id === taskId);
        const updatedTasks = proj.tasks.filter(t => t.id !== taskId);
        safeNotify('SYSTEM', `Tarea purgada del sistema`, taskId);
        return { 
          ...proj, 
          tasks: updatedTasks, 
          progress: calculateProgress(updatedTasks),
          auditLog: [createAuditEntry('ELIMINACION', taskToDelete?.title || 'Tarea'), ...(proj.auditLog || [])]
        };
      }
      return proj;
    }));
  };

  const toggleSubtask = (projectId, taskId, subtaskId) => {
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        const updatedTasks = proj.tasks.map(task => {
          if (task.id === taskId) {
            const updatedSubtasks = task.subtasks.map(st => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            return { ...task, subtasks: updatedSubtasks };
          }
          return task;
        });
        return { ...proj, tasks: updatedTasks };
      }
      return proj;
    }));
  };

  const addCommentToTask = (projectId, taskId, commentData) => {
    setProjects(prev => prev.map(proj => {
      if (Number(proj.id) === Number(projectId)) {
        const updatedTasks = proj.tasks.map(task => {
          if (task.id === taskId) {
            safeNotify('COMMENT', `Comentario registrado en: ${task.title}`, taskId);
            return { ...task, comments: [commentData, ...(task.comments || [])] };
          }
          return task;
        });
        return { ...proj, tasks: updatedTasks };
      }
      return proj;
    }));
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      auditLog: globalAuditLog,
      addProject, 
      updateProject, 
      updateProjectStatus, 
      deleteProject,
      isOwner, 
      undoLastAction, 
      historyLength: history.length,
      addTask, 
      moveTask, 
      deleteTask,
      inviteMember: addMemberToProject, 
      addMemberToProject,
      updateMemberStatus,
      updateMember, 
      removeMember,
      updateColumns: (projectId, newColumns) => {
        setProjects(prev => prev.map(proj => 
          Number(proj.id) === Number(projectId) ? { ...proj, board: { ...proj.board, columns: newColumns } } : proj
        ));
      },
      toggleSubtask, 
      addCommentToTask
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects debe usarse dentro de un ProjectProvider");
  }
  return context;
};