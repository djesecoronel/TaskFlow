import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'; // Motor de enlace para el Nodo Central
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext'; 
import { TaskFactory } from '../utils/taskFactory'; 
import { supabase } from "../api/supabaseClient"; // Sincronizador nativo para base de datos Supabase


const ProjectContext = createContext();

// CONFIGURACIÓN DE ACCESO AL NODO CENTRAL (BACKEND PYTHON)
const API_URL = "http://192.168.40.51:5000/api";

const DEFAULT_COLUMNS = [
  { id: 'col-1', title: 'Por hacer', wipLimit: 5 },
  { id: 'col-2', title: 'En progreso', wipLimit: 3 },
  { id: 'col-3', title: 'En revisión', wipLimit: 3 },
  { id: 'col-4', title: 'Completado', wipLimit: 10 }
];

// --- NUEVA FUNCIONALIDAD: ESTRUCTURA FORMAL DEL PATRÓN OBSERVER ---
class ProjectSubject {
  constructor() {
    this.observers = [];
  }
  subscribe(observer) {
    this.observers.push(observer);
    return () => this.unsubscribe(observer);
  }
  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  notify(event, data) {
    console.log(`%c 🛰️ [OBSERVER_NOTIFY]: Emitiendo evento "${event}" a los observadores activos...`, "color: #ec4899; font-weight: bold;");
    this.observers.forEach(observer => {
      try {
        observer.update(event, data);
      } catch (err) {
        console.error("❌ Error en un observador concreto:", err);
      }
    });
  }
}

// Inicialización de la instancia del Sujeto global del Contexto
const globalProjectSubject = new ProjectSubject();

export const ProjectProvider = ({ children }) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth(); 
  
  const lastActionRef = useRef({ id: null, type: null, time: 0 });
  const [history, setHistory] = useState([]); 
  // --- [FIX DE REACTIVIDAD] ---
  const [, setTrigger] = useState(0); 

  // --- [ESTADO DEL KERNEL] ---
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NUEVA FUNCIONALIDAD: ALMACENAMIENTO DE USUARIOS DE LA TABLA GLOBAL DE SUPABASE ---
  const [globalUsers, setGlobalUsers] = useState([]);

  // Registro automático de un observador interno de auditoría como ejemplo del patrón
  useEffect(() => {
    const auditObserver = {
      update: (event, data) => {
        console.log(`%c 📜 [AUDIT_OBSERVER]: Evento interceptado -> ${event}`, "color: #f43f5e;", data);
      }
    };
    const unsubscribe = globalProjectSubject.subscribe(auditObserver);
    return () => unsubscribe();
  }, []);

  // --- [OBSERVADOR DE TIEMPO REAL - TASKS] ---
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log("%c 📡 [REALTIME_SYNC]: Cambio detectado en la nube:", "color: #f59e0b;", payload);
          
          if (payload.eventType === 'UPDATE') {
             globalProjectSubject.notify('TASK_UPDATED_REALTIME', payload.new);
             setProjects(prev => prev.map(proj => {
                if (String(proj.id) === String(payload.new.project_id)) {
                    return { ...proj, tasks: proj.tasks.map(t => t.id === payload.new.id ? payload.new : t) };
                }
                return proj;
             }));
             setTrigger(prev => prev + 1); // Forzar render
          } else if (payload.eventType === 'INSERT') {
             globalProjectSubject.notify('TASK_ADDED_REALTIME', payload.new);
             initializeCore();
          } else if (payload.eventType === 'DELETE') {
             globalProjectSubject.notify('TASK_DELETED_REALTIME', payload.old);
             initializeCore();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- [OBSERVADOR DE TIEMPO REAL - USERS] ---
  useEffect(() => {
    const channel = supabase
      .channel('users-schema-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          console.log("%c 👥 [REALTIME_USER_SYNC]: Cambio detectado en base de usuarios, refrescando...", "color: #0ea5e9;");
          fetchGlobalUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- [PROTOCOLO DE INICIALIZACIÓN DE NODO] ---
    const initializeCore = useCallback(async () => {
      try {
        setLoading(true);
        console.log("%c KERNEL_STATUS: Iniciando protocolo de enlace con Supabase... ", "color: #818cf8; font-weight: bold;");
        
        localStorage.removeItem('tf_projects');
        
        // 1. Obtener todos los proyectos
        const { data: dbProjects, error: projectError } = await supabase.from('projects').select('*');
        if (projectError) throw projectError;

        // 2. Obtener todas las tareas de una vez
        const { data: dbTasks, error: taskError } = await supabase.from('tasks').select('*');
        if (taskError) throw taskError;
        
        // 3. Reconstruir proyectos con sus tareas vinculadas
        const projectsWithTasks = (dbProjects || []).map(proj => ({
          ...proj,
          tasks: (dbTasks || []).filter(t => String(t.project_id) === String(proj.id)),
          progress: calculateProgress((dbTasks || []).filter(t => String(t.project_id) === String(proj.id))),
          board: { columns: DEFAULT_COLUMNS },
          auditLog: [createAuditEntry('SYNC', 'Base de datos conectada')]
        }));
        
        setProjects(projectsWithTasks.length > 0 ? projectsWithTasks : [{ 
          id: "1", 
          name: "SISTEMA_CENTRAL", 
          board: { columns: DEFAULT_COLUMNS }, 
          tasks: [],
          progress: 0 
        }]);
        
        globalProjectSubject.notify('CORE_SYNCED', projectsWithTasks);
        
        setTimeout(() => {
          console.log("%c KERNEL_STATUS: Memoria purgada y Nodos sincronizados. ", "color: #10b981; font-weight: bold;");
        }, 0);

      } catch (error) {
        console.error("KERNEL_CRITICAL: Error en la inicialización", error);
        setProjects([{ id: "1", name: "SISTEMA_CENTRAL", board: { columns: DEFAULT_COLUMNS }, tasks: [], progress: 0 }]);
      } finally {
        setLoading(false);
      }
    }, [user]);

    useEffect(() => {
      initializeCore();
    }, [initializeCore]);

  // --- [PATRÓN MEMENTO: GESTIÓN DE HISTORIAL] ---
  const saveSnapshot = useCallback(() => {
    setHistory(prev => [JSON.stringify(projects), ...prev].slice(0, 10));
  }, [projects]);

  const undoLastAction = useCallback(() => {
    if (history.length === 0) return false;
    const previousState = JSON.parse(history[0]);
    setProjects(previousState);
    setHistory(prev => prev.slice(1));
    
    globalProjectSubject.notify('STATE_REVERTED', previousState);
    
    setTimeout(() => {
      addNotification('SYSTEM', 'PROTOCOL: Acción revertida satisfactoriamente');
      setTrigger(p => p + 1);
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
      setTrigger(p => p + 1);
    } catch (error) {
      console.error("KERNEL_THEME_ERROR: Fallo de sincronización visual", error);
    }
  };

// --- [PATRÓN BRIDGE: INTERFAZ DE EXPORTACIÓN DE REPORTES] ---
  const exportProjectReport = async (projectId, format) => {
    console.log(`%c 🌉 [BRIDGE_REPORT]: Iniciando protocolo de descarga en formato ${format.toUpperCase()}... `, "background: #10b981; color: white; padding: 3px; border-radius: 4px;");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { projectId, format: format.toLowerCase() }
      });

      if (error) throw error;

      const fileExtension = format.toLowerCase() === 'excel' ? 'xlsx' : 'pdf';
      const blobUrl = window.URL.createObjectURL(new Blob([data]));
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
      setTrigger(p => p + 1);

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
      const { error } = await supabase.functions.invoke('send-notification', {
        body: { 
          task_id: taskId, 
          recipient: recipientEmail,
          trigger: "MANUAL_ADAPTER_COMMAND" 
        }
      });

      if (error) throw error;
      
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

  // --- [NUEVAS FUNCIONALIDADES SOLICITADAS] ---
  const archiveTask = async (projectId, taskId) => {
      saveSnapshot();
      try {
          const { error } = await supabase.from('tasks').update({ status: 'ARCHIVED' }).eq('id', taskId);
          if (error) throw error;
          
          setProjects(prev => prev.map(p => {
              if (p.id === String(projectId)) {
                  const tasks = p.tasks.filter(t => t.id !== taskId);
                  return { ...p, tasks, progress: calculateProgress(tasks) };
              }
              return p;
          }));
          addNotification('SYSTEM', 'Tarea archivada con éxito');
      } catch (err) { addNotification('ERROR', 'Fallo al archivar tarea'); }
  };

  const bulkAssignTasks = async (projectId, taskIds, targetUserId) => {
      try {
          const { error } = await supabase.from('tasks').update({ user_id: targetUserId }).in('id', taskIds);
          if (error) throw error;
          initializeCore(); // Refresco tras operación masiva
          addNotification('SUCCESS', 'Asignación masiva completada');
      } catch (err) { addNotification('ERROR', 'Error en asignación masiva'); }
  };

  const clearAuditLog = (projectId) => {
      setProjects(prev => prev.map(p => p.id === String(projectId) ? { ...p, auditLog: [] } : p));
  };

// --- [FACADE: GESTIÓN DE PROYECTOS - PERSISTENCIA REFORZADA] ---
const addProject = async (projectData) => {
  saveSnapshot();

  try {
    const payload = {
      name: projectData.name,
      owner_email: 'estudiante@test.com', 
      status: 'PLANIFICADO'
    };

    const { data: newDbProject, error } = await supabase
      .from('projects')
      .insert([payload])
      .select();

    if (error) {
      console.error("Error detallado de Supabase:", error);
      throw error;
    }

    const newProject = {
      ...newDbProject[0],
      owner: 'estudiante@test.com',
      progress: 0,
      board: { columns: DEFAULT_COLUMNS },
      tasks: [],
      auditLog: [createAuditEntry('CREACION', `Proyecto ${projectData.name}`)]
    };

    setProjects(prev => [...prev, newProject]);
    globalProjectSubject.notify('PROJECT_ADDED', { project: newProject });
    setTrigger(p => p + 1);
    
  } catch (err) {
    console.error("Error al persistir:", err);
    addNotification('ERROR', 'Fallo al inicializar unidad en la base de datos');
  }
};
    
      const updateProject = (projectId, updatedData) => {
        saveSnapshot();
        setProjects(prev => {
          const updated = prev.map(proj => {
            if (proj.id === String(projectId)) {
              return { 
                ...proj, 
                ...updatedData, 
                auditLog: [createAuditEntry('EDICION', 'Datos generales'), ...(proj.auditLog || [])]
              };
            }
            return proj;
          });
          globalProjectSubject.notify('PROJECT_UPDATED', { id: projectId, updatedData, all: updated });
          setTrigger(p => p + 1);
          return updated;
        });
      };

  const updateProjectStatus = (projectId, newStatus) => {
    saveSnapshot();
    setProjects(prev => {
      const updated = prev.map(p => 
        p.id === String(projectId) ? { 
          ...p, 
          status: newStatus,
          auditLog: [createAuditEntry('STATUS', newStatus), ...(p.auditLog || [])]
        } : p
      );
      globalProjectSubject.notify('PROJECT_STATUS_CHANGED', { id: projectId, status: newStatus, all: updated });
      setTrigger(p => p + 1);
      return updated;
    });
    safeNotify('STATUS_CHANGE', `Estado de unidad: ${newStatus}`, projectId);
  };

const deleteProject = async (projectId) => {
    if (window.confirm("¿CONFIRMA ELIMINACIÓN PERMANENTE DEL NODO EN LA BASE DE DATOS?")) {
      saveSnapshot();
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (error) throw error;

        setProjects(prev => {
          const updated = prev.filter(proj => proj.id !== String(projectId));
          globalProjectSubject.notify('PROJECT_DELETED', { id: projectId, all: updated });
          return updated;
        });
        setTrigger(p => p + 1);

        addNotification('SUCCESS', 'Unidad eliminada del repositorio central');

      } catch (err) {
        console.error("KERNEL_CRITICAL: Error al purgar proyecto en Supabase", err);
        addNotification('ERROR', 'Fallo al eliminar unidad de la base de datos');
      }
    }
  };

const addTask = async (projectId, taskData) => {
  saveSnapshot();
  const currentUserId = user?.id || user?.user_id;

  if (!currentUserId) {
    addNotification('SYSTEM', 'ERROR: Identidad de operativo no detectada');
    return;
  }

  try {
    // Se eliminó assigned_to para evitar error PGRST204
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'col-1',
        project_id: projectId,
        user_id: currentUserId,
        priority: taskData.priority || 'MEDIUM'
      }])
      .select()
      .single();

    if (error) throw error;

    setProjects(prev => prev.map(proj => {
      if (proj.id === String(projectId)) {
        const updatedTasks = [...(proj.tasks || []), data];
        const updatedProj = { 
          ...proj, 
          tasks: updatedTasks, 
          progress: calculateProgress(updatedTasks),
          auditLog: [createAuditEntry('NUEVA TAREA DB', data.title), ...(proj.auditLog || [])]
        };
        globalProjectSubject.notify('TASK_ADDED', { projectId, task: data, project: updatedProj });
        return updatedProj;
      }
      return proj;
    }));

    setTrigger(p => p + 1);
    safeNotify('ASSIGNMENT', `Tarea Creada: ${data.title}`, data.id);

  } catch (error) {
    console.error("TASK_SYNC_ERROR", error);
    addNotification('ERROR', 'Fallo al crear la tarea en la base de datos');
  }
};

  const updateTask = async (projectId, taskId, updatedData) => {
    saveSnapshot();
    
    // Eliminamos campos que no existen en el esquema para evitar error PGRST204
    const { assigned_to, ...cleanData } = updatedData;

    try {
      const { data: synchronizedTask, error } = await supabase
        .from('tasks')
        .update(cleanData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = proj.tasks.map(t => 
            (t.id === taskId) ? synchronizedTask : t
          );
          const updatedProj = { 
            ...proj, 
            tasks: updatedTasks,
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('ACTUALIZACION DB', synchronizedTask.title), ...(proj.auditLog || [])]
          };
          globalProjectSubject.notify('TASK_UPDATED', { projectId, taskId, task: synchronizedTask, project: updatedProj });
          return updatedProj;
        }
        return proj;
      }));
      setTrigger(p => p + 1);

      addNotification('SUCCESS', `Nodo ${synchronizedTask.title} actualizado en la base de datos`);
    } catch (error) {
      console.error("❌ [MUTATION_SUPABASE_ERROR]:", error);
      addNotification('ERROR', 'Fallo en la mutación de unidad en Supabase');
    }
  };

  const addSubtask = async (projectId, parentId, subtaskData) => {
    saveSnapshot();
    const currentUserId = user?.id || user?.user_id;

    console.log(`%c 🌿 [COMPOSITE_INIT]: Ramificando subtarea bajo nodo padre ${parentId}... `, "color: #10b981; font-weight: bold;");

    try {
      // Usamos el mismo patrón de limpieza de campos
      const payload = {
        title: subtaskData.title,
        description: subtaskData.description,
        status: subtaskData.status || 'col-1',
        user_id: currentUserId,
        project_id: projectId,
        parent_id: parentId
      };

      const response = await axios.post(`${API_URL}/tasks/${parentId}/subtask`, payload);
      const savedSubtask = response.data;

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = [...(proj.tasks || []), savedSubtask];
          safeNotify('COMPOSITE', `Subtarea Anclada: ${savedSubtask.title}`, savedSubtask.id);
          
          const updatedProj = { 
            ...proj, 
            tasks: updatedTasks,
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('NUEVA SUBTAREA', savedSubtask.title), ...(proj.auditLog || [])]
          };
          globalProjectSubject.notify('SUBTASK_ADDED', { projectId, parentId, subtask: savedSubtask, project: updatedProj });
          return updatedProj;
        }
        return proj;
      }));
      setTrigger(p => p + 1);

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
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) throw error;

    setProjects(prev => {
      return prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = proj.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
          return {
            ...proj,
            tasks: updatedTasks,
            progress: calculateProgress(updatedTasks)
          };
        }
        return proj;
      });
    });

  } catch (error) {
    console.error("MOVE_SYNC_ERROR", error);
    addNotification('ERROR', 'Fallo al mover la tarea');
  }
};

  const deleteTask = async (projectId, taskId) => {
    saveSnapshot(); 

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setProjects(prev => prev.map(p => {
        if (String(p.id) === String(projectId)) {
          const finalTasks = p.tasks.filter(t => (t.id !== taskId));
          const updatedProj = { ...p, tasks: finalTasks, progress: calculateProgress(finalTasks) };
          globalProjectSubject.notify('TASK_DELETED', { projectId, taskId, project: updatedProj });
          return updatedProj;
        }
        return p;
      }));
      setTrigger(p => p + 1);

      addNotification('SUCCESS', 'Nodo de tarea purgado de la base de datos');
    } catch (error) {
      console.error("❌ [SUPABASE_DELETE_ERROR]:", error);
      addNotification('ERROR', 'Fallo al purgar tarea en Supabase');
    }
  };

  const cloneTask = async (projectId, taskId) => {
    saveSnapshot(); 
    try {
      const { data: originalTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      // Limpiamos campos para la inserción
      const { id, created_at, ...taskData } = originalTask;

      const { data: clonedTask, error: insertError } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          title: `${originalTask.title} (CLON)`,
          project_id: projectId
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setProjects(prev => prev.map(proj => {
        if (proj.id === String(projectId)) {
          const updatedTasks = [...(proj.tasks || []), clonedTask];
          const updatedProj = { 
            ...proj, 
            tasks: updatedTasks,
            progress: calculateProgress(updatedTasks),
            auditLog: [createAuditEntry('CLONACION_DB', clonedTask.title), ...(proj.auditLog || [])]
          };
          globalProjectSubject.notify('TASK_CLONED', { projectId, taskId, clone: clonedTask, project: updatedProj });
          return updatedProj;
        }
        return proj;
      }));
      setTrigger(p => p + 1);

      addNotification('SUCCESS', 'Clonación profunda ejecutada en DB');
    } catch (error) {
      console.error("❌ [CLONE_SUPABASE_ERROR]:", error);
      addNotification('ERROR', 'Fallo en la clonación de nodo');
    }
  };

  const fetchGlobalUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*'); 
      
      if (error) throw error;
      setGlobalUsers(data || []);
    } catch (err) {
      console.error('Error crítico en enlace con Supabase:', err.message);
    }
  }, []);

  const addMemberToProject = async (email, role, name = 'NUEVO_OPERATIVO') => {
    try {
      const { error } = await supabase
        .from('users')
        .insert([{ 
          email: email.toLowerCase(), 
          role: role.toUpperCase(), 
          name: name.toUpperCase(),
          status: 'ACTIVE',
          projectId: user?.projectId, 
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
        }]);

      if (error) throw error;
      await fetchGlobalUsers();
      
      setTimeout(() => {
        addNotification('SUCCESS', `DB-SYNC: Operativo ${email} inyectado exitosamente`);
      }, 0);
    } catch (err) {
      console.error('Error al desplegar nuevo operativo en Supabase:', err);
    }
  };

  const updateMember = async (userId, updatedFields) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: updatedFields.role,
          email: updatedFields.email,
          name: updatedFields.name
        })
        .eq('id', userId);

      if (error) throw error;
      await fetchGlobalUsers();

      setTimeout(() => {
        addNotification('SUCCESS', 'DB-SYNC: Registro modificado correctamente');
      }, 0);
    } catch (err) {
      console.error('Error al actualizar registro en Supabase:', err);
    }
  };

  const updateMemberStatus = async (userId, newStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      await fetchGlobalUsers();

      setTimeout(() => {
        addNotification('SYSTEM', `DB-SYNC: Estado modificado a -> ${newStatus}`);
      }, 0);
    } catch (err) {
      console.error('Error al modificar estado en Supabase:', err);
    }
  };

  const deleteMember = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      await fetchGlobalUsers();

      setTimeout(() => {
        addNotification('SUCCESS', 'DB-SYNC: Operativo eliminado exitosamente');
      }, 0);
    } catch (err) {
      console.error('Error al purgar registro de la base de datos:', err);
      setTimeout(() => {
        addNotification('ERROR', 'Error al eliminar el operativo');
      }, 0);
    }
  };

  useEffect(() => {
    fetchGlobalUsers();
  }, [fetchGlobalUsers]);

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
      projectSubject: globalProjectSubject,
      globalUsers,
      fetchGlobalUsers,
      addMemberToProject,
      updateMember,
      updateMemberStatus,
      deleteMember,
      refreshContext: initializeCore,
      archiveTask,
      bulkAssignTasks,
      clearAuditLog,
      updateColumns: (projectId, newColumns) => {
        setProjects(prev => {
          const updated = prev.map(proj => 
            proj.id === String(projectId) ? { ...proj, board: { ...proj.board, columns: newColumns } } : proj
          );
          globalProjectSubject.notify('COLUMNS_UPDATED', { projectId, newColumns, all: updated });
          setTrigger(p => p + 1);
          return updated;
        });
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