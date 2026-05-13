# backend/modules/tasks/facade/task_facade.py

class TaskFacade:
    """
    🏢 [PATRÓN FACADE]: INTERFAZ UNIFICADA.
    Centraliza las operaciones del subsistema de tareas, ocultando la 
    complejidad de servicios, proxies y notificadores.
    """
    def __init__(self, task_service, auth_service=None):
        # Aquí inyectamos el proxy del servicio que ya tienes
        self.service = task_service
        self.auth = auth_service

    def execute_create_task(self, task_data, recipient_email):
        """
        Simplifica la operación compleja de:
        1. Crear tarea vía Service/Factory.
        2. Disparar notificaciones vía Adapters.
        3. Registrar logs de auditoría.
        """
        print("🏛️ [FACADE_LOG]: Iniciando secuencia orquestada...")
        
        # Delegamos la creación al servicio (que ya usa el Proxy)
        new_task = self.service.create_task(task_data)
        
        # Si la tarea se creó y hay un destinatario, notificamos
        if new_task and recipient_email:
            self.service.notify_and_log(new_task['id'], recipient_email)
            
        return new_task

    def fetch_all_tasks(self):
        """Fachada para obtener la lista de tareas sin hablar con el Repositorio."""
        return self.service.get_all_tasks()