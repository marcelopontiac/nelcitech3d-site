import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { useTheme } from '../hooks/useTheme';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';

const C = { emerald: '#10B981', green: '#34D399', red: '#F87171', blue: '#3B82F6', teal: '#14B8A6' };
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CATS = ['Alimentação','Transporte','Moradia','Saúde','Lazer','Educação','Salário','Freelance','Investimento','Cartão de Crédito e Débito','Banco Itau','Banco Nomad','Outro'];
const TYPES = ['receita','despesa'];

function fmt(v: number) { return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
const ftm = (v: any) => fmt(Number(v)||0);

export default function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { chart } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ date:'', type:'receita', description:'', category:'Outro', value:'' });
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey:['data'], queryFn:()=>api.getData(), refetchOnWindowFocus:false,
  });

  const saveTx = useMutation({
    mutationFn:(item:any)=>api.saveItem('transactions',item),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['data']}); setShowForm(false); setEditing(null); },
  });
  const delTx = useMutation({
    mutationFn:(id:string)=>api.deleteItem('transactions',id),
    onSuccess:()=>qc.invalidateQueries({queryKey:['data']}),
  });

  const all: any[] = data?.transactions || [];
  const flt = all.filter((t:any)=>{
    if(!t.date) return false;
    if(t.date.slice(0,4)!==String(year)) return false;
    if(month && t.date.slice(5,7)!==month) return false;
    return true;
  });

  const rec = flt.filter((t:any)=>(t.type||'').toLowerCase()==='receita').reduce((s:number,t:any)=>s+(parseFloat(t.value)||0),0);
  const desp = flt.filter((t:any)=>(t.type||'').toLowerCase()==='despesa').reduce((s:number,t:any)=>s+(parseFloat(t.value)||0),0);
  const saldo = rec - desp;

  const catData = Array.from(new Set(all.filter((t:any)=>t.category).map((t:any)=>t.category)))
    .map((cat:any)=>{
      const r = flt.filter((t:any)=>t.category===cat&&(t.type||'').toLowerCase()==='receita').reduce((s:number,t:any)=>s+(parseFloat(t.value)||0),0);
      const d = flt.filter((t:any)=>t.category===cat&&(t.type||'').toLowerCase()==='despesa').reduce((s:number,t:any)=>s+(parseFloat(t.value)||0),0);
      return { name:cat, receita:r, despesa:d };
    }).filter((c:any)=>c.receita||c.despesa);

  const monthlyData = all.filter((t:any)=>t.date&&t.date.slice(0,4)===String(year))
    .reduce((acc:any,t:any)=>{
      const m = t.date.slice(5,7);
      let e = acc.find((a:any)=>a.month===m);
      if(!e){ e={month:m,receita:0,despesa:0}; acc.push(e); }
      const v = parseFloat(t.value)||0;
      if((t.type||'').toLowerCase()==='receita') e.receita+=v; else e.despesa+=v;
      return acc;
    },[]).sort((a:any,b:any)=>a.month.localeCompare(b.month));

  const balanceData = monthlyData.map((m:any,i:number,arr:any[])=>{
    const prev = i>0?arr[i-1]._balance:0;
    return{...m,_balance:prev+m.receita-m.despesa, _despesa:-m.despesa};
  });

  function openNew(){
    setEditing(null);
    setFormError('');
    const m = month ? String(month).padStart(2,'0') : String(now.getMonth()+1).padStart(2,'0');
    const y = String(year);
    setForm({date:`${y}-${m}-01`,type:'receita',description:'',category:'Outro',value:''});
    setShowForm(true);
  }
  function openEdit(tx:any){
    setEditing(tx);
    setFormError('');
    setForm({date:tx.date||'',type:(tx.type||'receita').toLowerCase(),description:tx.description||'',category:tx.category||'Outro',value:tx.value||''});
    setShowForm(true);
  }

  if(isLoading) return <div className="text-gray-400 p-8 text-center">Carregando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-xs">Olá, {user?.name||'Usuário'}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
            className="bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500/50 backdrop-blur-sm">
            {Array.from({length:15},(_,i)=>2020+i).map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openNew}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Saldo', value:saldo, cls:saldo>=0?'from-emerald-400 to-emerald-600':'from-red-400 to-red-600', icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label:'Receitas', value:rec, cls:'from-green-400 to-emerald-500', icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label:'Despesas', value:desp, cls:'from-red-400 to-rose-500', icon:'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' },
          { label:'Transações', value:flt.length, cls:'from-blue-400 to-indigo-500', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        ].map((c,i)=>(
          <div key={i} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-br ${c.cls} rounded-xl opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="relative bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 hover:border-gray-700/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{c.label}</span>
                <svg className={`w-4 h-4 ${i<3?'text-gray-500':'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} />
                </svg>
              </div>
              <p className={`text-lg md:text-xl font-bold ${i<3?'text-white':'text-blue-400'}`}>
                {i<3?fmt(c.value):c.value}
              </p>
              {i<3&&(
                <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${c.cls} transition-all`}
                    style={{width:`${Math.min(100,Math.abs(c.value)/(rec||1)*100)}%`}} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
        <button onClick={()=>setMonth(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            month===null ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10' : 'bg-gray-800/40 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 border border-transparent'}`}>
          Todos
        </button>
        {MONTHS.map((name,i)=>{
          const m=String(i+1).padStart(2,'0');
          const cnt=all.filter((t:any)=>t.date&&t.date.slice(0,4)===String(year)&&t.date.slice(5,7)===m).length;
          return(
            <button key={m} onClick={()=>setMonth(m)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                month===m ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10' : 'bg-gray-800/40 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 border border-transparent'}`}>
              {name}{cnt>0&&<span className="text-gray-600 ml-1 font-normal">{cnt}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
          <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Receitas vs Despesas por Categoria</h3>
          {catData.length>0?(
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={catData} barCategoryGap={6} margin={{bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis dataKey="name" stroke={chart.axis} tick={{fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis stroke={chart.axis} tick={{fontSize:10}} tickFormatter={(v:number)=>`R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chart.tooltip} formatter={ftm} />
                <Bar dataKey="receita" fill={C.green} radius={[4,4,0,0]} name="Receitas" maxBarSize={24} />
                <Bar dataKey="despesa" fill={C.red} radius={[4,4,0,0]} name="Despesas" maxBarSize={24} />
                <Legend verticalAlign="bottom" iconType="rect" iconSize={12}
                  formatter={(value:string)=> <span style={{color:value==='Receitas'?'#34D399':value==='Despesas'?'#F87171':chart.legendText,fontSize:'11px',fontWeight:'500'}}>{value}</span>} />
              </BarChart>
            </ResponsiveContainer>
          ):<p className="text-gray-600 text-center py-10 text-xs">Sem dados no período</p>}
        </div>
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
          <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Evolução Mensal</h3>
          {balanceData.length>0?(
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="month" stroke={chart.axis} tick={{fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis stroke={chart.axis} tick={{fontSize:10}} domain={[-100000, 'auto']} ticks={[0,-25000,-50000,-75000,-100000]} tickFormatter={(v:number)=>`R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chart.tooltip} formatter={ftm} />
                <Legend verticalAlign="bottom" iconType="line" iconSize={20}
                  formatter={(value:string)=><span style={{color:value==='Saldo'?'#3B82F6':value==='Receitas'?'#34D399':'#F87171',fontSize:'11px',fontWeight:'500'}}>{value}</span>} />
                <Line type="monotone" dataKey="receita" stroke={C.green} strokeWidth={2} strokeDasharray="0" dot={{r:2,fill:C.green,strokeWidth:0}} activeDot={{r:4,fill:C.green,stroke:'#111827',strokeWidth:2}} name="Receitas" />
                <Line type="monotone" dataKey="_despesa" stroke={C.red} strokeWidth={2} strokeDasharray="0" dot={{r:2,fill:C.red,strokeWidth:0}} activeDot={{r:4,fill:C.red,stroke:'#111827',strokeWidth:2}} name="Despesas" />
                <Line type="monotone" dataKey="_balance" stroke={C.blue} strokeWidth={2.5} strokeDasharray="0" dot={{r:3,fill:C.blue,strokeWidth:0}} activeDot={{r:5,fill:C.blue,stroke:'#111827',strokeWidth:2}} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          ):<p className="text-gray-600 text-center py-10 text-xs">Sem dados no período</p>}
        </div>
      </div>

      <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
          <h2 className="text-white/80 text-xs font-semibold uppercase tracking-wider">Transações</h2>
          <button onClick={openNew}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium transition flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Adicionar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-600 uppercase border-b border-gray-800/30">
                <th className="text-left px-4 py-2.5 font-semibold">Data</th>
                <th className="text-left px-4 py-2.5 font-semibold">Descrição</th>
                <th className="text-left px-4 py-2.5 font-semibold">Categoria</th>
                <th className="text-left px-4 py-2.5 font-semibold">Tipo</th>
                <th className="text-right px-4 py-2.5 font-semibold">Valor</th>
                <th className="text-center px-4 py-2.5 font-semibold w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {[...flt].reverse().map((tx:any)=>(
                <tr key={tx.id} className="border-b border-gray-800/20 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-2.5 text-white">{tx.description}</td>
                  <td className="px-4 py-2.5 text-gray-500">{tx.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      (tx.type||'').toLowerCase()==='receita' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {(tx.type||'').toLowerCase()==='receita'?'Receita':'Despesa'}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${
                    (tx.type||'').toLowerCase()==='receita'?'text-emerald-400':'text-red-400'}`}>
                    {fmt(parseFloat(tx.value||'0'))}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-center gap-1">
                      <button onClick={()=>openEdit(tx)}
                        className="text-gray-600 hover:text-gray-300 p-1 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={()=>{if(confirm('Excluir?'))delTx.mutate(tx.id);}}
                        className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {flt.length===0&&(
                <tr><td colSpan={6} className="text-center text-gray-600 py-8 text-xs">Nenhuma transação</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={openNew}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 md:hidden">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
      </button>

      {showForm&&(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowForm(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800/50 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editing?'Editar':'Nova'} Transação</h2>
            <form onSubmit={e=>{
              e.preventDefault();
              if(month && form.date.slice(5,7)!==month){
                setFormError(`O lançamento deve ser salvo no mês selecionado (${MONTHS[parseInt(month)-1]}). Altere a data ou selecione "Todos".`);
                return;
              }
              setFormError('');
              saveTx.mutate({...form,type:(form.type||'receita').toLowerCase(),id:editing?.id||'new'});
            }} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Data {month&&<span className="text-emerald-400/70">· travada em {MONTHS[parseInt(month)-1]}</span>}</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                  className={`w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition ${month?'opacity-70':''}`} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Tipo</label>
                <div className="flex gap-2">
                  {TYPES.map(t=>(
                    <button key={t} type="button" onClick={()=>setForm({...form,type:t})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        (form.type||'').toLowerCase()===t ? (t==='receita'?'bg-emerald-500 text-white':'bg-red-500 text-white') : 'bg-gray-800/60 text-gray-400 hover:text-white'}`}>
                      {t==='receita'?'Receita':'Despesa'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Descrição</label>
                <input type="text" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Categoria</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition">
                  {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Valor (R$)</label>
                <input type="number" step="0.01" min="0" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" required />
              </div>
              {formError&&(
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={()=>setShowForm(false)}
                  className="flex-1 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition">Cancelar</button>
                <button type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
