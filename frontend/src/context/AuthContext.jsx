import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// CONFIGURACIÓN DINÁMICA DEL NODO CENTRAL
const API_URL = "http://192.168.40.53:5000/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- [INTERCEPTOR DE PROTOCOLO: TOKEN INJECTION] ---
  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [user]);

  // --- [INITIALIZATION: IDENTITY PURGE & SYNC] ---
  useEffect(() => {
    const syncSession = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('tf_token');
        const savedUser = localStorage.getItem('tf_user');
        
        if (token && savedUser) {
          // Bloque de seguridad: validamos que el JSON sea íntegro
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log("KERNEL_AUTH: Identidad restaurada desde memoria local.");
          } catch (e) {
            throw new Error("DATA_CORRUPTION");
          }
        } else {
          // Si no hay sesión, aseguramos limpieza de cabeceras
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      } catch (error) {
        console.error("AUTH_CRITICAL: Fallo en protocolo de restauración", error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    syncSession();
  }, []);

  // --- [AUTH ACTIONS: CONNECTING TO REALITY] ---
  
  const login = useCallback(async (credentials) => {
    try {
      console.log("KERNEL_AUTH: Iniciando secuencia de apretón de manos...");
      
      const response = await axios.post(`${API_URL}/login`, {
        email: credentials.email,
        password: credentials.password
      });

      // Extraemos la data validada por el servidor con fallback de seguridad
      const { user: realUser, token } = response.data;

      if (!token) throw new Error("PROTOCOL_ERROR: Token no recibido");

      // Inyectamos token en axios para peticiones inmediatas
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Persistencia en el núcleo del sistema
      setUser(realUser);
      localStorage.setItem('tf_token', token);
      localStorage.setItem('tf_user', JSON.stringify(realUser));
      
      console.log(`KERNEL_AUTH: Acceso concedido para operativo -> ${realUser.email}`);
      return response.data;

    } catch (error) {
      console.error("AUTH_DENIED: Credenciales rechazadas por el Nodo.");
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      delete axios.defaults.headers.common['Authorization'];
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // Purga física de credenciales del sistema
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_projects');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    console.log("KERNEL_AUTH: Sesión finalizada. Memoria de acceso purgada.");
  }, []);

  const updateProfile = useCallback((newData) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newData };
      localStorage.setItem('tf_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateProfile, 
      loading,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe configurarse dentro de un AuthProvider");
  return context;
};