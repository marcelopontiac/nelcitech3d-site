import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../api/auth';
import { useState } from 'react';
import MonitoringPanel from '../pages/Monitoring';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◇' },
  { path: '/investments', label: 'Investimentos', icon: '◆' },
  { path: '/comercial', label: 'Comercial', icon: '○' },
  { path: '/assistant', label: 'Assistente Financeiro', icon: '🤖' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <div className={`fixed inset-0 bg-black/50 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800 z-50 transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h1 className="text-xl font-bold">
            <span className="text-emerald-400">Nelci</span><span className="text-white">Tech3D</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 truncate">{user?.name}</p>
        </div>

        <nav className="px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 space-y-1">
          {user?.is_admin && (
            <button onClick={() => { navigate('/admin'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-purple-400 hover:bg-gray-800/50 transition-all">
              <span className="text-lg">⚙</span>
              Admin
            </button>
          )}
          <button onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all">
            <span className="text-lg">⚙</span>
            Configurações
          </button>
          <button onClick={() => { navigate('/updates'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 transition-all">
            <span className="text-lg">⬡</span>
            Atualizações
          </button>
          <button onClick={() => { navigate('/subscriptions'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-emerald-400 hover:bg-gray-800/50 transition-all">
            <span className="text-lg">★</span>
            Assinaturas
          </button>
          <button onClick={() => { setMonitorOpen(true); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${monitorOpen ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-400 hover:text-rose-400 hover:bg-gray-800/50'}`}>
            <span className="text-lg">◉</span>
            APM Monitoramento
          </button>
          <button onClick={() => { navigate('/downloads'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 transition-all">
            <span className="text-lg">↓</span>
            Downloads
          </button>
          <button onClick={() => { navigate('/options'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50 transition-all">
            <span className="text-lg">⚙</span>
            Opções
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800/50 transition-all">
            <span className="text-lg">↩</span>
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen pb-16">
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 text-xl p-1">☰</button>
          <h1 className="text-emerald-400 font-bold">NelciTech3D</h1>
          <div className="w-8" />
        </div>
        <div className="pt-14 md:pt-0">
          {children}
        </div>
        <MonitoringPanel open={monitorOpen} onClose={() => setMonitorOpen(false)} />
      </main>
    </div>
  );
}
