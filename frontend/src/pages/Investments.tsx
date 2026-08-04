import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const C = { green:'#34D399', red:'#F87171', blue:'#3B82F6', purple:'#8B5CF6', emerald:'#10B981', orange:'#FB923C', pink:'#EC4899', teal:'#14B8A6' };
const PIE = ['#8B5CF6','#3B82F6','#10B981','#FBBF24','#F87171','#EC4899','#14B8A6','#FB923C','#A78BFA','#6B7280'];
const fn = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fnUS = (v:number)=>v.toLocaleString('en-US',{style:'currency',currency:'USD'});

const GRUPOS = ['Nacional','Internacional'] as const;
const SUBFOLDERS = ['ETFs','ETF Renda Fixa','ETF Cripto','REITs'] as const;
const BROKERS = ['Clear','XP','Inter','Rico','BTG','6C Bank','Nomad','Avenue','CDB','Outro'];

const TABS = [
  { key: 'Nacional', label: '🇧🇷 Nacional' },
  { key: 'Internacional', label: '🌎 Internacional' },
  { key: 'Todas', label: 'Todas' },
  { key: 'ETFs', label: 'ETFs' },
  { key: 'ETF Renda Fixa', label: 'ETF Renda Fixa' },
  { key: 'ETF Cripto', label: 'ETF Cripto' },
  { key: 'REITs', label: 'REITs' },
  { key: 'acoes', label: 'Melhores Ações (B3)' },
  { key: 'fiis', label: 'Melhores FIIs' },
  { key: 'papel', label: 'Fundos de Papel' },
  { key: 'tijolo', label: 'Fundos de Tijolo' },
];
const GROUP_TABS = new Set(['Nacional','Internacional']);
const CAT_TABS = new Set(['ETFs','ETF Renda Fixa','ETF Cripto','REITs']);
const SUBFOLDER_TABS = new Set(['acoes','fiis','papel','tijolo']);

const INTL_FOLDERS = [
  {
    key: 'stocks',
    label: 'Principais Ações (Stocks)',
    assets: [
      { ticker: 'AAPL', name: 'Apple', desc: 'Gigante de tecnologia e eletrônicos de consumo.' },
      { ticker: 'MSFT', name: 'Microsoft', desc: 'Líder em software, nuvem e inteligência artificial.' },
      { ticker: 'NVDA', name: 'NVIDIA', desc: 'Referência mundial em semicondutores e chips para IA.' },
      { ticker: 'AMZN', name: 'Amazon', desc: 'Maior empresa de comércio eletrônico e computação em nuvem.' },
      { ticker: 'GOOGL', name: 'Alphabet', desc: 'Controladora do Google e do YouTube.' },
    ],
  },
  {
    key: 'indices',
    label: 'Principais Índices de Mercado',
    assets: [
      { ticker: 'SPY', name: 'S&P 500', desc: 'Reúne as 500 maiores empresas listadas nas bolsas dos EUA.' },
      { ticker: 'QQQ', name: 'Nasdaq 100', desc: 'Focado nas 100 maiores empresas de tecnologia e inovação.' },
      { ticker: 'DIA', name: 'Dow Jones', desc: 'Índice tradicional com 30 corporações industriais sólidas.' },
    ],
  },
  {
    key: 'etfs',
    label: 'Principais Fundos de Índice (ETFs)',
    assets: [
      { ticker: 'SPY', name: 'SPY / VOO', desc: 'Fundos que replicam o desempenho do índice S&P 500.' },
      { ticker: 'QQQ', name: 'QQQ', desc: 'Fundo que replica o índice Nasdaq 100.' },
    ],
  },
];

const NACIONAL_FOLDERS = [
  {
    key: 'acoes',
    label: 'Melhores Ações (B3)',
    category: 'ETFs',
    assets: [
      { ticker: 'PETR4', name: 'Petrobras', desc: 'Líder absoluta em volume de negociações no mercado e maior pagadora de dividendos corporativos.' },
      { ticker: 'VALE3', name: 'Vale', desc: 'Forte peso no índice Ibovespa e alta liquidez internacional.' },
      { ticker: 'ITUB4', name: 'Itaú Unibanco', desc: 'Maior banco privado do país, com lucros e proventos consistentes.' },
      { ticker: 'BBSE3', name: 'BB Seguridade', desc: 'Altamente procurada por investidores focados em dividendos defensivos.' },
      { ticker: 'ITSA4', name: 'Itaúsa', desc: 'Holding diversificada muito utilizada como estratégia de ganho estável.' },
    ],
  },
  {
    key: 'fiis',
    label: 'Melhores Fundos Imobiliários (FIIs)',
    category: 'REITs',
    assets: [
      { ticker: 'MXRF11', name: 'Maxi Renda', desc: 'O fundo com a maior média de negócios diários e base de cotistas da B3.' },
      { ticker: 'KNCR11', name: 'Kinea Rendimentos', desc: 'Maior patrimônio líquido da bolsa com foco em papéis indexados ao CDI.' },
      { ticker: 'HGLG11', name: 'Patria Logística', desc: 'Referência em tijolo, focado em galpões logísticos de alto padrão.' },
      { ticker: 'XPML11', name: 'XP Malls', desc: 'Líder no setor de varejo, com participação nos principais shoppings do país.' },
      { ticker: 'TRBL11', name: 'Tellus Rio Bravo', desc: 'Destaque recente de valorização expressiva em logística no IFIX.' },
    ],
  },
  {
    key: 'papel',
    label: 'Fundos de Papel (Recebíveis Imobiliários)',
    category: 'REITs',
    assets: [
      { ticker: 'KNCR11', name: 'Kinea Rendimentos Imobiliários', desc: 'Foco em CRI com taxa pós-fixada (CDI).' },
      { ticker: 'KNIP11', name: 'Kinea Índices de Preços', desc: 'Foco em CRI atrelado à inflação (IPCA).' },
      { ticker: 'MXRF11', name: 'Maxi Renda', desc: 'Grande base de cotistas, investe em papéis e outros ativos.' },
    ],
  },
  {
    key: 'tijolo',
    label: 'Fundos de Tijolo (Imóveis Reais)',
    category: 'REITs',
    assets: [
      { ticker: 'HGLG11', name: 'CSHG Logística', desc: 'Foco em galpões logísticos e centros de distribuição.' },
      { ticker: 'XPML11', name: 'XP Malls', desc: 'Foco em participações em shopping centers.' },
      { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária', desc: 'Foco misto em lajes corporativas e galpões.' },
    ],
  },
];

const FII_VS_ACAO = [
  { criterio: 'Volatilidade', acao: 'Geralmente mais alta', fii: 'Geralmente mais baixa' },
  { criterio: 'Frequência de Proventos', acao: 'Trimestral / Semestral', fii: 'Mensal (por lei)' },
  { criterio: 'Imposto sobre Proventos', acao: 'Isento (Dividendos)', fii: 'Isento para Pessoa Física' },
  { criterio: 'Foco Principal', acao: 'Crescimento e Valorização', fii: 'Geração de Renda Passiva' },
];

function ExpandedRow({ inv }: { inv: any }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3mo');
  const { chart } = useTheme();

  useEffect(() => {
    if(!inv.ticker){ setLoading(false); return; }
    setLoading(true);
    api.getStockHistory(inv.ticker, period, inv.grupo || '')
      .then((r: any) => { setHistory(r.data || []); })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [inv.ticker, period]);

  const isIntl = (inv.grupo || 'Nacional') === 'Internacional';
  const f = isIntl ? fnUS : fn;
  const PERIODS = [
    { label: '1D', value: '1d' },
    { label: '5D', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1A', value: '1y' },
  ];

  return (
    <tr className="bg-gray-900/40">
      <td colSpan={12} className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">Evolução do Ativo</span>
            <span className="text-white font-bold text-sm">{inv.ticker}</span>
            <span className="text-gray-500 text-xs">{inv.name || ''}</span>
          </div>
          <div className="flex items-center gap-1">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                  period === p.value ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-gray-800/40 text-gray-500 hover:text-gray-300 border border-transparent'
                }`}>{p.label}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-6 text-gray-500 text-sm">Carregando histórico...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">Sem histórico disponível</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="date" stroke={chart.axis} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
              <YAxis stroke={chart.axis} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => isIntl ? `$${v.toFixed(0)}` : `R$${v.toFixed(0)}`}
                domain={['dataMin', 'dataMax']} />
              <Tooltip contentStyle={chart.tooltip}
                formatter={(v: any) => f(Number(v))} />
              <Line type="monotone" dataKey="close" stroke="#3B82F6" strokeWidth={2} dot={false} name={inv.ticker} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </td>
    </tr>
  );
}

export default function Investments() {
  const qc = useQueryClient();
  const { chart } = useTheme();
  const [tab, setTab] = useState<string>('Nacional');
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category:'ETFs', grupo:'Nacional', ticker:'', name:'', broker:'Clear', operation:'compra', qty:'', avg_price:'', current_price:'', date:'', data_atualizacao:'', pct_cdi:'100' });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string|null>(null);
  const [expandedRow, setExpandedRow] = useState<string|null>(null);
  const [intlFolder, setIntlFolder] = useState<string>('Todas');

  const { data, isLoading } = useQuery({ queryKey:['data'], queryFn:()=>api.getData(), refetchOnWindowFocus:false });

  const save = useMutation({
    mutationFn:(item:any)=>api.saveItem('investments',item),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['data']}); setShowForm(false); setEditing(null); },
  });
  const del = useMutation({
    mutationFn:(id:string)=>api.deleteItem('investments',id),
    onSuccess:()=>qc.invalidateQueries({queryKey:['data']}),
  });

  const all: any[] = data?.investments || [];
  const isIntlTab = tab === 'Internacional';
  const items = all.filter((i:any)=>{
    if(tab==='Todas') return true;
    if(GROUP_TABS.has(tab)) return (i.grupo || 'Nacional')===tab;
    return (i.category||'')===tab;
  });

  const totalInvestido = items.reduce((s:number,t:any)=>s+(parseFloat(t.avg_price)||0)*(parseFloat(t.qty)||0),0);
  const totalAtual = items.reduce((s:number,t:any)=>s+(parseFloat(t.current_price)||parseFloat(t.avg_price)||0)*(parseFloat(t.qty)||0),0);
  const lucro = totalAtual - totalInvestido;
  const lucroPct = totalInvestido>0?(lucro/totalInvestido)*100:0;

  const alocacao = items.reduce((acc:any,inv:any)=>{
    const v = (parseFloat(inv.avg_price)||0)*(parseFloat(inv.qty)||0);
    const c = inv.category||'Outro';
    const e = acc.find((a:any)=>a.name===c);
    if(e) e.value+=v; else acc.push({name:c,value:v});
    return acc;
  },[]);

  const investChart = items.map((inv:any)=>{
    const q = parseFloat(inv.qty)||0;
    const a = parseFloat(inv.avg_price)||0;
    const c = parseFloat(inv.current_price)||a;
    return { name: inv.ticker||inv.name, invested: q*a, current: q*c, ticker: inv.ticker };
  });

  async function refreshAll(){
    setRefreshing(true);
    try{ const r=await api.refreshPrices(); if(r.updated>0){ qc.invalidateQueries({queryKey:['data']}); setLastUpdate(new Date().toLocaleString('pt-BR')); } }catch{}
    setRefreshing(false);
  }

  function openNew(){
    setEditing(null);
    setForm({ category:(CAT_TABS.has(tab)?tab:'ETFs'), grupo:(GROUP_TABS.has(tab)?tab:'Nacional'), ticker:'', name:'', broker:'Clear', operation:'compra', qty:'', avg_price:'', current_price:'', date:new Date().toISOString().slice(0,10), data_atualizacao:new Date().toISOString().slice(0,10), pct_cdi:'100' });
    setShowForm(true);
  }
  function openEdit(inv:any){
    setEditing(inv);
    setForm({
      category:inv.category||'ETFs', grupo:inv.grupo||'Nacional', ticker:inv.ticker||'', name:inv.name||'',
      broker:inv.broker||'Clear', operation:inv.operation||'compra', qty:inv.qty||'', avg_price:inv.avg_price||'',
      current_price:inv.current_price||'', date:inv.date||'', data_atualizacao:inv.data_atualizacao||'', pct_cdi:inv.pct_cdi||'100',
    });
    setShowForm(true);
  }

  function openAsset(asset:any, grupo='Internacional', category='ETFs', broker='Avenue'){
    setEditing(null);
    setForm({ category, grupo, ticker:asset.ticker||'', name:asset.name, broker, operation:'compra', qty:'', avg_price:'', current_price:'', date:new Date().toISOString().slice(0,10), data_atualizacao:new Date().toISOString().slice(0,10), pct_cdi:'100' });
    setShowForm(true);
  }

  if(isLoading) return <div className="text-gray-400 p-8 text-center">Carregando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-white">Investimentos</h1>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-600 bg-gray-900/50 px-2 py-1 rounded-full border border-gray-800/30">
            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Auto após 18h B3</span>
            {lastUpdate&&<span className="text-gray-500">· {lastUpdate}</span>}
          </div>
          <button onClick={refreshAll} disabled={refreshing}
            className="bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 disabled:opacity-50">
            <svg className={`w-3.5 h-3.5 ${refreshing?'animate-spin':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {refreshing?'Atualizando...':'Atualizar'}
          </button>
          <button onClick={openNew}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Novo
          </button>
        </div>
      </div>

      {/* Abas: Nacional / Internacional / Todas / ETFs / ETF Renda Fixa / ETF Cripto / REITs */}
      <div className="flex flex-wrap gap-1 bg-gray-900/60 border border-gray-800/50 rounded-xl p-1 w-fit">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setExpandedRow(null);setIntlFolder('Todas');}}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab===t.key
                ? (SUBFOLDER_TABS.has(t.key)
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : t.key==='Internacional'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30')
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Nacional: todos os ativos B3 */}
      {tab==='Nacional' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            Os principais ativos da B3 reúnem ações e fundos imobiliários, destacando-se PETR4, VALE3 e ITUB4 nas ações, e MXRF11, KNCR11 e HGLG11 nos FIIs.
          </p>

          {NACIONAL_FOLDERS.map(folder=>(
            <div key={folder.key} className="space-y-2">
              <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider">{folder.label}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folder.assets.map(a=>(
                  <div key={a.ticker} className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 hover:border-emerald-500/30 transition group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-emerald-500/15 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-semibold tracking-wide">{a.ticker}</span>
                    </div>
                    <p className="text-white font-bold text-sm">{a.name}</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{a.desc}</p>
                    <button onClick={()=>openAsset(a, 'Nacional', folder.category, 'Clear')}
                      className="mt-3 w-full bg-emerald-600/15 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-medium py-1.5 rounded-lg transition flex items-center justify-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      Investir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 overflow-hidden">
            <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Comparativo: Ações vs FIIs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 uppercase border-b border-gray-800/40">
                    <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Característica</th>
                    <th className="text-left px-3 py-2 font-semibold whitespace-nowrap text-emerald-400">Ações</th>
                    <th className="text-left px-3 py-2 font-semibold whitespace-nowrap text-blue-400">Fundos Imobiliários</th>
                  </tr>
                </thead>
                <tbody>
                  {FII_VS_ACAO.map(r=>(
                    <tr key={r.criterio} className="border-b border-gray-800/20">
                      <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{r.criterio}</td>
                      <td className="px-3 py-2 text-gray-300">{r.acao}</td>
                      <td className="px-3 py-2 text-gray-300">{r.fii}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-folders como abas independentes */}
      {SUBFOLDER_TABS.has(tab) && (
        <div className="space-y-4">
          {(() => {
            const folder = NACIONAL_FOLDERS.find(f => f.key === tab);
            if (!folder) return null;
            return (
              <>
                <h2 className="text-xl md:text-2xl font-bold text-white">{folder.label}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {folder.assets.length} ativos disponíveis para investimento.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {folder.assets.map(a => (
                    <div key={a.ticker} className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 hover:border-emerald-500/30 transition group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-emerald-500/15 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-semibold tracking-wide">{a.ticker}</span>
                      </div>
                      <p className="text-white font-bold text-sm">{a.name}</p>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{a.desc}</p>
                      <button onClick={() => openAsset(a, 'Nacional', folder.category, 'Clear')}
                        className="mt-3 w-full bg-emerald-600/15 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-medium py-1.5 rounded-lg transition flex items-center justify-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                        Investir
                      </button>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Internacional: subpastas com principais ativos americanos */}
      {isIntlTab && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {['Todas', ...INTL_FOLDERS.map(f=>f.key)].map(k=>(
              <button key={k} onClick={()=>{setIntlFolder(k);setExpandedRow(null);}}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  intlFolder===k ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800/40 text-gray-500 hover:text-gray-300 border border-transparent'
                }`}>
                {k==='Todas'?'Todas':INTL_FOLDERS.find(f=>f.key===k)!.label}
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">
            Os principais ativos americanos reúnem grandes empresas e fundos essenciais do mercado global, destacando-se S&P 500, Apple e Microsoft.
          </p>

          {(intlFolder==='Todas'?INTL_FOLDERS:INTL_FOLDERS.filter(f=>f.key===intlFolder)).map(folder=>(
            <div key={folder.key} className="space-y-2">
              <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider">{folder.label}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folder.assets.map(a=>(
                  <div key={a.ticker} className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 hover:border-blue-500/30 transition group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-blue-500/15 text-blue-400 text-[10px] px-2 py-0.5 rounded font-mono font-semibold tracking-wide">{a.ticker}</span>
                    </div>
                    <p className="text-white font-bold text-sm">{a.name}</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{a.desc}</p>
                    <button onClick={()=>openAsset(a)}
                      className="mt-3 w-full bg-blue-600/15 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-medium py-1.5 rounded-lg transition flex items-center justify-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      Investir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Investido', value:totalInvestido, cls:'text-blue-400', icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label:'Valor Atual', value:totalAtual, cls:'text-purple-400', icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label:'Lucro/Prejuízo', value:lucro, cls:lucro>=0?'text-emerald-400':'text-red-400', icon:'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' },
          { label:'Rentabilidade', value:lucroPct, cls:lucroPct>=0?'text-emerald-400':'text-red-400', fmt:(v:number)=>`${v>=0?'+':''}${v.toFixed(1)}%`, icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        ].map((c,i)=>(
          <div key={i} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-br ${c.cls.replace('text-','from-').replace('emerald-400','emerald-500').replace('red-400','red-500').replace('blue-400','blue-500').replace('purple-400','purple-500')} rounded-xl opacity-5 group-hover:opacity-10 transition-opacity`} />
            <div className="relative bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{c.label}</span>
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon}/></svg>
              </div>
              <p className={`text-lg md:text-xl font-bold ${c.cls}`}>{c.fmt?c.fmt(c.value):(isIntlTab?fnUS(c.value):fn(c.value))}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {alocacao.length>0&&(
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
            <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Alocação por Subpasta</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={alocacao} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {alocacao.map((_:any,i:number)=><Cell key={i} fill={PIE[i%PIE.length]}/>)}
                </Pie>
                <Tooltip contentStyle={chart.tooltip} formatter={(v:any)=>isIntlTab?fnUS(Number(v)||0):fn(Number(v)||0)} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                  formatter={(value:string)=><span style={{color:chart.legendText,fontSize:'10px'}}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {investChart.length>0&&(
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
            <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Valor de Compra vs Valor Atual</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={investChart} barCategoryGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis type="category" dataKey="name" stroke={chart.axis} tick={{fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis type="number" stroke={chart.axis} tick={{fontSize:10}} tickFormatter={(v:number)=>isIntlTab?`$${(v/1000).toFixed(0)}k`:`R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chart.tooltip} formatter={(v:any)=>isIntlTab?fnUS(Number(v)||0):fn(Number(v)||0)} />
                <Bar dataKey="invested" fill={C.purple} radius={[4,4,0,0]} name="Valor de Compra" maxBarSize={24} />
                <Bar dataKey="current" fill={C.green} radius={[4,4,0,0]} name="Valor Atual" maxBarSize={24} />
                <Legend verticalAlign="bottom" iconType="rect" iconSize={10}
                  formatter={(value:string)=><span style={{color:chart.legendText,fontSize:'10px'}}>{value}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase border-b border-gray-800/40">
                <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">Nome do Ativo</th>
                <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">Código</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">Qtd</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">Valor de Compra</th>
                <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">Data Compra</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">Valor Atual</th>
                <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">Data Atual.</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">Rentabilidade</th>
                <th className="text-center px-3 py-2.5 font-semibold whitespace-nowrap w-16" colSpan={2}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv:any)=>{
                const q = parseFloat(inv.qty)||0;
                const a = parseFloat(inv.avg_price)||0;
                const c = parseFloat(inv.current_price)||a;
                const invInvestido = q*a, valorAtual = q*c, lucroPrej = valorAtual-invInvestido;
                const rent = invInvestido>0?(lucroPrej/invInvestido)*100:0;
                const isIntl = (inv.grupo||'Nacional')==='Internacional';
                const f = isIntl ? fnUS : fn;
                const isExpanded = expandedRow === inv.id;
                return(
                  <>
                  <tr key={inv.id} className={`border-b border-gray-800/20 hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded?'bg-white/[0.02]':''}`}
                    onClick={()=>setExpandedRow(isExpanded?null:inv.id)}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <svg className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${isExpanded?'rotate-90':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${lucroPrej>=0?'bg-emerald-500':'bg-red-500'}`} />
                        <span className="text-white font-bold">{inv.name||'—'}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${isIntl?'bg-blue-500/15 text-blue-400':'bg-emerald-500/15 text-emerald-400'}`}>{inv.category}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400">{inv.ticker||'—'}</td>
                    <td className="px-3 py-2.5 text-right text-white font-medium">{q}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300">{f(a)}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{inv.date||'—'}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300">{f(c)}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{inv.data_atualizacao||'—'}</td>
                    <td className={`px-3 py-2.5 text-right font-medium whitespace-nowrap ${rent>=0?'text-emerald-400':'text-red-400'}`}>
                      {rent>=0?'+':''}{rent.toFixed(1)}%
                      <span className={`block text-[9px] ${lucroPrej>=0?'text-emerald-500/70':'text-red-500/70'}`}>{lucroPrej>=0?'+':''}{f(lucroPrej)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={(e)=>{e.stopPropagation();openEdit(inv);}}
                        className="text-gray-600 hover:text-gray-300 p-0.5 rounded transition">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e)=>{e.stopPropagation();if(confirm('Excluir?'))del.mutate(inv.id);}}
                          className="text-gray-600 hover:text-red-400 p-0.5 rounded transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && <ExpandedRow inv={inv} />}
                  </>
                );
              })}
              {items.length===0&&(
                <tr><td colSpan={12} className="text-center text-gray-600 py-8 text-sm">Nenhum investimento nesta aba</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm&&(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowForm(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800/50 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editing?'Editar':'Novo'} Investimento</h2>
            <form onSubmit={e=>{e.preventDefault();save.mutate({...form,id:editing?.id||'new',current_price:form.current_price,pct_cdi:form.pct_cdi||'100'});}} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Nome do Ativo</label><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" required placeholder="Ex: iShares Core S&P 500" /></div>
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Código do Ativo</label><input type="text" value={form.ticker} onChange={e=>setForm({...form,ticker:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" placeholder={isIntlTab?'Ex: VOO, QQQM':'Ex: BOVA11, IVVB11'} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Subpasta</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition">
                  {SUBFOLDERS.map(c=><option key={c} value={c}>{c}</option>)}
                </select></div>
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Grupo</label><select value={form.grupo} onChange={e=>setForm({...form,grupo:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition">
                  {GRUPOS.map(g=><option key={g} value={g}>{g}</option>)}
                </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Quantidade</label><input type="number" step="any" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" required /></div>
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Valor de Compra</label><input type="number" step="0.01" value={form.avg_price} onChange={e=>setForm({...form,avg_price:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Data de Compra</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Data Atualização</label><input type="date" value={form.data_atualizacao} onChange={e=>setForm({...form,data_atualizacao:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Valor Atual</label><input type="number" step="0.01" value={form.current_price} onChange={e=>setForm({...form,current_price:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" placeholder="R$ ou US$ por cota" /></div>
                <div><label className="block text-xs text-gray-500 mb-1 font-medium">Corretora</label><select value={form.broker} onChange={e=>setForm({...form,broker:e.target.value})} className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition">
                  {BROKERS.map(b=><option key={b} value={b}>{b}</option>)}
                </select></div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition">Cancelar</button>
                <button type="submit" disabled={save.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/20 disabled:opacity-50">{save.isPending?'Salvando...':'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
