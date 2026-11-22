import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Inward from './pages/Inward';
import Outward from './pages/Outward';
import Documents from './pages/Documents';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function BossOnly({ children }) {
  const { user } = useAuth();
  return user.role === 'BOSS' ? children : <div className="card">Only bosses can open this page.</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Every page inside here gets the top bar and needs login */}
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Home title="My Work" />} />
            <Route path="/dashboard" element={<BossOnly><Home title="Office today" /></BossOnly>} />
            <Route path="/clients" element={<BossOnly><Clients /></BossOnly>} />
            <Route path="/settings" element={<BossOnly><Settings /></BossOnly>} />
            <Route path="/inward" element={<Inward />} />
            <Route path="/outward" element={<Outward />} />
            <Route path="/documents" element={<Documents />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}