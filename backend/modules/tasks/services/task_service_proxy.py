from modules.tasks.models.itask_service import ITaskService
from modules.tasks.services.tasks_service import TaskService

class TaskServiceProxy(ITaskService):
    """
    PATRÓN PROXY: Actúa como capa de control e intermediación del TaskService real.
    
    Implementa auditoría de seguridad y logging de operaciones en tiempo real.
    Garantiza que toda interacción con el Nodo Central sea registrada antes 
    de ser procesada por el servicio de dominio.
    """

    def __init__(self, repository):
        # El Proxy orquestra la instanciación del servicio real (RealSubject)
        self._real_service = TaskService(repository)

    # --- [PROTOCOLO DE AUDITORÍA INTERNA] ---

    def _log_access(self, action: str):
        """
        LOGGING DE KERNEL: Registra en consola cada intento de acceso al sistema.
        Mantiene la trazabilidad de las operaciones del CORE_COMMAND.
        """
        print(f"🔍 [PROXY_LOG]: Operación '{action}' detectada y autorizada.")

    # --- [IMPLEMENTACIÓN DEL CONTRATO ITaskService] ---

    def create_task(self, data):
        self._log_access("CREAR_TAREA")
        return self._real_service.create_task(data)

    def create_advanced_task(self, data):
        self._log_access("CREAR_TAREA_AVANZADA (BUILDER)")
        return self._real_service.create_advanced_task(data)

    def get_task(self, task_id):
        self._log_access(f"OBTENER_DETALLE_UNIDAD: {task_id}")
        return self._real_service.get_task(task_id)

    def get_all_tasks(self):
        self._log_access("OBTENER_TODAS_LAS_UNIDADES")
        return self._real_service.get_all_tasks()

    def update_task(self, task_id, data):
        self._log_access(f"ACTUALIZAR_UNIDAD: {task_id}")
        return self._real_service.update_task(task_id, data)

    def delete_task(self, task_id):
        self._log_access(f"ELIMINAR_UNIDAD (PURGA): {task_id}")
        return self._real_service.delete_task(task_id)

    def move_task(self, task_id, column_id):
        self._log_access(f"MOVIMIENTO_KANBAN: Unidad {task_id} -> {column_id}")
        return self._real_service.move_task(task_id, column_id)

    def add_comment(self, task_id, comment):
        self._log_access(f"REGISTRO_COMENTARIO en Unidad: {task_id}")
        return self._real_service.add_comment(task_id, comment)

    def add_time_log(self, task_id, hours):
        self._log_access(f"REGISTRO_CARGA_HORARIA ({hours}h) en Unidad: {task_id}")
        return self._real_service.add_time_log(task_id, hours)

    def add_attachment(self, task_id, file):
        self._log_access(f"ANEXAR_RECURSO en Unidad: {task_id}")
        return self._real_service.add_attachment(task_id, file)

    def clone_task(self, task_id):
        self._log_access(f"CLONACIÓN_PROTOTYPE: Duplicando Unidad {task_id}")
        return self._real_service.clone_task(task_id)

    def get_deadline_hours(self, task_id):
        # Operación de lectura de métricas
        return self._real_service.get_deadline_hours(task_id)

    # --- [INTERCEPCIÓN DE ABSTRACT FACTORY VISUAL] ---

    def set_theme(self, theme_name):
        """
        Intercepción de Protocolo Visual: El Proxy audita el cambio 
        estético antes de delegar al Abstract Factory del Kernel.
        """
        self._log_access(f"CAMBIO_PROTOCOLO_VISUAL: Switch a modo {theme_name}")
        return self._real_service.set_theme(theme_name)

    # --- [ADAPTERS & NOTIFICATIONS] ---

    def add_notifier(self, notifier):
        return self._real_service.add_notifier(notifier)

    def _notify_all(self, title, message):
        return self._real_service._notify_all(title, message)

    # --- [BRIDGE & ESTRUCTURALES] ---

    def generate_report(self, format_type):
        """Auditoría de generación de reportes vía Bridge"""
        self._log_access(f"GENERACIÓN_REPORTE: Formato {format_type.upper()}")
        return self._real_service.generate_report(format_type)

    def add_subtask(self, parent_id, subtask_data):
        """Auditoría de jerarquías Composite"""
        self._log_access(f"VINCULACIÓN_COMPOSITE (SUBTAREA) al Padre: {parent_id}")
        return self._real_service.add_subtask(parent_id, subtask_data)

    def get_task_tree(self, task_id):
        return self._real_service.get_task_tree(task_id)

    def make_emergency_task(self, task_id):
        """Auditoría de Decoración Dinámica"""
        self._log_access(f"APLICACIÓN_DECORADOR_EMERGENCIA: Unidad {task_id}")
        return self._real_service.make_emergency_task(task_id)