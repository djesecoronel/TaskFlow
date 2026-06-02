from datetime import datetime, timezone
from modules.tasks.factory.task_factory import TaskFactory
# Mantenemos la coherencia con la Interfaz en mayúscula
from modules.tasks.models.itask_service import ITaskService 
from modules.tasks.builder.task_builder import TaskBuilder 
from modules.tasks.models.enum import TaskType, TaskStatus, PriorityTask, ThemeType

# --- INTEGRACIÓN: CHAIN OF RESPONSIBILITY ---
from modules.tasks.models.task_validation_handlers import (
    DataValidationHandler, 
    PrioritySecurityHandler, 
    LoggingHandler
)

class TaskService(ITaskService):
    """
    Servicio principal que orquestra la lógica de negocio de las tareas.
    Implementa múltiples patrones de diseño estructurales y creacionales.
    Mantiene la integridad de Factory, Builder, Adapter, Bridge, Composite, 
    Decorator y Prototype.
    """

    def __init__(self, repository):
        self.repository = repository
        # Estado global del tema (Abstract Factory Context)
        self.current_theme = ThemeType.LIGHT
        # Patrón Adapter: Lista de destinos de notificación
        self.notifiers = []
        # --- NUEVA FUNCIONALIDAD: CONTEXTO PARA EL PATRÓN STRATEGY ---
        self._sort_strategy = None

    # --- NUEVA FUNCIONALIDAD: MUTADOR DINÁMICO DE STRATEGY ---
    def set_sort_strategy(self, strategy) -> None:
        """Permite conmutar dinámicamente el algoritmo de ordenamiento"""
        print(f"🎯 [STRATEGY_SET]: Nueva estrategia asignada -> {strategy.__class__.__name__}")
        self._sort_strategy = strategy

    # --- MÉTODO PRIVADO: CONFIGURACIÓN DE LA CADENA ---
    def _get_validation_chain(self):
        """
        Configura los eslabones de la Cadena de Responsabilidad.
        Define el orden de ejecución de las validaciones de negocio.
        """
        validator = DataValidationHandler()
        security = PrioritySecurityHandler()
        logger = LoggingHandler()

        # Establecemos la jerarquía: Validación -> Seguridad -> Auditoría
        validator.set_next(security).set_next(logger)
        return validator

    # --- MÉTODO PRIVADO: LIMPIEZA DE CAMPOS (FIX UUID Y COMPATIBILIDAD DB) ---
    def _clean_for_repo(self, task_dict):
        """
        FILTRO FINAL: Solo deja pasar lo que existe en la tabla de Supabase.
        Asegura que user_id sea un UUID válido y mapea estados del Kanban.
        """
        # Estas son las únicas columnas que existen en tu esquema de Supabase
        # SE AÑADE 'assigned_to' PARA SOPORTE DE ADAPTER DINÁMICO Y EDICIÓN
        allowed_db_columns = [
            "id", "title", "description", "status", 
            "priority", "user_id", "due_date", "type", 
            "column_id", "position", "comments", "attachments", "assigned_to"
        ]
        
        clean_data = {}
        
        # 1. GESTIÓN DE IDENTIDAD (ID):
        # Mapeamos task_id a id y validamos longitud para evitar error 22P02
        tid = task_dict.get("task_id") or task_dict.get("id")
        if tid and len(str(tid)) > 10:
            clean_data["id"] = tid

        # 2. FILTRADO Y MAPEO DE CAMPOS:
        for k, v in task_dict.items():
            if k in allowed_db_columns and v is not None:
                
                # --- [FIX CRÍTICO: USER_ID] ---
                # Si el user_id no tiene longitud de UUID, lo omitimos para evitar 
                # la violación de la restricción not-null en Supabase.
                if k == "user_id":
                    if not v or len(str(v)) < 10:
                        continue
                
                # --- [MAPEO DE STATUS PROTEGIDO] ---
                if k == "status":
                    status_map = {
                        "Por hacer": "TO_DO",
                        "En progreso": "IN_PROGRESS",
                        "En revisión": "ON_REVIEW",
                        "Completado": "DONE"
                    }
                    # Si no es un valor mapeado, enviamos el valor crudo original (seguridad)
                    clean_data[k] = status_map.get(v, v)
                else:
                    clean_data[k] = v
        
        print(f"🚀 [DB_READY]: Paquete verificado para Supabase -> {clean_data.keys()}")
        return clean_data

    # --- MÉTODO PRIVADO: OBTENCIÓN SEGURA DE ID (ANTI-NONE) ---
    def _get_next_id(self):
        """
        Calcula el siguiente ID disponible de forma defensiva.
        Filtra valores NULL de la DB para evitar errores de comparación.
        """
        try:
            last_id = self.repository.get_last_id()
            if last_id is not None:
                return int(last_id) + 1
            
            tasks = self.repository.get_all()
            if not tasks:
                return 1
            
            ids = [t.get('task_id') for t in tasks if t.get('task_id') is not None]
            return (max(ids) if ids else 0) + 1
        except Exception as e:
            print(f"❌ [ERROR_ID]: Fallo al calcular ID, usando fallback 1. {e}")
            return 1

    # --- IMPLEMENTACIÓN OBLIGATORIA (CONTRATO ITASKSERVICE) ---

    def set_theme(self, theme_name):
        """
        Abstract Factory: Cambia el tema global y lo persiste.
        """
        try:
            self.current_theme = ThemeType(theme_name.upper())
            
            # --- [ACCIÓN DE PERSISTENCIA] ---
            # Aquí deberías tener una tabla 'user_settings' o 'projects' 
            # para guardar que este usuario prefiere el modo DARK.
            
            print(f"🎨 [KERNEL_THEME]: Abstract Factory conmutado a {theme_name}")
            return {
                "status": "THEME_UPDATED",
                "theme": self.current_theme.value,
                "protocol": "ABSTRACT_FACTORY_READY"
            }
        except Exception as e:
            return {"error": str(e)}, 400

    def add_notifier(self, notifier):
        """Patrón Adapter: Registra un nuevo adaptador de notificación"""
        print(f"📡 [ADAPTER_LINK]: Nuevo destino vinculado -> {notifier.__class__.__name__}")
        self.notifiers.append(notifier)

    def _notify_all(self, title, message, recipient=None):
        """
        Envía notificaciones masivas a través de los adaptadores registrados.
        CORRECCIÓN: Soporte para 'recipient' dinámico (Email Real).
        """
        print(f"📢 [NOTIFY_BROADCAST]: {title} -> Destinatario: {recipient or 'Global'}")
        for notifier in self.notifiers:
            try:
                # El adaptador ahora procesa el destinatario real del operativo
                notifier.send(title, message, recipient)
            except Exception as e:
                print(f"⚠️ [ADAPTER_ERR]: {e}")

    # --- NUEVA FUNCIONALIDAD: MÉTODOS NATIVOS DEL PATRÓN OBSERVER ---
    def attach(self, observer) -> None:
        """Registra un nuevo observador (Mapeado a tu lógica de notifiers)"""
        self.add_notifier(observer)

    def detach(self, observer) -> None:
        """Elimina un observador del ecosistema"""
        if observer in self.notifiers:
            self.notifiers.remove(observer)

    def notify_observers(self, event_type: str, task_data: dict) -> None:
        """Dispara de forma reactiva la actualización del Observer"""
        print(f"🔔 [OBSERVER_NOTIFY]: Emitiendo evento {event_type}")
        for observer in self.notifiers:
            try:
                if hasattr(observer, 'update'):
                    observer.update(event_type, task_data)
            except Exception as e:
                print(f"⚠️ [OBSERVER_ERR]: Fallo en actualización -> {e}")

    # --- BRIDGE LOGIC: IMPLEMENTACIÓN BINARIA ---
    def generate_report(self, format_type="pdf"):
        """
        Patrón Bridge: Desacopla la abstracción del reporte de su implementación física.
        Ahora genera un flujo binario compatible con send_file de Flask.
        """
        try:
            print(f"🌉 [BRIDGE_SERVICE]: Iniciando generación de reporte binario en formato {format_type.upper()}")
            from modules.tasks.reports.report_implementor import PDFFormat, ExcelFormat
            
            # Abstracción refinada: Seleccionamos el Implementador concreto
            implementor = ExcelFormat() if format_type.lower() == "excel" else PDFFormat()
            
            try:
                from modules.tasks.reports.report_implementor import DetailedTaskReport
            except ImportError:
                class DetailedTaskReport:
                    def __init__(self, implementor):
                        self.implementor = implementor
                    def run(self, data):
                        # Delegación al implementador (Core del Bridge)
                        return self.implementor.generate(data)

            report = DetailedTaskReport(implementor)
            
            # Recopilamos datos frescos del Nodo Central
            all_tasks = self.get_all_tasks()
            # Serialización profunda para que el Implementador reciba datos limpios
            clean_data = [t if isinstance(t, dict) else t.to_dict() for t in all_tasks]
            
            # Ejecución del Puente: El reporte devuelve un BytesIO (binario en memoria)
            return report.run(clean_data)

        except Exception as e:
            print(f"❌ [BRIDGE_FATAL_ERROR]: {str(e)}")
            return None

    # --- CRUD & CORE LOGIC (FACADE) ---

    def get_all_tasks(self):
        """Patrón Facade: Interfaz simple para obtener todos los datos"""
        tasks = self.repository.get_all()
        
        # --- ENCHUFE DEL PATRÓN STRATEGY ---
        # Si hay una estrategia activa, procesa y ordena la colección de forma dinámica
        if self._sort_strategy and tasks:
            tasks = self._sort_strategy.sort(tasks)
            
        return tasks

    def create_task(self, data):
        """
        Patrón Factory Method validado por Chain of Responsibility.
        """
        validation_result = self._get_validation_chain().handle(data)
        if validation_result is not True:
            return validation_result 

        data["theme"] = self.current_theme.value
        
        # --- BLINDAJE DE TIPO ---
        if "type" not in data or not data["type"]:
            data["type"] = "TASK"
        
        task = TaskFactory.from_dict(data)
        
        # Disparo de notificación vía Adapters tras creación (Soporte dinámico)
        self._notify_all("NUEVA_TAREA", f"Se ha creado la tarea: {task.title}", data.get('assigned_to'))
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TASK_CREATED", task.to_dict())
        
        # --- BLINDAJE DE PERSISTENCIA ---
        result = self.repository.create(self._clean_for_repo(task.to_dict()))
        print(f"✅ [KERNEL_CONFIRM]: Tarea creada en BD: {result}")
        return result

    def create_task_in_project(self, project_id, data):
        """
        Versión unificada con auditoría total, incluyendo el disparador del patrón COMMAND.
        """
        # 1. INTEGRACIÓN DEL COMANDO (Disparador de auditoría)
        print(f"📋 [COMMAND_EXEC]: Invocando comando para crear tarea en proyecto {project_id}")
        
        # 2. Aseguramos integridad de datos
        data["project_id"] = int(project_id)
        if "type" not in data or not data["type"]:
            data["type"] = "TASK"
            
        # 3. VALIDACIÓN: Dispara logs de Chain of Responsibility
        validation_result = self._get_validation_chain().handle(data)
        if validation_result is not True:
            return validation_result 

        # 4. FACTORY: Construcción del objeto
        data["theme"] = self.current_theme.value
        task = TaskFactory.from_dict(data)
        
        # 5. ADAPTER: Notificación (Broadcast)
        self._notify_all("NUEVA_TAREA_PROYECTO", f"Tarea '{task.title}' creada en proyecto {project_id}", data.get('assigned_to'))
        
        # 6. OBSERVER: Notificación reactiva
        self.notify_observers("TASK_CREATED_IN_PROJECT", task.to_dict())
        
        # 7. REPOSITORY: Persistencia (con limpieza)
        result = self.repository.create(self._clean_for_repo(task.to_dict()))
        
        # 8. ECHO-LOGGING
        print(f"✅ [KERNEL_CONFIRM]: Tarea creada en proyecto {project_id} | ID: {result.get('id')}")
        return result

    def create_advanced_task(self, data):
        """
        Patrón Builder validado por Chain of Responsibility.
        """
        validation_result = self._get_validation_chain().handle(data)
        if validation_result is not True:
            return validation_result

        # --- BLINDAJE DE TIPO ---
        if "type" not in data or not data["type"]:
            data["type"] = "TASK"

        builder = TaskBuilder()
        
        builder.set_basic_info(
            task_id=data.get("task_id"),
            task_type=TaskType(data.get("type", "TASK")),
            title=data.get("title", "SIN_TITULO"),
            description=data.get("description", "")
        )
        
        if "status" in data:
            builder.set_status(TaskStatus(data["status"]))
        if "priority" in data:
            builder.set_priority(PriorityTask(data["priority"]))
        if "due_date" in data:
            builder.set_due_date(datetime.fromisoformat(data["due_date"].replace('Z', '+00:00')))
        if "comment" in data:
            builder.add_comment(data["comment"])
        if "attachment" in data:
            builder.add_attachment(data["attachment"])

        task = builder.build()
        task_data = task.to_dict()
        task_data["theme"] = self.current_theme.value
        
        # Inyectamos IDs externos del request para que pasen por la limpieza
        task_data["column_id"] = data.get("column_id")
        task_data["user_id"] = data.get("user_id")
        
        # Disparo de notificación vía Adapters tras construcción avanzada
        self._notify_all("TAREA_AVANZADA", f"Creada con Builder: {task.title}", data.get('assigned_to'))
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TASK_BUILDER_COMPLETED", task_data)
        
        # --- NUEVA FUNCIONALIDAD: ECHO-LOGGING ---
        result = self.repository.create(self._clean_for_repo(task_data))
        print(f"✅ [REALTIME_ECHO]: Task avanzada creada con ID: {result}")
        return result

    def get_task(self, task_id):
        data = self.repository.get_by_id(task_id)
        if not data:
            return None
        return TaskFactory.from_dict(data)

    def update_task(self, task_id, data):
        """
        PROTOCOL UPDATE: Sincroniza la mutación de la unidad con el Nodo Central.
        """
        task = self.get_task(task_id)
        if not task:
            return None
        
        print(f"🔄 [KERNEL_MUTATION]: Procesando cambios para unidad {task_id}")
        
        clean_data = self._clean_for_repo(data)
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TASK_UPDATED", clean_data)
        
        result = self.repository.update(task_id, clean_data)
        
        # --- NUEVA FUNCIONALIDAD: ECHO-LOGGING ---
        print(f"✅ [REALTIME_ECHO]: Update confirmado en BD para ID {task_id}")
        return result

    def delete_task(self, task_id):
        """CORRECCIÓN: Implementación del borrado físico en el Nodo Central"""
        print(f"🧨 [KERNEL_PURGE]: Solicitando eliminación definitiva de {task_id}")
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TASK_DELETED", {"id": task_id})
        
        result = self.repository.delete(task_id)
        
        # --- NUEVA FUNCIONALIDAD: ECHO-LOGGING ---
        print(f"✅ [REALTIME_ECHO]: Purga finalizada para ID {task_id}")
        return result

    # --- [RE-ACTIVADO: PROTOCOLO ADAPTER CON AUDITORÍA] ---
    def notify_and_log(self, task_id, recipient):
        """
        ORQUESTADOR ADAPTER: Dispara notificaciones y persiste el log en el Nodo Central.
        """
        message = "Prueba de conexión exitosa."
        task_title = "SISTEMA"

        # 1. Recuperación de contexto de la tarea
        if task_id:
            task = self.get_task(task_id)
            if task:
                task_title = task.title
                message = f"ALERTA OPERATIVA: La unidad '{task_title}' requiere su atención inmediata."

        # 2. Ejecución del Patrón Adapter (Broadcast a Email/Slack)
        self._notify_all(f"ALERTA TASKFLOW: {recipient}", message, recipient)

        # 3. REGISTRO DE AUDITORÍA (Cierre de circuito)
        if task_id:
            log_msg = f"📢 [ADAPTER_SYNC]: Notificación enviada a {recipient} para la unidad '{task_title}'"
            self.add_comment(task_id, log_msg)
            print(f"✅ [KERNEL_AUDIT]: Transmisión registrada en el historial del Nodo {task_id}")

        return {
            "status": "NOTIFICACIONES_PROCESADAS", 
            "target_operative": recipient,
            "audit_saved": True
        }

    def move_task(self, task_id, column_id):
        """Lógica de negocio optimizada para el movimiento entre columnas Kanban"""
        task = self.get_task(task_id)
        if not task:
            return None

        old_column = getattr(task, "column_id", "Unknown")
        task.column_id = column_id
        task.history.append(f"LOG: Movido de col_{old_column} a col_{column_id} en {datetime.now().isoformat()}")
        
        self._notify_all("MOVIMIENTO_TAREA", f"Unidad {task_id} movida a {column_id}", getattr(task, 'assigned_to', None))
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TASK_MOVED", {"id": task_id, "column_id": column_id})
        
        # --- OPTIMIZACIÓN: Enviamos el objeto completo para asegurar sincronía de estado ---
        full_data = task.to_dict()
        full_data["column_id"] = column_id
        full_data["status"] = column_id # Aseguramos que el estado refleje la columna
        
        result = self.repository.update(task_id, self._clean_for_repo(full_data))
        print(f"✅ [REALTIME_ECHO]: Movimiento a {column_id} registrado en BD.")
        return result

    def add_comment(self, task_id, comment):
        task = self.get_task(task_id)
        if not task:
            return None

        new_comment = {
            "text": comment,
            "created_at": datetime.now().isoformat()
        }
        
        task.comments.append(new_comment)
        task.history.append(f"LOG: Comentario añadido")
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("COMMENT_ADDED", {"id": task_id, "comment": comment})
        
        return self.repository.update(task_id, self._clean_for_repo(task.to_dict()))

    def add_time_log(self, task_id, hours):
        task = self.get_task(task_id)
        if not task:
            return None

        new_log = {
            "hours": hours,
            "date": datetime.now().isoformat()
        }
        
        task.time_logs.append(new_log)
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TIME_LOGGED", {"id": task_id, "hours": hours})
        
        return self.repository.update(task_id, self._clean_for_repo(task.to_dict()))

    def add_attachment(self, task_id, file):
        task = self.get_task(task_id)
        if not task:
            return None
        
        task.add_attachment(file)
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("ATTACHMENT_ADDED", {"id": task_id, "file": str(file)})
        
        return self.repository.update(task_id, self._clean_for_repo(task.to_dict()))

    def clone_task(self, task_id):
        """
        Patrón Prototype: Clonación profunda de tareas.
        Se limpia el ID para que Supabase genere un nuevo UUID automáticamente.
        """
        print(f"🧬 [PROTOTYPE]: Iniciando clonación de unidad {task_id}")
        task = self.get_task(task_id)
        if not task:
            return None

        new_task_obj = task.clone()
        new_task_data = new_task_obj.to_dict()
        
        # --- [LIMPIEZA DE IDENTIDAD PARA NUEVO REGISTRO UUID] ---
        new_task_data.pop('id', None)
        new_task_data.pop('task_id', None)
        
        new_task_data["title"] = f"{new_task_data.get('title', 'Copia')} (Clone)"

        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TASK_CLONED", {"source_id": task_id})

        result = self.repository.create(self._clean_for_repo(new_task_data))
        print(f"✅ [REALTIME_ECHO]: Clonación completada para ID {task_id}")
        return result

    def get_deadline_hours(self, task_id):
        """
        Implementación del método requerido por la interfaz.
        Calcula el tiempo restante para la entrega.
        """
        task_data = self.repository.get_by_id(task_id)
        if not task_data:
            return None
        
        task_obj = TaskFactory.from_dict(task_data)
        return task_obj.get_deadline_hours()

    # --- MÉTODOS: PATRÓN COMPOSITE ---

    def add_subtask(self, parent_id, subtask_data):
        parent = self.get_task(parent_id)
        if not parent:
            return None

        subtask_data["parent_task"] = parent_id
        new_subtask = self.create_task(subtask_data)
        
        if isinstance(new_subtask, dict) and "id" in new_subtask:
            parent.history.append(f"COMPOSITE_LOG: Subtarea {new_subtask['id']} agregada")
            self.repository.update(parent_id, self._clean_for_repo(parent.to_dict()))
        
        return new_subtask

    def get_task_tree(self, task_id):
        root_data = self.repository.get_by_id(task_id)
        if not root_data:
            return None
        
        root_task = TaskFactory.from_dict(root_data)
        all_tasks = self.get_all_tasks()
        children_data = [t for t in all_tasks if t.get("parent_task") == task_id]
        
        for child_data in children_data:
            child_task = TaskFactory.from_dict(child_data)
            root_task.add_subtask(child_task)
            
        return root_task.to_dict()

    # --- MÉTODOS: PATRÓN DECORATOR ---

    def make_emergency_task(self, task_id):
        task = self.get_task(task_id)
        if not task:
            return None

        from modules.tasks.models.task_decorator import EmergencyDecorator
        
        decorated_task = EmergencyDecorator(task)
        task.history.append(f"DECORATOR_LOG: Tarea elevada a EMERGENCIA el {datetime.now().isoformat()}")
        
        self._notify_all("ALERTA_CRITICA", f"La tarea {task_id} ha sido marcada como EMERGENCIA.", getattr(task, 'assigned_to', None))
        
        # --- LANZAMIENTO OBSERVER ---
        self.notify_observers("TASK_EMERGENCY", {"id": task_id})
        
        return self.repository.update(task_id, self._clean_for_repo(decorated_task.to_dict()))
    
    # --- [NUEVA FUNCIONALIDAD: GESTIÓN DE OPERATIVOS (SUPABASE SYNC)] ---

    def get_all_users(self):
        """Recupera la lista de operativos desde la tabla 'users'."""
        print("🔍 [KERNEL_QUERY]: Accediendo a directorio de operativos...")
        return self.repository.get_all_users()

    def add_member(self, user_data):
        """Inyecta un nuevo operativo en el nodo central."""
        print(f"➕ [DB_SYNC]: Desplegando nuevo operativo {user_data.get('email')}")
        result = self.repository.create_user(user_data)
        self.notify_observers("MEMBER_ADDED", user_data)
        return result

    def update_member_status(self, user_id, status):
        """Modifica el estado operativo de un registro en la base de datos."""
        print(f"🔄 [DB_SYNC]: Actualizando estatus del operativo {user_id} a {status}")
        result = self.repository.update_user_status(user_id, status)
        self.notify_observers("MEMBER_STATUS_CHANGED", {"id": user_id, "status": status})
        return result

    def delete_member(self, user_id):
        """Purga un registro de operativo del repositorio central."""
        print(f"🧨 [KERNEL_PURGE]: Eliminando operativo {user_id} del ecosistema.")
        result = self.repository.delete_user(user_id)
        self.notify_observers("MEMBER_DELETED", {"id": user_id})
        return result