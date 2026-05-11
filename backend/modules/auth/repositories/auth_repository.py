from config.db import SupabaseClient
from modules.auth.models.user import User

class AuthRepository:
    def __init__(self):
        """
        Inicializa el acceso al Nodo de Persistencia.
        Utiliza el Singleton de SupabaseClient para asegurar una única conexión.
        """
        # Obtenemos la instancia única del cliente
        self.db = SupabaseClient().get_client()
        self.table = "users"

    def get_user_by_email(self, email):
        """
        Busca un operativo en la DB por su correo electrónico.
        Protocolo de lectura optimizado.
        """
        try:
            # Ejecución de consulta select con filtro eq
            response = self.db.table(self.table).select("*").eq("email", email).execute()
            
            if response.data and len(response.data) > 0:
                # DEBUG: Telemetría de éxito
                print(f"✅ [AUTH_REPO]: Identidad detectada para -> {response.data[0].get('email')}")
                return User.from_db(response.data[0])
            
            return None
        except Exception as e:
            print(f"❌ [AUTH_REPO_ERROR]: Fallo en consulta de identidad: {str(e)}")
            return None

    def create_user(self, user_data):
        """
        Inserta un nuevo operativo en la base de datos sincronizando columnas.
        Asegura el mapeo correcto entre el Modelo de Dominio y Supabase.
        """
        try:
            # --- [MAPEADO DE CARGA ÚTIL (PAYLOAD)] ---
            # Sincronizamos con los nombres exactos de tu esquema en Supabase
            # Nota: Cambiamos 'password' por el nombre real de tu columna en la DB
            payload = {
                "email": user_data.email,
                "password_hash": user_data.password_hash, # Mapeo corregido
                "role": getattr(user_data, 'role', 'DEVELOPER'),
                "name": getattr(user_data, 'name', 'OPERATIVO_ANONIMO'),
                "avatar": getattr(user_data, 'avatar', None)
            }
            
            print(f"📡 [DB_SYNC]: Intentando persistencia de nuevo operativo -> {payload['email']}")

            # Ejecutamos el INSERT
            # Nota: .execute() en la librería de Supabase ya devuelve los datos insertados
            response = self.db.table(self.table).insert(payload).execute()
            
            if response.data and len(response.data) > 0:
                print(f"🗄️ [DB_SUCCESS]: Operativo {payload['email']} persistido con éxito en el Nodo Central.")
                return User.from_db(response.data[0])
            
            print(f"⚠️ [DB_WARNING]: Inserción completada pero no se retornaron datos del operativo.")
            return None

        except Exception as e:
            # Captura de errores de clave duplicada o violación de integridad
            print(f"❌ [AUTH_REPO_CREATE_ERROR]: Violación de protocolo en persistencia: {str(e)}")
            return None