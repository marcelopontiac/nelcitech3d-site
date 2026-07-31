import { useState, useEffect } from 'react';
import { useAuth } from '../api/auth';

const eyeOff = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const eyeOn = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const apps = [
  { name: 'Linux (.deb)', icon: '🐧', desc: 'Debian / Ubuntu / Mint', file: 'nelcitech3d.deb' },
  { name: 'Linux (.AppImage)', icon: '🐧', desc: 'Qualquer distribuição Linux', file: 'nelcitech3d.AppImage' },
  { name: 'Linux (.rpm)', icon: '🐧', desc: 'Fedora / RHEL / CentOS', file: 'nelcitech3d.rpm' },
  { name: 'Linux (.tar.gz)', icon: '🐧', desc: 'Portátil - qualquer Linux', file: 'nelcitech3d.tar.gz' },
  { name: 'Linux (.snap)', icon: '🐧', desc: 'Snap Store', file: 'nelcitech3d.snap' },
  { name: 'Linux (flatpak)', icon: '🐧', desc: 'Flatpak / Flathub', file: 'nelcitech3d.flatpak' },
  { name: 'Windows (.exe)', icon: '⊞', desc: 'Windows 10 / 11', file: 'nelcitech3d.exe' },
  { name: 'macOS (.zip)', icon: '🍎', desc: 'Intel e Apple Silicon', file: 'nelcitech3d.zip' },
];

export default function Options() {
  const { user } = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [restartMsg, setRestartMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setInstalling(false);
  }

  async function handleRestart() {
    if (!confirm('Reiniciar o sistema agora? O servidor ficará offline por alguns instantes.')) return;
    setRestartMsg(null);
    setRestarting(true);
    try {
      const res = await fetch('/api/system/restart', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRestartMsg({ text: data.message || 'Sistema reiniciando...' });
        setTimeout(() => { setRestarting(false); }, 3000);
      } else {
        setRestartMsg({ text: data.detail || 'Erro ao reiniciar', error: true });
        setRestarting(false);
      }
    } catch (e: any) {
      setRestartMsg({ text: e.message || 'Erro de conexão', error: true });
      setRestarting(false);
    }
  }

  async function handleChangePassword() {
    setMsg(null);
    if (!currentPass || !newPass) {
      setMsg({ text: 'Preencha todos os campos', error: true });
      return;
    }
    if (newPass.length < 6) {
      setMsg({ text: 'Nova senha deve ter no mínimo 6 caracteres', error: true });
      return;
    }
    setLoading(true);
    try {
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password: currentPass }),
      });
      const loginData = await loginRes.json();
      if (!loginData.ok) {
        setMsg({ text: 'Senha atual incorreta', error: true });
        setLoading(false);
        return;
      }
      const updateRes = await fetch('/api/me/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ password: newPass }),
      });
      const updateData = await updateRes.json();
      if (updateData.ok) {
        setMsg({ text: 'Senha alterada com sucesso!' });
        setCurrentPass('');
        setNewPass('');
      } else {
        setMsg({ text: updateData.error || 'Erro ao alterar senha', error: true });
      }
    } catch (e: any) {
      setMsg({ text: e.message || 'Erro de conexão', error: true });
    }
    setLoading(false);
  }

  const pwaInstallable = typeof window !== 'undefined' && 'serviceWorker' in navigator && window.matchMedia('(display-mode: standalone)').matches === false;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Opções</h1>
        <p className="text-gray-500 text-sm">Configurações e ações do sistema</p>
      </div>

      {/* App Download */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
        <h2 className="text-white font-semibold mb-1">Baixar Aplicativo</h2>
        <p className="text-gray-500 text-sm mb-5">Escolha seu sistema operacional</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {apps.map((app) => (
            <a key={app.name} href={`/downloads/${app.file}`} download
              className="flex items-center gap-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600/50 rounded-lg p-4 transition group">
              <span className="text-2xl text-emerald-400 group-hover:scale-110 transition">{app.icon}</span>
              <div>
                <p className="text-white font-medium text-sm">{app.name}</p>
                <p className="text-gray-500 text-xs">{app.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* PWA Install */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
        <h2 className="text-white font-semibold mb-1">Instalar App (PWA)</h2>
        <p className="text-gray-500 text-sm mb-5">Instale como aplicativo no seu celular</p>
        <button onClick={handleInstall} disabled={!deferredPrompt || installing}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {installing ? 'Instalando...' : 'Instalar'}
        </button>
        {!deferredPrompt && (
          <p className="text-gray-600 text-xs mt-3">
            {pwaInstallable ? 'O botão de instalação ficará disponível quando o navegador permitir (geralmente após algumas visitas).' : 'Você já está usando o aplicativo instalado ou o navegador não suporta instalação PWA aqui.'}
          </p>
        )}
      </div>

      {/* Restart System */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
        <h2 className="text-white font-semibold mb-1">Reiniciar Sistema</h2>
        <p className="text-gray-500 text-sm mb-5">Reinicia o servidor e o sistema operacional</p>
        <button onClick={handleRestart} disabled={restarting}
          className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
          <svg className={`w-4 h-4 ${restarting?'animate-spin':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          {restarting ? 'Reiniciando...' : 'Reiniciar Sistema'}
        </button>
        {restartMsg && (
          <p className={`text-sm mt-3 ${restartMsg.error ? 'text-red-400' : 'text-emerald-400'}`}>{restartMsg.text}</p>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
        <h2 className="text-white font-semibold mb-1">Trocar Senha</h2>
        <p className="text-gray-500 text-sm mb-5">Altere sua senha de acesso</p>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Senha Atual</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} placeholder="Sua senha atual" value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showCurrent ? eyeOff : eyeOn}
              </button>
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Nova Senha</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showNew ? eyeOff : eyeOn}
              </button>
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
          {msg && (
            <p className={`text-sm ${msg.error ? 'text-red-400' : 'text-emerald-400'}`}>{msg.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
