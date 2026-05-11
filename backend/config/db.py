from supabase import create_client
import os
from dotenv import load_dotenv

# Cargamos variables de entorno
load_dotenv()

class SupabaseClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")

            if not url or not key:
                # Error crítico: Si no hay credenciales, el sistema no arranca
                raise ValueError("DATABASE_ERROR: SUPABASE_URL o SUPABASE_KEY faltantes.")

            try:
                cls._instance.client = create_client(url, key)
                print(">>> CONEXIÓN SINGLETON ESTABLECIDA CON SUPABASE")
            except Exception as e:
                print(f">>> ERROR DE CONEXIÓN: {str(e)}")
                cls._instance = None # Reset en caso de fallo
                raise e
        
        return cls._instance

    def get_client(self):
        return self.client