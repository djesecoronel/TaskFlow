import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext'; 

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

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, [pathname]);
  return null;
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
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

function App() {
  return (
    <Router> 
      {/* JERARQUÍA DE PROVEEDORES REESTRUCTURADA:
          El AuthProvider va primero porque ProjectProvider necesita la identidad del usuario.
          El ProjectProvider ahora envuelve al ThemeProvider para permitir la sincronización visual.
      */}
      <AuthProvider>
        <NotificationProvider>
          <ProjectProvider>
            <ThemeProvider>
              <ScrollToTop />
              <Routes>
                {/* RUTAS PÚBLICAS */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* RUTAS PRIVADAS */}
                <Route path="/" element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="project/:id" element={<KanbanBoard />} />
                  <Route path="team" element={<Team />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ThemeProvider>
          </ProjectProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;