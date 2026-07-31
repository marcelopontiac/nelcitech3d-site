import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export default function Suppliers() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', cnpj: '', phone: '', email: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: () => api.getData(),
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: (item: any) => api.saveItem('suppliers', item),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['data'] }); setShowForm(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteItem('suppliers', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data'] }),
  });

  const items = data?.suppliers || [];

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', contact: '', cnpj: '', phone: '', email: '' }); setShowForm(true); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Novo Fornecedor</button>
      </div>

      {isLoading && <p className="text-gray-400">Carregando...</p>}

      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center hover:border-gray-700 transition">
            <div>
              <p className="text-white font-medium">{item.name}</p>
              <p className="text-gray-500 text-sm">{item.contact} · {item.email || item.phone || item.cnpj}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setEditing(item); setForm({ name: item.name, contact: item.contact || '', cnpj: item.cnpj || '', phone: item.phone || '', email: item.email || '' }); setShowForm(true); }}
                className="text-gray-400 hover:text-emerald-400 transition">✎</button>
              <button onClick={() => deleteMutation.mutate(item.id)} className="text-gray-400 hover:text-red-400 transition">×</button>
            </div>
          </div>
        ))}
        {!isLoading && items.length === 0 && <p className="text-gray-500 text-center py-8">Nenhum fornecedor cadastrado</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800 mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">{editing ? 'Editar' : 'Novo'} Fornecedor</h2>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...form, id: editing?.id || 'new' }); }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contato</label>
                <input type="text" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">CNPJ</label>
                <input type="text" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
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
