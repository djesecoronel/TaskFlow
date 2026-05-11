from modules.tasks.models.task_handler import ITaskHandler

class DataValidationHandler(ITaskHandler):
    """
    Eslabón 1: Validación de Integridad de Datos.
    Se encarga de asegurar que la tarea tenga los campos mínimos necesarios
    para existir en el sistema antes de llegar a la persistencia.
    """
    def handle(self, task_data):
        print("🔍 [CHAIN]: Iniciando validación de integridad...")
        
        # El título es el corazón de la tarea
        if not task_data.get("title") or str(task_data.get("title")).strip() == "":
            print("❌ [CHAIN]: Fallo en Validación - Título ausente.")
            return {"error": "EL_TITULO_ES_OBLIGATORIO", "status": "VALIDATION_FAILED"}, 400
        
        # Verificamos que el tipo de tarea sea válido (opcional según lógica de negocio)
        if "type" not in task_data:
            print("⚠️ [CHAIN]: Tipo no especificado, se asignará por defecto en Factory.")

        # Si todo está bien, pasamos al siguiente eslabón (Seguridad/Políticas)
        return super().handle(task_data)


class PrioritySecurityHandler(ITaskHandler):
    """
    Eslabón 2: Validación de Políticas de Negocio y Seguridad.
    Verifica que las reglas de prioridad se cumplan. Por ejemplo, una tarea 
    URGENTE debe tener una descripción obligatoria para justificar su estado.
    """
    def handle(self, task_data):
        print("🛡️ [CHAIN]: Verificando políticas de prioridad y seguridad...")
        
        priority = task_data.get("priority")
        description = task_data.get("description", "")

        # Regla de Negocio: No se permiten urgencias sin contexto
        if (priority == "Urgent" or priority == "High") and len(description) < 10:
            print("❌ [CHAIN]: Fallo en Seguridad - Urgencia sin descripción suficiente.")
            return {
                "error": "DESCRIPCION_INSUFICIENTE", 
                "message": "Las tareas de alta prioridad requieren al menos 10 caracteres de descripción."
            }, 400
            
        # Si cumple las políticas, delegamos al siguiente (Logging/Auditoría)
        return super().handle(task_data)


class LoggingHandler(ITaskHandler):
    """
    Eslabón 3: Auditoría y Registro Final.
    Este eslabón no bloquea la ejecución, pero registra que la tarea
    ha superado satisfactoriamente todos los filtros de la cadena.
    """
    def handle(self, task_data):
        task_name = task_data.get("title")
        print(f"✅ [CHAIN]: Tarea '{task_name}' aprobada para creación.")
        
        # Aquí se podría disparar un log a un archivo o servicio externo
        # Como es el último eslabón, retorna True para confirmar el éxito total
        return super().handle(task_data)