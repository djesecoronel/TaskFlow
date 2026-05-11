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
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log("%c KERNEL_AUTH: Identidad restaurada desde memoria local. ", "color: #10b981; font-weight: bold;");
          } catch (e) {
            throw new Error("DATA_CORRUPTION");
          }
        } else {
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
  
  // 1. PROTOCOLO DE ACCESO (LOGIN)
  const login = useCallback(async (credentials) => {
    try {
      console.log("%c KERNEL_AUTH: Iniciando secuencia de apretón de manos... ", "color: #818cf8; font-weight: bold;");
      
      const response = await axios.post(`${API_URL}/login`, {
        email: credentials.email,
        password: credentials.password
      });

      const { user: realUser, token } = response.data;
      if (!token) throw new Error("PROTOCOL_ERROR: Token no recibido");

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(realUser);
      localStorage.setItem('tf_token', token);
      localStorage.setItem('tf_user', JSON.stringify(realUser));
      
      console.log(`%c KERNEL_AUTH: Acceso concedido para operativo -> ${realUser.email} `, "color: #10b981; font-weight: bold;");
      return response.data;

    } catch (error) {
      console.error("AUTH_DENIED: Credenciales rechazadas por el Nodo.");
      throw error;
    }
  }, []);

  // 2. PROTOCOLO DE REGISTRO (REGISTER) - [INYECCIÓN DE MISIÓN CRÍTICA]
  const register = useCallback(async (formData) => {
    try {
      console.log("%c 🧬 KERNEL_AUTH: Desplegando nuevo operativo en el Nodo... ", "color: #f59e0b; font-weight: bold;");
      
      const response = await axios.post(`${API_URL}/register`, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role || 'DEVELOPER'
      });

      const { user: newUser, token } = response.data;

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(newUser);
        localStorage.setItem('tf_token', token);
        localStorage.setItem('tf_user', JSON.stringify(newUser));
        console.log(`%c ✅ KERNEL_AUTH: Operativo ${newUser.email} registrado y sincronizado. `, "color: #10b981; font-weight: bold;");
      }

      return response.data;
    } catch (error) {
      console.error("❌ KERNEL_AUTH: Error en protocolo de registro.", error.response?.data || error.message);
      throw error;
    }
  }, []);

  // 3. PURGA DE SESIÓN (LOGOUT)
  const logout = useCallback(() => {
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_projects');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    console.log("%c KERNEL_AUTH: Sesión finalizada. Memoria de acceso purgada. ", "color: #ef4444; font-weight: bold;");
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
      register, // <--- EXPOSICIÓN DE LA NUEVA FUNCIÓN
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