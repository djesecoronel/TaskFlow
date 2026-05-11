from config.db import SupabaseClient
from postgrest.exceptions import APIError

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
        LECTURA TOTAL: Recupera el stack completo de tareas sincronizadas.
        Ordenado cronológicamente para consistencia absoluta del Tablero Kanban.
        """
        try:
            print(f"📡 [DB_SYNC]: Descargando registro completo de la unidad '{self.table}'...")
            response = self.client.table(self.table).select("*").order("created_at").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo en lectura masiva -> {str(e)}")
            return []
    
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
    
    def create(self, data):
        """
        PERSISTENCIA DE ESCRITURA: Inserta una nueva unidad de trabajo.
        Mapea identidades dinámicamente y retorna el objeto persistido (UUID Ready).
        """
        # --- [PROTOCOLO DE SINCRONIZACIÓN DE LLAVES] ---
        if self.pk == "id" and "task_id" in data:
            data["id"] = data.pop("task_id")
        elif self.pk == "task_id" and "id" in data:
            data["task_id"] = data.pop("id")

        try:
            print(f"🚀 [REPO_SYNC]: Desplegando nueva unidad en '{self.table}' -> {data.get('title', 'SIN_TITULO')}")
            
            response = self.client.table(self.table)\
                .insert(data)\
                .execute()
            
            if not response.data:
                raise Exception("SIN_DATA_RETORNO_DESPUES_DE_INSERT")
                
            print(f"✅ [REPO_SUCCESS]: Unidad persistida con ID: {response.data[0].get(self.pk)}")
            return response.data[0]
            
        except APIError as e:
            print(f"🔥 [REPO_CRITICAL]: Violación de integridad DB -> {e.message}")
            raise e
        except Exception as e:
            print(f"🔥 [REPO_CRITICAL]: Fallo en protocolo de inserción -> {str(e)}")
            return data # Fallback de emergencia para evitar pérdida de datos en memoria
    
    def update(self, task_id, data):
        """
        SINCRONIZACIÓN DE ESTADO: Actualiza parcialmente una unidad existente.
        Indispensable para movimientos de Kanban y mutación de metadatos.
        """
        try:
            # Blindaje: El ID del nodo es inmutable durante la sincronización
            data.pop(self.pk, None)
            data.pop("task_id", None)

            print(f"🔄 [REPO_PATCH]: Sincronizando cambios para el Nodo {task_id}...")
            
            response = self.client.table(self.table)\
                .update(data)\
                .eq(self.pk, task_id)\
                .execute()
            
            if not response.data:
                print(f"⚠️ [REPO_WARNING]: Intento de actualización en unidad inexistente: {task_id}")
                return None
            
            print(f"✅ [REPO_UPDATE]: Sincronización de estado para {task_id} completada.")
            return response.data[0]
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo en actualización de unidad {task_id} -> {str(e)}")
            return None
    
    def delete(self, task_id):
        """
        💣 [PURGE_COMMAND]: Eliminación física irreversible.
        Expulsa permanentemente la unidad del stack de persistencia central.
        """
        try:
            print(f"🧨 [DB_PURGE]: Iniciando purga física de la unidad {task_id}...")
            
            response = self.client.table(self.table)\
                .delete()\
                .eq(self.pk, task_id)\
                .execute()
            
            # Si hay datos retornados, la purga fue confirmada por el Nodo
            if response.data:
                print(f"💀 [DB_PURGE_COMPLETE]: Unidad {task_id} purgada del Nodo Maestro.")
                return response.data[0]
            
            print(f"✅ [DB_PURGE_CONFIRMED]: Unidad {task_id} ya no reside en el sistema.")
            return True
            
        except Exception as e:
            print(f"❌ [REPO_ERROR]: Fallo en protocolo de purga para {task_id} -> {str(e)}")
            return None