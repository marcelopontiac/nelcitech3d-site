import { useState, useEffect } from 'react';
import { clearToken } from '../api/client';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export default function Settings() {
  const navigate = useNavigate();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: api.me }) as any;

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (me?.name) setName(me.name || '');
  }, [me]);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
        <div>
          <h2 className="text-white font-semibold mb-4">Aparência</h2>
          <div className="flex gap-2">
            <button onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${theme === 'dark' ? 'bg-gray-700 text-white ring-2 ring-emerald-500' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              Escuro
            </button>
            <button onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${theme === 'light' ? 'bg-white text-gray-900 ring-2 ring-emerald-500 shadow-sm' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              Claro
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Perfil</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
            <input type="password" placeholder="Nova senha (deixe vazio para manter)" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
            <button onClick={async () => {
              try {
                setMsg('');
                const body: Record<string, string> = {};
                if (name) body.name = name;
                if (password) body.password = password;
                const res = await fetch('/api/me/update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                  body: JSON.stringify(body),
                });
                const data = await res.json();
                setMsg(data.message || 'Salvo!');
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
              Salvar
            </button>
            {msg && <p className="text-sm text-emerald-400">{msg}</p>}
          </div>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Sessão</h2>
          <button onClick={() => { clearToken(); navigate('/login'); }}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-6 py-2.5 rounded-lg text-sm font-medium transition">
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
