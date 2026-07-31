import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export default function Admin() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'users' | 'codes'>('users');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.admin.users(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: body }: { id: string; data: any }) => api.admin.updateUser(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.users || [];
  const premium = users.filter((u: any) => u.premium).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Painel Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase">Usuários</p>
          <p className="text-2xl font-bold text-blue-400">{users.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase">Premium</p>
          <p className="text-2xl font-bold text-emerald-400">{premium}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
        <button onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'users' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}>
          Usuários
        </button>
        <button onClick={() => setTab('codes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'codes' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}>
          Códigos
        </button>
      </div>

      {tab === 'users' && (
        <div className="space-y-2">
          {isLoading && <p className="text-gray-400">Carregando...</p>}
          {users.map((u: any) => (
            <div key={u.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">{u.name || 'Sem nome'}</p>
                  <p className="text-gray-500 text-sm">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.premium ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                    {u.premium ? 'Premium' : 'Free'}
                  </span>
                  {u.is_admin && <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">Admin</span>}
                  {u.demo && <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded">Demo</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => updateMutation.mutate({ id: u.id, data: { premium: !u.premium } })}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition">
                  Toggle Premium
                </button>
                <button onClick={() => {
                  const date = prompt('Nova data de expiração (YYYY-MM-DD) ou deixe vazio para remover:', u.expire_at || '');
                  if (date !== null) updateMutation.mutate({ id: u.id, data: { expire_at: date } });
                }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition">
                  Expirar
                </button>
                <button onClick={() => { if (confirm('Excluir este usuário?')) deleteMutation.mutate(u.id); }}
                  className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded transition">
                  Excluir
                </button>
              </div>
              {u.expire_at && <p className="text-xs text-gray-500 mt-2">Expira em: {u.expire_at}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'codes' && (
        <CodeGenerator />
      )}
    </div>
  );
}

function CodeGenerator() {
  const [plan, setPlan] = useState('monthly');
  const [qty, setQty] = useState(5);
  const [codes, setCodes] = useState<string[]>([]);

  function generate() {
    const generated: string[] = [];
    for (let i = 0; i < qty; i++) {
      const p1 = Math.random().toString(16).slice(2, 10).toUpperCase();
      const p2 = Math.random().toString(16).slice(2, 8).toUpperCase();
      generated.push(`NELC-${p1}-${p2}`);
    }
    setCodes(generated);
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-white font-semibold mb-4">Gerar Códigos de Ativação</h2>
        <div className="flex gap-3 mb-4">
          <select value={plan} onChange={e => setPlan(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
            <option value="monthly">Mensal (30 dias)</option>
            <option value="yearly">Anual (365 dias)</option>
          </select>
          <input type="number" value={qty} onChange={e => setQty(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" min="1" max="50" />
          <button onClick={generate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            Gerar
          </button>
        </div>
        {codes.length > 0 && (
          <div className="space-y-2">
            {codes.map((code, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                <code className="text-emerald-400 text-sm font-mono">{code}</code>
                <button onClick={() => copyCode(code)}
                  className="text-xs text-gray-400 hover:text-white transition">Copiar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
