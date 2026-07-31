import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
const types = ['receita', 'despesa'];
const categories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Salário', 'Freelance', 'Investimento', 'Outro'];

export default function Transactions() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', type: 'receita', description: '', category: 'Outro', value: '' });
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: () => api.getData(),
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: (item: any) => api.saveItem('transactions', item),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['data'] }); setShowForm(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteItem('transactions', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data'] }),
  });

  const items = data?.transactions || [];
  const filtered = filter ? items.filter((i: any) =>
    i.description?.toLowerCase().includes(filter.toLowerCase()) ||
    i.category?.toLowerCase().includes(filter.toLowerCase())
  ) : items;

  function openEdit(item: any) {
    setEditing(item);
    setForm({ date: item.date || '', type: item.type || 'receita', description: item.description || '', category: item.category || 'Outro', value: item.value || '' });
    setShowForm(true);
  }

  function openNew() {
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), type: 'receita', description: '', category: 'Outro', value: '' });
    setShowForm(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({ ...form, id: editing?.id || 'new' });
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Transações</h1>
        <button onClick={openNew} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + Nova Transação
        </button>
      </div>

      <input
        type="text" value={filter} onChange={e => setFilter(e.target.value)}
        placeholder="Buscar transações..."
        className="w-full mb-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
      />

      {isLoading && <p className="text-gray-400">Carregando...</p>}

      <div className="space-y-2">
        {filtered.map((tx: any) => (
          <div key={tx.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center hover:border-gray-700 transition">
            <div>
              <p className="text-white font-medium">{tx.description}</p>
              <p className="text-gray-500 text-sm">{tx.date} · {tx.category}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className={`font-semibold ${tx.type === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {parseFloat(tx.value || '0').toFixed(2)}
              </p>
              <button onClick={() => openEdit(tx)} className="text-gray-400 hover:text-emerald-400 transition">✎</button>
              <button onClick={() => deleteMutation.mutate(tx.id)} className="text-gray-400 hover:text-red-400 transition">×</button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-gray-500 text-center py-8">Nenhuma transação encontrada</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800 mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">{editing ? 'Editar' : 'Nova'} Transação</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500">
                  {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor</label>
                <input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition disabled:opacity-50">
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
