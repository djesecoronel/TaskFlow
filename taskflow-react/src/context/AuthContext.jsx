import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('tf_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // RF-01.2 y RF-01.6: Simulamos login y guardamos acceso
  const login = (email, role) => {
    const userData = {
      email,
      role, // ADMIN, PROJECT_MANAGER o DEVELOPER
      lastAccess: new Date().toLocaleString(),
      name: email.split('@')[0],
      avatar: `https://ui-avatars.com/api/?name=${email}&background=random`
    };
    setUser(userData);
    localStorage.setItem('tf_user', JSON.stringify(userData));
    localStorage.setItem('tf_token', 'fake-jwt-token'); // Simulación RF-01.2
  };

  // RF-01.5: Cierre de sesión
  const logout = () => {
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_token');
    setUser(null);
  };

  // RF-01.4: Simulación de actualizar perfil
  const updateProfile = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('tf_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);