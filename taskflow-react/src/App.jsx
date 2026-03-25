import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext'; // Importación del nuevo contexto

// --- PÁGINAS ---
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Projects from './pages/Projects'; 
import KanbanBoard from './pages/KanbanBoard';
import Dashboard from './pages/Dashboard';
import NotificationsPage from './pages/NotificationsPage'; 
import Team from './pages/Team'; 
import Reports from './pages/Reports';

// --- LAYOUT ---
import MainLayout from './components/layout/MainLayout';

/* -----------------------------------------------------------
   COMPONENTES AUXILIARES
   ----------------------------------------------------------- */

// Asegura que el scroll vuelva arriba al cambiar de ruta
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, [pathname]);
  return null;
};

// Protección de rutas (RF-01.2 / RF-01.5)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      /* Se añade bg-slate-50 para el modo claro y dark:bg-slate-950 para el oscuro */
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 transition-colors duration-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]"></div>
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase italic tracking-[0.3em] animate-pulse">
          Sincronizando Terminal...
        </p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

/* -----------------------------------------------------------
   APLICACIÓN PRINCIPAL
   ----------------------------------------------------------- */

function App() {
  return (
    <Router> 
      {/* El ThemeProvider envuelve a los demás para gestionar el modo oscuro/claro globalmente */}
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ProjectProvider>
              <ScrollToTop />
              <Routes>
                {/* RUTAS PÚBLICAS */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* RUTAS PRIVADAS (Encapsuladas en MainLayout) */}
                <Route path="/" element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }>
                  {/* Redirección inicial */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  
                  {/* RF-02.6: Dashboard */}
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* RF-02: Proyectos */}
                  <Route path="projects" element={<Projects />} />
                  
                  {/* RF-03: Kanban */}
                  <Route path="project/:id" element={<KanbanBoard />} />
                  
                  {/* RF-04: Equipo */}
                  <Route path="team" element={<Team />} />
                  
                  {/* RF-08: Reportes y Estadísticas */}
                  <Route path="reports" element={<Reports />} />
                  
                  {/* RF-05: Notificaciones */}
                  <Route path="notifications" element={<NotificationsPage />} />
                  
                  {/* RF-01: Perfil */}
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ProjectProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;