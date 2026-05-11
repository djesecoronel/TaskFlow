from config.db import SupabaseClient
from postgrest.exceptions import APIError

class TaskRepository:
    """
    REPOSITORIO DE PERSISTENCIA: Nodo de acceso a datos para la tabla 'tasks'.
    Implementa protocolos de sincronización inmediata con Supabase.
    Diseñado para el manejo de identidades UUID y recuperación de estado.
    """
    
    def __init__(self):
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
            # Intentamos un escaneo rápido del esquema
            self.client.table(self.table).select("id").limit(1).execute()
            return "id"
        except Exception:
            print("⚠️ [KERNEL_REPO]: Falló detección de 'id', conmutando a 'task_id'...")
            return "task_id"

    def get_last_id(self):
        """
        RESTRICCIÓN DE SECUENCIA: Recupera el identificador más reciente.
        Útil para procesos de legado o validación de inserciones.
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
        LECTURA TOTAL: Recupera el stack completo de tareas sincronizadas.
        Ordenado cronológicamente para consistencia del Tablero Kanban.
        """
        try:
            response = self.client.table(self.table).select("*").order("created_at").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo en lectura masiva -> {str(e)}")
            return []
    
    def get_by_id(self, task_id):
        """
        LECTURA PUNTUAL: Localiza una unidad de trabajo específica por su PK.
        """
        try:
            response = self.client.table(self.table)\
                .select("*")\
                .eq(self.pk, task_id)\
                .maybe_single()\
                .execute()
            return response.data
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Unidad {task_id} no localizada -> {str(e)}")
            return None
    
    def create(self, data):
        """
        PERSISTENCIA DE ESCRITURA: Inserta una nueva unidad de trabajo.
        Mapea identidades dinámicamente y retorna el objeto persistido (UUID Ready).
        """
        # Sincronización de llaves antes del despliegue
        if self.pk == "id" and "task_id" in data:
            data["id"] = data.pop("task_id")
        elif self.pk == "task_id" and "id" in data:
            data["task_id"] = data.pop("id")

        try:
            print(f"🚀 [REPO_SYNC]: Iniciando despliegue de unidad en tabla '{self.table}'...")
            
            response = self.client.table(self.table)\
                .insert(data)\
                .execute()
            
            if not response.data:
                raise Exception("SIN_DATA_RETORNO")
                
            print(f"✅ [REPO_SUCCESS]: Unidad persistida con ID: {response.data[0].get(self.pk)}")
            return response.data[0]
            
        except APIError as e:
            print(f"🔥 [REPO_CRITICAL]: Violación de integridad DB -> {e.message}")
            raise e
        except Exception as e:
            print(f"🔥 [REPO_CRITICAL]: Fallo en protocolo de inserción -> {str(e)}")
            return data # Fallback defensivo
    
    def update(self, task_id, data):
        """
        SINCRONIZACIÓN DE ESTADO: Actualiza parcialmente una tarea.
        Utilizado para movimientos de Kanban, cambios de prioridad o metadatos.
        """
        try:
            # Blindaje: Impedimos que el ID sea modificado accidentalmente
            data.pop(self.pk, None)
            data.pop("task_id", None)

            response = self.client.table(self.table)\
                .update(data)\
                .eq(self.pk, task_id)\
                .execute()
            
            if not response.data:
                print(f"⚠️ [REPO_WARNING]: Intento de update en unidad inexistente: {task_id}")
                return None
            
            print(f"🔄 [REPO_UPDATE]: Nodo {task_id} sincronizado satisfactoriamente.")
            return response.data[0]
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo en sincronización de unidad {task_id} -> {str(e)}")
            return None
    
    def delete(self, task_id):
        """
        PURGA FÍSICA: Elimina permanentemente la unidad del stack de persistencia.
        """
        try:
            print(f"🗑️ [REPO_PURGE]: Eliminando unidad {task_id} del Nodo Maestro...")
            response = self.client.table(self.table)\
                .delete()\
                .eq(self.pk, task_id)\
                .execute()
            
            return response.data[0] if response.data else True
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo en purga de unidad {task_id} -> {str(e)}")
            return None