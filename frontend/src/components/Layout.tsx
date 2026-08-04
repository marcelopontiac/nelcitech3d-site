import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../api/auth';
import { useState, useRef } from 'react';
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
  const [clipOpen, setClipOpen] = useState(false);
  const [clipText, setClipText] = useState('');
  const [clipSaved, setClipSaved] = useState(false);
  const clipRef = useRef<HTMLTextAreaElement>(null);

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

      {/* Botão flutuante Clipboard */}
      <button
        onClick={() => { setClipOpen(!clipOpen); setClipSaved(false); }}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-110"
        title="Colar script/artigo"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </button>

      {/* Painel Clipboard */}
      {clipOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end p-4 md:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setClipOpen(false)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div>
                <h3 className="text-white font-semibold text-sm">Clipboard</h3>
                <p className="text-gray-500 text-xs">Cole scripts, artigos ou qualquer texto para análise</p>
              </div>
              <button onClick={() => setClipOpen(false)} className="text-gray-400 hover:text-white text-lg p-1">✕</button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <textarea
                ref={clipRef}
                value={clipText}
                onChange={e => { setClipText(e.target.value); setClipSaved(false); }}
                placeholder="Cole aqui seu script, artigo ou qualquer conteúdo..."
                className="w-full h-full min-h-[200px] bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm font-mono resize-none focus:outline-none focus:border-blue-500/50 transition scrollbar-thin"
                style={{ minHeight: '250px' }}
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <span className="text-gray-500 text-xs">{clipText.length} caracteres</span>
              <div className="flex gap-2">
                {clipText && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(clipText);
                      setClipSaved(true);
                      setTimeout(() => setClipSaved(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 transition"
                  >
                    {clipSaved ? 'Copiado!' : 'Copiar'}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!clipText.trim()) return;
                    const blob = new Blob([clipText], { type: 'text/plain' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `script-${new Date().toISOString().slice(0,10)}.txt`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 transition"
                >
                  Salvar .txt
                </button>
                <button
                  onClick={() => { setClipText(''); setClipSaved(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 transition"
                >
                  Limpar
                </button>
                <button
                  onClick={async () => {
                    if (!clipText.trim()) return;
                    try {
                      const token = localStorage.getItem('token') || '';
                      const res = await fetch('/api/analyze', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ text: clipText }),
                      });
                      const result = await res.json();
                      if (!res.ok) throw new Error(result.detail || 'Erro');
                      setClipSaved(true);
                      setTimeout(() => setClipSaved(false), 2000);
                    } catch {}
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition"
                >
                  Analisar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
