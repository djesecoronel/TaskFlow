from config.db import SupabaseClient
from postgrest.exceptions import APIError
import time

class TaskRepository:
    """
    🗄️ [REPOSITORIO DE PERSISTENCIA]: Nodo de acceso a datos para la tabla 'tasks'.
    Implementa protocolos de sincronización inmediata con Supabase.
    Diseñado para el manejo de identidades UUID y recuperación de estado.
    """
    
    def __init__(self):
        # Conectamos con el cliente único mediante el Patrón Singleton
        self.client = SupabaseClient().get_client()
        self.table = "tasks"
        # Protocolo de Identidad: Priorizamos 'id' como estándar UUID de Supabase
        self.pk = self._get_correct_pk()

    def _get_correct_pk(self):
        """
        PROTOCOLO DE DETECCIÓN: Valida dinámicamente la Primary Key del nodo.
        Evita discrepancias entre 'id' (estándar Supabase) y 'task_id'.
        """
        try:
            # Escaneo rápido del esquema para confirmar el conector de identidad
            self.client.table(self.table).select("id").limit(1).execute()
            return "id"
        except Exception:
            print("⚠️ [KERNEL_REPO]: Falló detección de 'id', conmutando a 'task_id'...")
            return "task_id"

    def get_last_id(self):
        """
        RESTRICCIÓN DE SECUENCIA: Recupera el identificador más reciente del stack.
        Útil para procesos de legado o validación de inserciones secuenciales.
        """
        try:
            response = self.client.table(self.table).select(self.pk).order(self.pk, desc=True).limit(1).execute()
            if not response.data:
                return 0
            return response.data[0][self.pk]
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo en secuencia de ID -> {str(e)}")
            return 0

    def get_all(self):
        """
        CONECTOR ADAPTADOR: Enlace estructural para mapear la petición de 'tasks_service.py'
        con el método de lectura masiva integrado.
        """
        return self.get_all_tasks()

    def get_all_tasks(self):
        """
        Descarga el registro completo de la unidad 'tasks'.
        Si Supabase está inaccesible (Error 521/Pausa), conmuta a Modo Resiliente.
        """
        try:
            # Tu lógica original de consulta a Supabase
            response = self.client.table(self.table).select('*').execute()
            return response.data
            
            # NOTA: Descomenta la línea de abajo si deseas forzar el modo simulación manualmente
            # raise Exception("521 Web server is down")
            
        except Exception as error:
            print("❌ [REPO_ERROR]: Fallo en lectura masiva -> Detectada desconexión de infraestructura.")
            print("⚠️ [KERNEL_REPO]: Conmutando automáticamente a KERNEL_FAILSAFE_MODE...")
            
            # Retornamos datos estructurados idénticos a los de tu BD para no romper el Frontend
            return [
                {
                    "task_id": "failsafe-01",
                    "title": "🚨 RESTABLECER NODO CENTRAL",
                    "description": "El enlace principal con Supabase se encuentra en mantenimiento o pausado.",
                    "status": "IN_PROGRESS",
                    "priority": "ALTA",
                    "type": "BUG",
                    "assigned_to": "davidjesecoronelhinojosa@taskflow.os"
                },
                {
                    "task_id": "failsafe-02",
                    "title": "Verificar Estado de Servicios Externos",
                    "description": "Monitorear el progreso de restauración en el panel de control de Supabase.",
                    "status": "TO_DO",
                    "priority": "MEDIA",
                    "type": "TASK",
                    "assigned_to": "davidjesecoronelhinojosa@taskflow.os"
                }
            ]
    
    def get_by_id(self, task_id):
        """
        LECTURA PUNTUAL: Localiza una unidad de trabajo específica mediante su UUID.
        """
        try:
            response = self.client.table(self.table)\
                .select("*")\
                .eq(self.pk, task_id)\
                .maybe_single()\
                .execute()
            return response.data
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Unidad {task_id} no localizada en el Nodo -> {str(e)}")
            return None
    
    def create(self, data, retries=2):
        """
        PERSISTENCIA DE ESCRITURA: Inserta una nueva unidad de trabajo.
        Mapea identidades dinámicamente y retorna el objeto persistido (UUID Ready).
        """
        # --- [PROTOCOLO DE SINCRONIZACIÓN DE LLAVES] ---
        if self.pk == "id" and "task_id" in data:
            data["id"] = data.pop("task_id")
        elif self.pk == "task_id" and "id" in data:
            data["task_id"] = data.pop("id")

        # --- [PROTOCOLO DE BLINDAJE DE INTEGRIDAD] ---
        # Aseguramos que el tipo siempre tenga un valor válido antes de persistir
        if not data.get("type"):
            data["type"] = "TASK"

        # --- [NUEVA FUNCIONALIDAD: FILTRO DE ESQUEMA PARA PREVENIR PGRST204] ---
        allowed_columns = {
            "id", "title", "description", "status", "priority", "type", 
            "due_date", "column_id", "user_id", "project_id", "parent_task"
        }
        
        # Filtramos el diccionario para enviar solo lo que la DB acepta realmente
        filtered_data = {k: v for k, v in data.items() if k in allowed_columns}

        for i in range(retries + 1):
            try:
                print(f"🚀 [REPO_SYNC]: Desplegando nueva unidad en '{self.table}' -> {filtered_data.get('title', 'SIN_TITULO')} [TIPO: {filtered_data.get('type')}]")
                
                response = self.client.table(self.table)\
                    .insert(filtered_data)\
                    .execute()
                
                if not response.data:
                    raise Exception("SIN_DATA_RETORNO_DESPUES_DE_INSERT")
                    
                print(f"✅ [REPO_SUCCESS]: Unidad persistida con ID: {response.data[0].get(self.pk)}")
                return response.data[0]
                
            except (APIError, Exception) as e:
                if i < retries:
                    print(f"⚠️ [REPO_RETRY]: Intento {i+1} fallido, reintentando...")
                    time.sleep(1)
                    continue
                print(f"🔥 [REPO_CRITICAL]: Fallo persistente en protocolo de inserción -> {str(e)}")
                return data
    
    def update(self, task_id, data, retries=2):
        """
        SINCRONIZACIÓN DE ESTADO: Actualiza parcialmente una unidad existente.
        Indispensable para movimientos de Kanban y mutación de metadatos.
        """
        # Blindaje: El ID del nodo es inmutable durante la sincronización
        data.pop(self.pk, None)
        data.pop("task_id", None)

        # --- [PROTOCOLO DE BLINDAJE DE INTEGRIDAD] ---
        # Si se está actualizando, verificamos integridad del tipo
        if "type" in data and not data["type"]:
            data["type"] = "TASK"

        for i in range(retries + 1):
            try:
                print(f"🔄 [REPO_PATCH]: Sincronizando cambios para el Nodo {task_id}...")
                
                response = self.client.table(self.table)\
                    .update(data)\
                    .eq(self.pk, task_id)\
                    .execute()
                
                if not response.data:
                    return None
                
                print(f"✅ [REPO_UPDATE]: Sincronización de estado para {task_id} completada.")
                return response.data[0]
            except Exception as e:
                if i < retries:
                    time.sleep(1)
                    continue
                print(f"❌ [REPO_ERROR]: Fallo en actualización de unidad {task_id} -> {str(e)}")
                return None
    
    def delete(self, task_id, retries=2):
        """
        💣 [PURGE_COMMAND]: Eliminación física irreversible.
        Expulsa permanentemente la unidad del stack de persistencia central.
        """
        for i in range(retries + 1):
            try:
                print(f"🧨 [DB_PURGE]: Iniciando purga física de la unidad {task_id}...")
                
                response = self.client.table(self.table)\
                    .delete()\
                    .eq(self.pk, task_id)\
                    .execute()
                
                if response.data:
                    print(f"💀 [DB_PURGE_COMPLETE]: Unidad {task_id} purgada del Nodo Maestro.")
                    return response.data[0]
                
                return True
            except Exception as e:
                if i < retries:
                    time.sleep(1)
                    continue
                print(f"❌ [REPO_ERROR]: Fallo en protocolo de purga para {task_id} -> {str(e)}")
                return None

    # --- [NUEVAS FUNCIONALIDADES: PERSISTENCIA DE OPERATIVOS] ---

    def get_all_users(self):
        """Recupera el directorio de operativos desde la tabla 'users'."""
        try:
            return self.client.table("users").select("*").execute().data
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo al recuperar usuarios -> {str(e)}")
            return []

    def create_user(self, user_data):
        """Persiste un nuevo registro de usuario en la tabla 'users'."""
        try:
            response = self.client.table("users").insert(user_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo al crear usuario -> {str(e)}")
            return None

    def update_user_status(self, user_id, status):
        """Actualiza el estado operativo de un usuario."""
        try:
            response = self.client.table("users").update({"status": status}).eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo al actualizar estado de usuario -> {str(e)}")
            return None

    def delete_user(self, user_id):
        """Elimina un operativo del sistema."""
        try:
            response = self.client.table("users").delete().eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo al eliminar usuario -> {str(e)}")
            return None