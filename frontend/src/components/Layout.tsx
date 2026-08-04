import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../api/auth';
import { useState } from 'react';
import MonitoringPanel from '../pages/Monitoring';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◇' },
  { path: '/investments', label: 'Investimentos', icon: '◆' },
  { path: '/comercial', label: 'Comercial', icon: '○' },
  { path: '/assistant', label: 'Assistente', icon: '🤖' },
];

const bottomItems = [
  { path: '/admin', label: 'Admin', icon: '⚙', color: 'purple' },
  { path: '/settings', label: 'Configurações', icon: '⚙', color: 'gray' },
  { path: '/updates', label: 'Atualizações', icon: '⬡', color: 'blue' },
  { path: '/subscriptions', label: 'Assinaturas', icon: '★', color: 'emerald' },
  { path: '/downloads', label: 'Downloads', icon: '↓', color: 'blue' },
  { path: '/options', label: 'Opções', icon: '⚙', color: 'cyan' },
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

  function handleNav(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  const colorMap: Record<string, string> = {
    purple: 'hover:text-purple-400',
    gray: 'hover:text-white',
    blue: 'hover:text-blue-400',
    emerald: 'hover:text-emerald-400',
    cyan: 'hover:text-cyan-400',
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 sm:w-60 md:w-56 lg:w-60 xl:w-64 2xl:w-72 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800 z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo/Header */}
        <div className="p-4 sm:p-5 shrink-0">
          <h1 className="text-lg lg:text-xl font-bold">
            <span className="text-emerald-400">Nelci</span><span className="text-white">Tech3D</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1 truncate max-w-full">{user?.name}</p>
        </div>

        {/* Nav principal - scrollable se preciso */}
        <nav className="px-2 sm:px-3 space-y-1 flex-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {/* Separador */}
          <div className="border-t border-gray-800/50 my-2" />

          {/* Itens secundarios */}
          {bottomItems.map((item) => (
            user?.is_admin || item.label !== 'Admin' ? (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800/50 transition-all border border-transparent ${colorMap[item.color]}`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ) : null
          ))}

          {/* APM Monitoramento */}
          <button
            onClick={() => { setMonitorOpen(true); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
              monitorOpen
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'text-gray-400 hover:text-rose-400 hover:bg-gray-800/50 border-transparent'
            }`}
          >
            <span className="text-base shrink-0">◉</span>
            <span className="truncate">APM</span>
          </button>

          {/* Sair */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800/50 transition-all border border-transparent"
          >
            <span className="text-base shrink-0">↩</span>
            <span className="truncate">Sair</span>
          </button>
        </nav>
      </aside>

      {/* Conteudo principal */}
      <main className="flex-1 min-w-0 min-h-screen pb-16 md:pb-0">
        {/* Header mobile */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 text-xl p-1.5 rounded-lg hover:bg-gray-800/50">
            ☰
          </button>
          <h1 className="text-emerald-400 font-bold text-base">NelciTech3D</h1>
          <div className="w-9" />
        </div>

        <div className="pt-14 md:pt-0">
          {children}
        </div>
        <MonitoringPanel open={monitorOpen} onClose={() => setMonitorOpen(false)} />
      </main>
    </div>
  );
}
