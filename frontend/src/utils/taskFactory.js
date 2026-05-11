/**
 * [PATRÓN: FACTORY METHOD]
 * Centraliza la creación de objetos complejos para asegurar consistencia
 * y facilitar la integración con el backend.
 */

export const TaskFactory = {
  /**
   * Crea un objeto de tarea estandarizado (Formato Frontend)
   */
  createTask: (data) => {
    const timestamp = Date.now();
    
    // Configuraciones por defecto según el tipo (Lógica de Fábrica)
    const typeDefaults = {
      BUG: { priority: 'URGENTE', prefix: 'BUG-' },
      FEATURE: { priority: 'ALTA', prefix: 'FEAT-' },
      TASK: { priority: 'MEDIA', prefix: 'TSK-' }
    };

    const config = typeDefaults[data.type] || typeDefaults.TASK;

    return {
      id: data.id || timestamp,
      title: data.title.toUpperCase(),
      description: data.description || '',
      status: data.status || 'TO_DO', // Sincronizado con Enum de Python
      priority: data.priority || config.priority,
      type: data.type || 'TASK',
      assignedTo: data.assignedTo || '',
      dueDate: data.dueDate || '',
      estimation: data.estimation || 0,
      parent_id: data.parent_id || null, 
      subtasks: (data.subtasks || []).map(st => ({
        id: st.id || Math.random(),
        title: st.title.toUpperCase(),
        completed: st.completed || false
      })),
      attachments: data.attachments || [],
      comments: data.comments || [],
      createdAt: data.createdAt || new Date().toISOString(),
      metadata: {
        internalCode: `${config.prefix}${timestamp.toString().slice(-4)}`,
        lastSync: null
      }
    };
  },

  /**
   * [PATRÓN: ADAPTER]
   * Traduce el objeto del sistema visual al protocolo esperado por el Nodo Central (Python/DB)
   */
  toBackend: (task, projectId, userId) => {
    return {
      title: task.title.toUpperCase(),
      description: task.description,
      status: task.status || 'TO_DO',
      priority: task.priority,
      type: task.type,
      due_date: task.dueDate || new Date().toISOString(), // Mapeo a snake_case
      user_id: userId,        // ID real del operativo
      column_id: task.column_id || null,
      parent_task: task.parent_id || null // Mapeo a nombre de columna DB
    };
  },

  /**
   * Crea un objeto de miembro de equipo estandarizado
   */
  createMember: (email, role = 'EDITOR') => {
    return {
      email,
      role,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      permissions: role === 'ADMIN' ? ['ALL'] : ['READ', 'WRITE']
    };
  }
};