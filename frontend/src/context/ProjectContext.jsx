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

  // --- [ESTADO DEL KERNEL] ---
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- [PROTOCOLO DE INICIALIZACIÓN DE NODO] ---
  useEffect(() => {
    const initializeCore = async () => {
      try {
        setLoading(true);
        console.log("%c KERNEL_STATUS: Iniciando protocolo de enlace con el Nodo Central... ", "color: #818cf8; font-weight: bold;");
        
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
        
        // FIX: Evitamos el error de renderizado sacando el log del loop
        setTimeout(() => {
          console.log("%c KERNEL_STATUS: Memoria purgada y Nodo Maestro [1] sincronizado. ", "color: #10b981; font-weight: bold;");
        }, 0);

      } catch (error) {
        console.error("KERNEL_CRITICAL: Error en la inicialización", error);
        setProjects([{ id: "1", name: "SISTEMA_CENTRAL", board: { columns: DEFAULT_COLUMNS }, tasks: [] }]);
      } finally {
        setLoading(false);
      }
    };
    initializeCore();
  }, [user]);

  // --- [PATRÓN MEMENTO: GESTIÓN DE HISTORIAL] ---
  const saveSnapshot = useCallback(() => {
    setHistory(prev => [JSON.stringify(projects), ...prev].slice(0, 10));
  }, [projects]);

  const undoLastAction = useCallback(() => {
    if (history.length === 0) return false;
    const previousState = JSON.parse(history[0]);
    setProjects(previousState);
    setHistory(prev => prev.slice(1));
    
    // FIX: Timeout para evitar error de actualización de componente durante render
    setTimeout(() => {
      addNotification('SYSTEM', 'PROTOCOL: Acción revertida satisfactoriamente');
    }, 0);
    return true;
  }, [history, addNotification]);

  // --- [ABSTRACT FACTORY: PERSISTENCIA DE TEMA CON IDENTIDAD] ---
  const syncThemeWithBackend = async (themeName) => {
    try {
      const currentUserId = user?.id || user?.user_id || "GHOST_OPERATIVE";
      const targetTheme = String(themeName).toUpperCase();

      console.log(`%c 🎨 [THEME_SYNC]: Notificando Abstract Factory -> ${targetTheme} `, "background: #4f46e5; color: white; padding: 3px; border-radius: 4px;");
      
      await axios.post(`${API_URL}/tasks/theme`, { 
        theme: targetTheme,
        user_id: currentUserId 
      });

      setProjects(prev => prev.map(p => 
        p.id === "1" ? { 
          ...p, 
          auditLog: [createAuditEntry('THEME_CHANGE', targetTheme), ...(p.auditLog || [])] 
        } : p
      ));
    } catch (error) {
      console.error("KERNEL_THEME_ERROR: Fallo de sincronización visual", error);
    }
  };

  // --- [PATRÓN BRIDGE: INTERFAZ DE EXPORTACIÓN DE REPORTES] ---
  const exportProjectReport = async (projectId, format) => {
    console.log(`%c 🌉 [BRIDGE_REPORT]: Iniciando protocolo de descarga en formato ${format.toUpperCase()}... `, "background: #10b981; color: white; padding: 3px; border-radius: 4px;");
    
    try {
      const response = await axios({
        url: `${API_URL}/tasks/report`,
        method: 'POST',
        data: { format: format.toLowerCase() },
        responseType: 'blob', 
      });

      const fileExtension = format.toLowerCase() === 'excel' ? 'xlsx' : 'pdf';

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      
      const timestamp = new Date().toISOString().split('T')[0];
      downloadLink.setAttribute('download', `REPORT_TASKFLOW_${timestamp}.${fileExtension}`);
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      downloadLink.remove();
      window.URL.revokeObjectURL(blobUrl);

      setTimeout(() => {
        addNotification('SUCCESS', `Bridge: Reporte ${fileExtension.toUpperCase()} descargado con éxito`);
      }, 0);
      
      setProjects(prev => prev.map(p => 
        p.id === String(projectId) ? { 
          ...p, 
          auditLog: [createAuditEntry('EXPORT', fileExtension), ...(p.auditLog || [])] 
        } : p
      ));

    } catch (error) {
      console.error("❌ [BRIDGE_SYNC_ERROR]:", error);
      setTimeout(() => {
        addNotification('ERROR', 'Error en la implementación del Bridge de reportes');
      }, 0);
    }
  };

  // --- [PATRÓN ADAPTER: DISPARO DE NOTIFICACIÓN DINÁMICA] ---
  const notifyTaskByEmail = async (taskId, recipientEmail) => {
    console.log(`%c 📧 [ADAPTER_COMMAND]: Solicitando notificación para ${recipientEmail} `, "background: #f59e0b; color: black; font-weight: bold; padding: 3px; border-radius: 4px;");
    
    try {
      await axios.post(`${API_URL}/tasks/test-notifications`, {
        task_id: taskId,
        recipient: recipientEmail,
        trigger: "MANUAL_ADAPTER_COMMAND"
      });
      
      setTimeout(() => {
        addNotification('SUCCESS', `ADAPTER: Protocolo enviado a ${recipientEmail}`);
      }, 0);
    } catch (error) {
      console.error("❌ [ADAPTER_SYNC_ERROR]:", error);
      setTimeout(() => {
        addNotification('ERROR', 'Error en el túnel de notificación');
      }, 0);
    }
  };

  // --- [AUXILIARES DE AUDITORÍA Y MÉTRICAS] ---
  const createAuditEntry = (action, target) => ({
    id: Date.now() + Math.random(),
    user: user?.email?.split('@')[0] || 'SISTEMA',
    action: action.toUpperCase(),
    target: target.toUpperCase(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: new Date().toISOString()
  });

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => ['Completado', 'col-4', 'COMPLETADO', 'DONE', 'DONE_STATUS'].includes(t.status)).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const safeNotify = (type, message, taskId) => {
    const now = Date.now();
    const isDuplicate = 
      lastActionRef.current.type === type && 
      lastActionRef.current.id === taskId && 
      (now - lastActionRef.current.time) < 100;

    if (!isDuplicate) {
      // FIX CRÍTICO: Timeout 0 para sacar el update del loop de renderizado
      setTimeout(() => {
        addNotification?.(type, message, taskId);
      }, 0);
      lastActionRef.current = { id: taskId, type, time: now };
    }
  };

  const isOwner = (projectOwnerEmail) => user?.email === projectOwnerEmail;

  const globalAuditLog = (projects || []).flatMap(p => 
    (p.auditLog || []).map(log => ({ ...log, projectName: p.name }))
  ).sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate)).slice(0, 50);

  // --- [FACADE: GESTIÓN DE TAREAS Y PROYECTOS] ---
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
        setTimeout(() => {
          addNotification('SYSTEM', 'ERROR: Sesión no válida');
        }, 0);
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
      setTimeout(() => {
        addNotification('SYSTEM', 'ERROR: Fallo de persistencia');
      }, 0);
    }
  };

  const updateTask = async (projectId, taskId, updatedData) => {
    saveSnapshot();
    console.log(`%c 🔄 [MUTATION_INIT]: Actualizando unidad ${taskId}... `, "color: #6366f1; font-weight: bold;");

    try {
      const response = await axios.put(`${API_URL}/tasks/${taskId}`, updatedData);
      const synchronizedTask = response.data;

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = proj.tasks.map(t => 
            (t.id === taskId || t.task_id === taskId) ? synchronizedTask : t
          );
          return { 
            ...proj, 
            tasks: updatedTasks,
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('ACTUALIZACION DB', synchronizedTask.title), ...(proj.auditLog || [])]
          };
        }
        return proj;
      }));

      setTimeout(() => {
        addNotification('SUCCESS', `Nodo ${synchronizedTask.title} actualizado`);
      }, 0);
    } catch (error) {
      console.error("❌ [MUTATION_SYNC_ERROR]:", error);
      setTimeout(() => {
        addNotification('ERROR', 'Fallo en la mutación de unidad');
      }, 0);
    }
  };

  const addSubtask = async (projectId, parentId, subtaskData) => {
    saveSnapshot();
    const currentUserId = user?.id || user?.user_id;

    console.log(`%c 🌿 [COMPOSITE_INIT]: Ramificando subtarea bajo nodo padre ${parentId}... `, "color: #10b981; font-weight: bold;");

    try {
      const payload = {
        ...subtaskData,
        user_id: currentUserId,
        project_id: projectId
      };

      const response = await axios.post(`${API_URL}/tasks/${parentId}/subtask`, payload);
      const savedSubtask = response.data;

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = [...(proj.tasks || []), savedSubtask];
          safeNotify('COMPOSITE', `Subtarea Anclada: ${savedSubtask.title}`, savedSubtask.id);
          return { 
            ...proj, 
            tasks: updatedTasks,
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('NUEVA SUBTAREA', savedSubtask.title), ...(proj.auditLog || [])]
          };
        }
        return proj;
      }));

      setTimeout(() => {
        addNotification('SUCCESS', 'COMPOSITE: Subtarea ramificada con éxito');
      }, 0);
    } catch (error) {
      console.error("❌ [COMPOSITE_SYNC_ERROR]:", error);
      setTimeout(() => {
        addNotification('ERROR', 'Error en el protocolo de jerarquías');
      }, 0);
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
      saveSnapshot(); 

      try {
        await axios.delete(`http://192.168.40.53:5000/api/tasks/${taskId}`);

        setProjects(prev => prev.map(p => {
          if (String(p.id) === String(projectId)) {
            return { ...p, tasks: p.tasks.filter(t => (t.id || t.task_id) !== taskId) };
          }
          return p;
        }));

      } catch (error) {
        console.error("❌ [CONTEXT_ERROR]:", error);
      }
  };

  const cloneTask = async (projectId, taskId) => {
    saveSnapshot(); 
    try {
      const response = await axios.post(`${API_URL}/tasks/${taskId}/clone`);
      const duplicatedTask = response.data;

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = [...(proj.tasks || []), duplicatedTask];
          return { 
            ...proj, 
            tasks: updatedTasks,
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('CLONACION_PROTOTYPE', duplicatedTask.title), ...(proj.auditLog || [])]
          };
        }
        return proj;
      }));

      setTimeout(() => {
        addNotification('SUCCESS', 'Clonación profunda completada (Prototype)');
      }, 0);
    } catch (error) {
      console.error("❌ [CLONE_ERROR]:", error);
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
      updateTask,
      addSubtask, 
      moveTask, 
      deleteTask,
      cloneTask, 
      exportProjectReport, 
      notifyTaskByEmail, 
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
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects debe usarse dentro de un ProjectProvider");
  return context;
};