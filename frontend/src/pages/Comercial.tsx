import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = { green: '#34D399', red: '#F87171', blue: '#3B82F6', purple: '#8B5CF6', orange: '#FB923C', emerald: '#10B981' };
const PIE_COLORS = ['#F87171', '#FB923C', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'];
const fn = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtTooltip = (value: any) => fn(Number(value) || 0);

const purchaseCats = ['Matéria Prima', 'Estoque', 'Equipamento', 'Serviço', 'Outro'];
const saleCats = ['Produto', 'Serviço', 'Digital', 'Outro'];
const payments = ['Pix', 'Boleto', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro', 'Transferência', 'Outro'];

type Tab = 'dashboard' | 'suppliers' | 'purchases' | 'sales';

const META_KEY = 'comercial_meta_mensal';

export default function Comercial() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'supplier' | 'purchase' | 'sale'>('supplier');
  const [form, setForm] = useState<any>({});
  const [metaInput, setMetaInput] = useState(() => localStorage.getItem(META_KEY) || '');

  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: () => api.getData(),
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: ({ type, item }: { type: string; item: any }) => api.saveItem(type, item),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['data'] }); setShowForm(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => api.deleteItem(type, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data'] }),
  });

  const suppliers = data?.suppliers || [];
  const purchases = data?.purchases || [];
  const sales = data?.sales || [];

  const totalVendas = sales.reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);
  const totalCompras = purchases.reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);
  const lucro = totalVendas - totalCompras;
  const margem = totalVendas > 0 ? (lucro / totalVendas) * 100 : 0;

  const monthlyVendas = sales.filter((t: any) => t.date).reduce((acc: any, t: any) => {
    const m = t.date.slice(0, 7);
    let e = acc.find((a: any) => a.month === m);
    if (!e) { e = { month: m, vendas: 0, compras: 0 }; acc.push(e); }
    e.vendas += parseFloat(t.value) || 0;
    return acc;
  }, []).sort((a: any, b: any) => a.month.localeCompare(b.month));
  purchases.filter((t: any) => t.date).forEach((t: any) => {
    const m = t.date.slice(0, 7);
    let e = monthlyVendas.find((a: any) => a.month === m);
    if (!e) { e = { month: m, vendas: 0, compras: 0 }; monthlyVendas.push(e); monthlyVendas.sort((a: any, b: any) => a.month.localeCompare(b.month)); }
    e.compras += parseFloat(t.value) || 0;
  });

  const metaMensal = parseFloat(metaInput) || 0;
  const vendasMetaChart = monthlyVendas.map((m: any) => ({ ...m, meta: metaMensal }));
  const lucroMensalChart = monthlyVendas.map((m: any) => ({ ...m, lucro: m.vendas - m.compras }));

  const vendasPorCat = sales.filter((t: any) => t.category).reduce((acc: any, t: any) => {
    const e = acc.find((a: any) => a.name === t.category);
    if (e) e.value += parseFloat(t.value) || 0;
    else acc.push({ name: t.category, value: parseFloat(t.value) || 0 });
    return acc;
  }, []);

  const comprasVendasPorCat = Array.from(new Set([...sales, ...purchases].filter((t: any) => t.category).map((t: any) => t.category)))
    .map((cat: any) => ({
      name: cat,
      compras: purchases.filter((t: any) => t.category === cat).reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0),
      vendas: sales.filter((t: any) => t.category === cat).reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0),
    }));

  const supplierCompras = (name: string) => purchases.filter((p: any) => (p.supplier || '') === name).reduce((s: number, p: any) => s + (parseFloat(p.value) || 0), 0);

  function openNew(type: 'supplier' | 'purchase' | 'sale') {
    setFormType(type);
    setEditing(null);
    if (type === 'supplier') setForm({ name: '', contact: '', cnpj: '', phone: '', email: '', products: '', rating: '' });
    else if (type === 'purchase') setForm({ date: new Date().toISOString().slice(0, 10), description: '', supplier: '', category: 'Outro', payment: 'Pix', value: '' });
    else setForm({ date: new Date().toISOString().slice(0, 10), description: '', category: 'Outro', payment: 'Pix', value: '' });
    setShowForm(true);
  }

  function openEdit(type: string, item: any) {
    setFormType(type as any);
    setEditing(item);
    setForm({ ...item });
    setShowForm(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const typeMap = { supplier: 'suppliers', purchase: 'purchases', sale: 'sales' };
    saveMutation.mutate({ type: typeMap[formType], item: { ...form, id: editing?.id || 'new' } });
  }

  function renderForm() {
    const isSupplier = formType === 'supplier';
    const isPurchase = formType === 'purchase';
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
        <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800 mx-4" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-white mb-4">
            {editing ? 'Editar' : 'Nova'} {isSupplier ? 'Fornecedor' : isPurchase ? 'Compra' : 'Venda'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            {isSupplier ? (
              <>
                <div><label className="block text-sm text-gray-400 mb-1">Nome do Fornecedor</label><input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Contato</label><input type="text" value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-400 mb-1">CNPJ</label><input type="text" value={form.cnpj || ''} onChange={e => setForm({ ...form, cnpj: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" /></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Telefone</label><input type="text" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" /></div>
                </div>
                <div><label className="block text-sm text-gray-400 mb-1">E-mail</label><input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Produtos/Serviços fornecidos</label><input type="text" value={form.products || ''} onChange={e => setForm({ ...form, products: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Materiais elétricos, manutenção" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Avaliação do fornecedor</label>
                  <select value={form.rating || ''} onChange={e => setForm({ ...form, rating: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500">
                    <option value="">— Selecione —</option>
                    <option value="Excelente">⭐ Excelente</option>
                    <option value="Bom">🙂 Bom</option>
                    <option value="Regular">😐 Regular</option>
                    <option value="Ruim">👎 Ruim</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-400 mb-1">Data</label><input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required /></div>
                  {isPurchase && <div><label className="block text-sm text-gray-400 mb-1">Fornecedor</label>
                    <input list="suppliers-list" type="text" value={form.supplier || ''} onChange={e => setForm({ ...form, supplier: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
                    <datalist id="suppliers-list">{suppliers.map((s: any) => <option key={s.id} value={s.name} />)}</datalist>
                  </div>}
                </div>
                <div><label className="block text-sm text-gray-400 mb-1">Descrição</label><input type="text" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-400 mb-1">Categoria</label><select value={form.category || 'Outro'} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500">
                    {(isPurchase ? purchaseCats : saleCats).map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Pagamento</label><select value={form.payment || 'Pix'} onChange={e => setForm({ ...form, payment: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500">
                    {payments.map(p => <option key={p} value={p}>{p}</option>)}
                  </select></div>
                </div>
                <div><label className="block text-sm text-gray-400 mb-1">Valor</label><input type="number" step="0.01" value={form.value || ''} onChange={e => setForm({ ...form, value: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required /></div>
              </>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition">Cancelar</button>
              <button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition disabled:opacity-50">
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'suppliers', label: 'Fornecedores' },
    { key: 'purchases', label: 'Compras' },
    { key: 'sales', label: 'Vendas' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Comercial</h1>
        {tab !== 'dashboard' && (
          <button
            onClick={() => openNew(tab === 'suppliers' ? 'supplier' : tab === 'purchases' ? 'purchase' : 'sale')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Novo
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Receitas Totais</p>
              <p className="text-2xl font-bold text-emerald-400">{fn(totalVendas)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Despesas</p>
              <p className="text-2xl font-bold text-orange-400">{fn(totalCompras)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fn(lucro)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Margem %</p>
              <p className="text-2xl font-bold text-blue-400">{margem.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {monthlyVendas.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-white font-semibold mb-4">Evolução Mensal</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyVendas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} formatter={fmtTooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="vendas" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} name="Vendas" />
                    <Line type="monotone" dataKey="compras" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3 }} name="Compras" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {monthlyVendas.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white font-semibold">Vendas vs Meta</h2>
                  <div className="flex items-center gap-1">
                    <input type="number" placeholder="Meta R$" value={metaInput}
                      onChange={e => { setMetaInput(e.target.value); localStorage.setItem(META_KEY, e.target.value); }}
                      className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500" />
                    <span className="text-gray-500 text-xs">meta/mês</span>
                  </div>
                </div>
                {metaMensal > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={vendasMetaChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} formatter={fmtTooltip} />
                      <Legend />
                      <Bar dataKey="vendas" fill={COLORS.green} radius={[4, 4, 0, 0]} name="Vendas" maxBarSize={36} />
                      <Line type="monotone" dataKey="meta" stroke={COLORS.blue} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Meta" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-12 text-sm">Defina uma meta mensal no campo acima para comparar com as vendas.</p>
                )}
              </div>
            )}

            {vendasPorCat.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-white font-semibold mb-4">Vendas por Categoria</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={vendasPorCat} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {vendasPorCat.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} formatter={fmtTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {comprasVendasPorCat.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-white font-semibold mb-4">Compras vs Vendas por Categoria</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={comprasVendasPorCat} barCategoryGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} formatter={fmtTooltip} />
                    <Legend />
                    <Bar dataKey="compras" fill={COLORS.red} radius={[4, 4, 0, 0]} name="Compras" maxBarSize={40} />
                    <Bar dataKey="vendas" fill={COLORS.green} radius={[4, 4, 0, 0]} name="Vendas" maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {monthlyVendas.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-white font-semibold mb-4">Lucro Mensal</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={lucroMensalChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} formatter={fmtTooltip} />
                    <Bar dataKey="lucro" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="Lucro" maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Fornecedores ({suppliers.length})</h2>
            {suppliers.length === 0 ? <p className="text-gray-500 text-center py-8">Nenhum</p> : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {suppliers.map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center bg-gray-800/50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white text-sm">{s.name}</p>
                      <p className="text-gray-500 text-xs">{s.contact || s.email || s.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-400 text-xs font-medium">Compras: {fn(supplierCompras(s.name))}</span>
                      <button onClick={() => { setTab('suppliers'); openEdit('supplier', s); }} className="text-gray-400 hover:text-emerald-400 text-sm">✎</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'suppliers' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b border-gray-800">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Compras</p>
              <p className="text-xl font-bold text-orange-400">{fn(totalCompras)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Vendas</p>
              <p className="text-xl font-bold text-emerald-400">{fn(totalVendas)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Fornecedores</p>
              <p className="text-xl font-bold text-white">{suppliers.length}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Média Compras</p>
              <p className="text-xl font-bold text-blue-400">{suppliers.length ? fn(totalCompras / suppliers.length) : fn(0)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 uppercase border-b border-gray-800 text-xs">
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Contato</th>
                  <th className="text-left px-4 py-3">CNPJ</th>
                  <th className="text-left px-4 py-3">Telefone</th>
                  <th className="text-left px-4 py-3">E-mail</th>
                  <th className="text-left px-4 py-3">Produtos/Serviços</th>
                  <th className="text-left px-4 py-3">Avaliação</th>
                  <th className="text-center px-4 py-3">Editar</th>
                  <th className="text-center px-4 py-3">Deletar</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-300">{s.contact || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{s.cnpj || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{s.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">{s.products || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.rating === 'Excelente' ? 'bg-emerald-500/15 text-emerald-400' :
                        s.rating === 'Bom' ? 'bg-blue-500/15 text-blue-400' :
                        s.rating === 'Regular' ? 'bg-yellow-500/15 text-yellow-400' :
                        s.rating === 'Ruim' ? 'bg-red-500/15 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
                        {s.rating || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit('supplier', s)} className="text-gray-400 hover:text-emerald-400 transition text-lg">✎</button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deleteMutation.mutate({ type: 'suppliers', id: s.id })} className="text-gray-400 hover:text-red-400 transition text-lg">🗑</button>
                    </td>
                  </tr>
                ))}
                {!isLoading && suppliers.length === 0 && <tr><td colSpan={9} className="text-center text-gray-500 py-8">Nenhum fornecedor</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'purchases' && (
        <div className="space-y-2">
          {purchases.map((item: any) => (
            <div key={item.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center hover:border-gray-700 transition">
              <div>
                <p className="text-white font-medium">{item.description}</p>
                <p className="text-gray-500 text-sm">{item.date} · {item.supplier} · {item.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-orange-400">{fn(parseFloat(item.value || '0'))}</p>
                <button onClick={() => openEdit('purchase', item)} className="text-gray-400 hover:text-emerald-400 transition">✎</button>
                <button onClick={() => deleteMutation.mutate({ type: 'purchases', id: item.id })} className="text-gray-400 hover:text-red-400 transition">×</button>
              </div>
            </div>
          ))}
          {!isLoading && purchases.length === 0 && <p className="text-gray-500 text-center py-8">Nenhuma compra</p>}
        </div>
      )}

      {tab === 'sales' && (
        <div className="space-y-2">
          {sales.map((item: any) => (
            <div key={item.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center hover:border-gray-700 transition">
              <div>
                <p className="text-white font-medium">{item.description}</p>
                <p className="text-gray-500 text-sm">{item.date} · {item.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-emerald-400">{fn(parseFloat(item.value || '0'))}</p>
                <button onClick={() => openEdit('sale', item)} className="text-gray-400 hover:text-emerald-400 transition">✎</button>
                <button onClick={() => deleteMutation.mutate({ type: 'sales', id: item.id })} className="text-gray-400 hover:text-red-400 transition">×</button>
              </div>
            </div>
          ))}
          {!isLoading && sales.length === 0 && <p className="text-gray-500 text-center py-8">Nenhuma venda</p>}
        </div>
      )}

      {showForm && renderForm()}
    </div>
  );
}
