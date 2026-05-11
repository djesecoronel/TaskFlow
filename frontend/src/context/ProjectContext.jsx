import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'; // Motor de enlace para el Nodo Central
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext'; 
import { TaskFactory } from '../utils/taskFactory'; 

const ProjectContext = createContext();

// CONFIGURACIÓN DE ACCESO AL NODO CENTRAL (BACKEND PYTHON)
const API_URL = "http://192.168.40.53:5000/api";

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

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Efecto de limpieza y preparación para DB real (Sincronización con Python)
  useEffect(() => {
    const initializeCore = async () => {
      try {
        setLoading(true);
        console.log("KERNEL_STATUS: Iniciando protocolo de enlace con el Nodo Central...");
        
        localStorage.removeItem('tf_projects');
        
        const response = await axios.get(`${API_URL}/tasks/`);
        
        const syncProject = {
          id: "1", 
          name: "SISTEMA_CENTRAL",
          owner: user?.email || 'operativo@taskflow.com',
          progress: 0,
          board: { columns: DEFAULT_COLUMNS },
          tasks: response.data || [],
          auditLog: [createAuditEntry('SYNC', 'Base de datos conectada')]
        };
        
        setProjects([syncProject]);
        console.log("KERNEL_STATUS: Memoria purgada y Nodo Maestro [1] sincronizado.");
      } catch (error) {
        console.error("KERNEL_CRITICAL: Error en la inicialización", error);
        setProjects([{ id: "1", name: "SISTEMA_CENTRAL", board: { columns: DEFAULT_COLUMNS }, tasks: [] }]);
      } finally {
        setLoading(false);
      }
    };
    initializeCore();
  }, [user]);

  const saveSnapshot = useCallback(() => {
    setHistory(prev => [JSON.stringify(projects), ...prev].slice(0, 10));
  }, [projects]);

  const undoLastAction = useCallback(() => {
    if (history.length === 0) return false;
    const previousState = JSON.parse(history[0]);
    setProjects(previousState);
    setHistory(prev => prev.slice(1));
    addNotification('SYSTEM', 'PROTOCOL: Acción revertida satisfactoriamente');
    return true;
  }, [history, addNotification]);

  // --- [ABSTRACT FACTORY: PERSISTENCIA DE TEMA CON IDENTIDAD] ---
  const syncThemeWithBackend = async (themeName) => {
    try {
      const currentUserId = user?.id || user?.user_id;
      console.log(`🎨 [THEME_SYNC]: Sincronizando Abstract Factory -> ${themeName.toUpperCase()}`);
      
      await axios.post(`${API_URL}/tasks/theme`, { 
        theme: themeName.toUpperCase(),
        user_id: currentUserId // Enviamos identidad al proxy
      });

      setProjects(prev => prev.map(p => 
        p.id === "1" ? { 
          ...p, 
          auditLog: [createAuditEntry('THEME_CHANGE', themeName), ...(p.auditLog || [])] 
        } : p
      ));
    } catch (error) {
      console.error("KERNEL_THEME_ERROR: Fallo de sincronización visual", error);
    }
  };

  const createAuditEntry = (action, target) => ({
    id: Date.now() + Math.random(),
    user: user?.email?.split('@')[0] || 'SISTEMA',
    action: action.toUpperCase(),
    target: target.toUpperCase(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: new Date().toISOString()
  });

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

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => ['Completado', 'col-4', 'COMPLETADO', 'DONE', 'DONE_STATUS'].includes(t.status)).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const isOwner = (projectOwnerEmail) => user?.email === projectOwnerEmail;

  const globalAuditLog = (projects || []).flatMap(p => 
    (p.auditLog || []).map(log => ({ ...log, projectName: p.name }))
  ).sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate)).slice(0, 50);

  const addProject = (project) => {
    saveSnapshot();
    const newProject = {
      ...project,
      id: "1", 
      owner: user?.email || 'user@taskflow.com', 
      progress: 0,
      members: project.members 
        ? project.members.map(m => typeof m === 'string' ? { email: m, role: 'EDITOR', status: 'ACTIVE' } : m) 
        : [{ email: user?.email, role: 'ADMIN', status: 'ACTIVE' }], 
      status: 'PLANIFICADO',
      board: { columns: DEFAULT_COLUMNS },
      tasks: [],
      auditLog: [createAuditEntry('CREACION', `Proyecto "${project.name}"`)]
    };
    
    setProjects(prev => {
      const exists = prev.find(p => p.id === "1");
      return exists ? prev.map(p => p.id === "1" ? newProject : p) : [...prev, newProject];
    });
    
    safeNotify('SYSTEM', `Unidad ${newProject.name} inicializada`, "1");
  };

  const updateProject = (projectId, updatedData) => {
    saveSnapshot();
    setProjects(prev => prev.map(proj => {
      if (proj.id === String(projectId)) {
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
      p.id === String(projectId) ? { 
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
      setProjects(prev => prev.filter(proj => proj.id !== String(projectId)));
    }
  };

  const addTask = async (projectId, taskData) => {
    saveSnapshot();
    const currentUserId = user?.id || user?.user_id;

    if (!currentUserId) {
        console.error("KERNEL_AUTH_ERROR: Identidad de operativo no detectada.");
        addNotification('SYSTEM', 'ERROR: Sesión no válida');
        return;
    }

    const newTask = TaskFactory.createTask(taskData);

    try {
      const payload = TaskFactory.toBackend(newTask, projectId, currentUserId);
      const response = await axios.post(`${API_URL}/tasks/`, payload);
      const savedTask = response.data; 

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = [...(proj.tasks || []), savedTask];
          safeNotify('ASSIGNMENT', `Tarea Sincronizada: ${savedTask.title}`, savedTask.id);
          return { 
            ...proj, 
            tasks: updatedTasks, 
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('NUEVA TAREA DB', savedTask.title), ...(proj.auditLog || [])]
          };
        }
        return proj;
      }));
    } catch (error) {
      console.error("TASK_SYNC_ERROR", error);
      addNotification('SYSTEM', 'ERROR: Fallo de persistencia');
    }
  };

  const moveTask = async (projectId, taskId, newStatus) => {
    saveSnapshot();
    try {
      await axios.post(`${API_URL}/tasks/${taskId}/move`, { column_id: newStatus });

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = proj.tasks.map(task => {
            const isMatch = (task.id === taskId || task.task_id === taskId);
            if (isMatch) {
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
            auditLog: [createAuditEntry('MOVIMIENTO DB', `TAREA -> ${newStatus}`), ...(proj.auditLog || [])]
          };
        }
        return proj;
      }));
    } catch (error) {
      console.error("MOVE_SYNC_ERROR", error);
    }
  };

  const deleteTask = async (projectId, taskId) => {
    if (!window.confirm("¿CONFIRMA ELIMINACIÓN DE TAREA EN DB?")) return;
    saveSnapshot();
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      
      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const taskToDelete = proj.tasks.find(t => (t.id === taskId || t.task_id === taskId));
          const updatedTasks = proj.tasks.filter(t => (t.id !== taskId && t.task_id !== taskId));
          safeNotify('SYSTEM', `Tarea purgada`, taskId);
          return { 
            ...proj, 
            tasks: updatedTasks, 
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('ELIMINACION DB', taskToDelete?.title || 'Tarea'), ...(proj.auditLog || [])]
          };
        }
        return proj;
      }));
    } catch (error) {
      console.error("DELETE_SYNC_ERROR", error);
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      loading,
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
      syncThemeWithBackend, 
      updateColumns: (projectId, newColumns) => {
        setProjects(prev => prev.map(proj => 
          proj.id === String(projectId) ? { ...proj, board: { ...proj.board, columns: newColumns } } : proj
        ));
      }
    }}>
      {children}
    </ProjectContext.Provider>
  );
}; // <--- Cierre de ProjectProvider corregido

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects debe usarse dentro de un ProjectProvider");
  return context;
};