from config.db import SupabaseClient
from modules.auth.models.user import User

class AuthRepository:
    def __init__(self):
        # Usamos el Singleton que ya definiste
        self.db = SupabaseClient().get_client()
        self.table = "users"

    def get_user_by_email(self, email):
        """Busca un usuario en la DB por su correo electrónico"""
        try:
            response = self.db.table(self.table).select("*").eq("email", email).execute()
            if response.data and len(response.data) > 0:
                # DEBUG: Verifica qué llega de la DB
                print(f"✅ [AUTH_REPO]: Usuario encontrado: {response.data[0].get('email')}")
                return User.from_db(response.data[0])
            return None
        except Exception as e:
            print(f"❌ [AUTH_REPO_ERROR]: {str(e)}")
            return None

    def create_user(self, user_data):
        """Inserta un nuevo operativo en la base de datos sincronizando columnas"""
        try:
            # Sincronizamos con los nombres exactos de tu captura de Supabase
            payload = {
                "email": user_data.email,
                "password": user_data.password_hash, # Corregido: de 'password' a 'password_hash'
                "role": user_data.role,
                "name": user_data.name,
                "avatar": user_data.avatar
            }
            
            response = self.db.table(self.table).insert(payload).execute()
            
            if response.data:
                return User.from_db(response.data[0])
            return None
        except Exception as e:
            print(f"❌ [AUTH_REPO_CREATE_ERROR]: {str(e)}")
            return None