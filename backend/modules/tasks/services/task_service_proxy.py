from modules.tasks.models.itask_service import ITaskService
from modules.tasks.services.tasks_service import TaskService

class TaskServiceProxy(ITaskService):
    """
    🛡️ [PATRÓN PROXY]: CAPA DE BLINDAJE Y TELEMETRÍA.
    
    Actúa como el Centinela del Nodo Central. No procesa lógica de negocio,
    pero garantiza que toda operación del CORE_COMMAND sea auditada,
    validada y registrada antes de tocar el RealSubject (TaskService).
    """

    def __init__(self, repository):
        # Instanciación controlada del servicio de dominio
        self._real_service = TaskService(repository)

    # --- [PROTOCOLO DE TELEMETRÍA DE KERNEL] ---

    def _log_access(self, action: str, details: str = "N/A"):
        """
        REGISTRO DE MISIÓN: Estampa una marca de tiempo y acción en el log del sistema.
        """
        header = f"🔍 [PROXY_AUDIT]"
        print(f"{header} %c OPERACIÓN: {action.upper()} ", "background: #1e293b; color: #818cf8; font-weight: bold;")
        if details != "N/A":
            print(f"{header} %c DETALLES: {details} ", "color: #94a3b8; italic;")

    # --- [IMPLEMENTACIÓN DEL CONTRATO ITaskService] ---

    def create_task(self, data):
        self._log_access("CREATE_UNIT", f"Título: {data.get('title')}")
        return self._real_service.create_task(data)

    def create_advanced_task(self, data):
        self._log_access("BUILDER_SEQUENCE", "Iniciando construcción de unidad compleja")
        return self._real_service.create_advanced_task(data)

    def get_task(self, task_id):
        self._log_access("READ_UNIT", f"ID: {task_id}")
        return self._real_service.get_task(task_id)

    def get_all_tasks(self):
        self._log_access("SYNC_ALL", "Sincronizando base de datos completa")
        return self._real_service.get_all_tasks()

    def update_task(self, task_id, data):
        self._log_access("UPDATE_UNIT", f"ID: {task_id}")
        return self._real_service.update_task(task_id, data)

    def delete_task(self, task_id):
        """
        Protocolo de Purga: El Proxy registra la destrucción de datos.
        """
        self._log_access("PURGE_UNIT", f"ID_DESTRUIDO: {task_id}")
        print(f"⚠️ [PROXY_CRITICAL]: Se ha solicitado la eliminación permanente del nodo {task_id}")
        return self._real_service.delete_task(task_id)

    # --- [NUEVO PROTOCOLO: AUDITORÍA DE NOTIFICACIÓN ADAPTER] ---
    def notify_and_log(self, task_id, recipient):
        """El Proxy intercepta, audita y delega la transmisión de la señal."""
        self._log_access("ADAPTER_TRANSMISSION", f"Unidad: {task_id} | Destinatario: {recipient}")
        # Delegamos al servicio real para que ejecute los adaptadores y persista el log en DB
        return self._real_service.notify_and_log(task_id, recipient)

    def move_task(self, task_id, column_id):
        self._log_access("KANBAN_SHIFT", f"Unidad {task_id} -> {column_id}")
        return self._real_service.move_task(task_id, column_id)

    def add_comment(self, task_id, comment):
        self._log_access("AUDIT_COMMENT", f"En unidad {task_id}")
        return self._real_service.add_comment(task_id, comment)

    def add_time_log(self, task_id, hours):
        self._log_access("METRIC_LOG", f"Carga: {hours}h en unidad {task_id}")
        return self._real_service.add_time_log(task_id, hours)

    def add_attachment(self, task_id, file):
        self._log_access("RESOURCES_ATTACH", f"Anexo en unidad {task_id}")
        return self._real_service.add_attachment(task_id, file)

    def clone_task(self, task_id):
        """
        Intercepción de Prototipo: Registra la duplicación de ADN de la tarea.
        """
        self._log_access("PROTOTYPE_CLONE", f"Duplicando arquitectura de unidad {task_id}")
        return self._real_service.clone_task(task_id)

    def get_deadline_hours(self, task_id):
        # Lectura pasiva de métricas
        return self._real_service.get_deadline_hours(task_id)

    # --- [VISUAL INTERCEPTION] ---

    def set_theme(self, theme_name):
        self._log_access("VISUAL_OVER_RIDE", f"Aplicando protocolo estético {theme_name}")
        return self._real_service.set_theme(theme_name)

    # --- [ADAPTERS & NOTIFICATIONS] ---

    def add_notifier(self, notifier):
        print(f"🔌 [PROXY_LINK]: Acoplando adaptador de notificación: {type(notifier).__name__}")
        return self._real_service.add_notifier(notifier)

    def _notify_all(self, title, message, recipient=None):
        """Auditoría de Broadcast: El Proxy vigila las comunicaciones externas."""
        self._log_access("BROADCAST_SIGNAL", f"Canal de Alerta: {title} | Receptor: {recipient}")
        return self._real_service._notify_all(title, message, recipient)

    # --- [STRUCTURAL PATTERNS] ---

    def generate_report(self, format_type):
        """Bridge Auditor: Registra la exportación de inteligencia."""
        self._log_access("BRIDGE_EXPORT", f"Formato binario: {format_type.upper()}")
        return self._real_service.generate_report(format_type)

    def add_subtask(self, parent_id, subtask_data):
        """Composite Auditor: Registra la expansión del árbol jerárquico."""
        self._log_access("COMPOSITE_BUILD", f"Nueva rama en Nodo Padre: {parent_id}")
        return self._real_service.add_subtask(parent_id, subtask_data)

    def get_task_tree(self, task_id):
        return self._real_service.get_task_tree(task_id)

    def make_emergency_task(self, task_id):
        """Decorator Auditor: Registra la mutación dinámica de la unidad."""
        self._log_access("DECORATOR_MUTATION", f"Unidad {task_id} elevada a EMERGENCIA")
        return self._real_service.make_emergency_task(task_id)