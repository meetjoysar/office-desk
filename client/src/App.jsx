import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import MyWork from './pages/MyWork';
import Dashboard from './pages/Dashboard';
import TaskForm from './pages/TaskForm';
import AllTasks from './pages/AllTasks';
import Inward from './pages/Inward';
import Outward from './pages/Outward';
import Documents from './pages/Documents';
import Clients from './pages/Clients';
import Settings from './pages/Settings';

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
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<MyWork />} />
            <Route path="/tasks/new" element={<TaskForm />} />
            <Route path="/inward" element={<Inward />} />
            <Route path="/outward" element={<Outward />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/dashboard" element={<BossOnly><Dashboard /></BossOnly>} />
            <Route path="/tasks" element={<BossOnly><AllTasks /></BossOnly>} />
            <Route path="/tasks/:id/edit" element={<BossOnly><TaskForm /></BossOnly>} />
            <Route path="/clients" element={<BossOnly><Clients /></BossOnly>} />
            <Route path="/settings" element={<BossOnly><Settings /></BossOnly>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}