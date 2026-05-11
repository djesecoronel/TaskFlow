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
        """Inserta un nuevo operativo sincronizando con el esquema real de Supabase"""
        try:
            # --- [MAPEADO DE PRECISIÓN SEGÚN DB] ---
            payload = {
                "email": user_data.email,
                "name": getattr(user_data, 'name', 'OPERATIVO_ANONIMO'),
                "role": getattr(user_data, 'role', 'DEVELOPER'),
                "avatar": getattr(user_data, 'avatar', None),
                # Sincronización con la columna real 'password' detectada en la captura
                "password": user_data.password_hash 
            }
            
            print(f"📡 [DB_SYNC]: Reintentando persistencia con columna 'password'...")
            
            # Ejecución del protocolo de inserción
            response = self.db.table(self.table).insert(payload).execute()
            
            if response.data and len(response.data) > 0:
                print(f"🗄️ [DB_SUCCESS]: Operativo {payload['email']} persistido con éxito.")
                return User.from_db(response.data[0])
                
            return None
        except Exception as e:
            print(f"❌ [AUTH_REPO_CREATE_ERROR]: Fallo en el esquema: {str(e)}")
            return None