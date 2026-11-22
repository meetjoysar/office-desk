import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import Login from './pages/Login';
import Home from './pages/Home';

// Sends you to /login if not logged in; blocks staff from boss pages
function RequireAuth({ children, bossOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (bossOnly && user.role !== 'BOSS') return <p className="card">Only bosses can open this page.</p>;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Home title="My Work" /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth bossOnly><Home title="Office today" /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}