import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './api/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Comercial from './pages/Comercial';
import Investments from './pages/Investments';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Updates from './pages/Updates';
import Subscriptions from './pages/Subscriptions';
import Downloads from './pages/Downloads';
import Options from './pages/Options';
import Assistant from './pages/Assistant';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Carregando...</div>;
  if (!user?.logged_in) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/comercial" element={<Comercial />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/options" element={<Options />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
