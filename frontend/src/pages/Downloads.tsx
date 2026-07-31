import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function openPDF(title: string, sections: { heading: string; rows: string[][]; summary?: [string, string][] }[]) {
  const w = window.open('', '_blank');
  if (!w) return;

  let body = '';
  for (const s of sections) {
    if (s.summary) {
      body += `<div style="display:flex;gap:24px;margin:8px 0 16px;">`;
      for (const [k, v] of s.summary) {
        body += `<div style="background:#f3f4f6;border-radius:8px;padding:10px 16px;flex:1;"><span style="font-size:11px;color:#6b7280;text-transform:uppercase;">${k}</span><br><span style="font-size:18px;font-weight:bold;color:#111;">${v}</span></div>`;
      }
      body += `</div>`;
    }
    if (s.rows.length > 0) {
      body += `<h2 style="font-size:14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin:16px 0 8px;">${s.heading}</h2>`;
      body += `<table style="width:100%;border-collapse:collapse;font-size:12px;">`;
      for (let i = 0; i < s.rows.length; i++) {
        body += `<tr style="${i % 2 ? 'background:#f9fafb;' : ''}">`;
        for (const cell of s.rows[i]) {
          body += `<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${cell}</td>`;
        }
        body += `</tr>`;
      }
      body += `</table>`;
    }
  }

  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #111; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 8px; }
    .logo { font-size: 22px; font-weight: bold; }
    .logo span:first-child { color: #10b981; }
    .logo span:last-child { color: #111; }
    .meta { font-size: 11px; color: #6b7280; text-align: right; }
    h1 { font-size: 18px; font-weight: 600; margin: 16px 0 4px; color: #374151; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 10px; color: #9ca3af; text-align: center; }
    @media print { body { padding: 16px; } .no-print { display: none; } }
  </style></head><body>
  <div class="header">
    <div class="logo"><span>Nelci</span><span>Tech3D</span></div>
    <div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
  </div>
  <h1>${title}</h1>
  ${body}
  <div class="footer">NelciTech3D — Finance Dashboard • Relatório gerado automaticamente</div>
  <div class="no-print" style="text-align:center;margin-top:24px;">
    <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;">Salvar PDF / Imprimir</button>
  </div>
  </body></html>`);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 500);
}

export default function Downloads() {
  const { data } = useQuery({ queryKey: ['data'], queryFn: () => api.getData(), refetchOnWindowFocus: false });

  const all: any[] = data?.transactions || [];
  const invs: any[] = data?.investments || [];
  const suppliers: any[] = data?.suppliers || [];
  const purchases: any[] = data?.purchases || [];
  const sales: any[] = data?.sales || [];

  const REPORTS = [
    {
      title: 'Relatório Dashboard',
      desc: 'Saldo, receitas, despesas e gráficos',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'from-blue-500/10 to-blue-500/5',
    },
    {
      title: 'Extrato de Transações',
      desc: 'Lista completa de receitas e despesas',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'from-emerald-500/10 to-emerald-500/5',
    },
    {
      title: 'Carteira de Investimentos',
      desc: 'Ações, FIIs, cripto e internacionais',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      color: 'from-purple-500/10 to-purple-500/5',
    },
    {
      title: 'Relatório Comercial',
      desc: 'Fornecedores, compras e vendas',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'from-orange-500/10 to-orange-500/5',
    },
  ];

  function genDashboardPDF() {
    const rec = all.filter((t: any) => (t.type || '').toLowerCase() === 'receita').reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);
    const desp = all.filter((t: any) => (t.type || '').toLowerCase() === 'despesa').reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);
    const saldo = rec - desp;
    const byCat: Record<string, number> = {};
    all.forEach((t: any) => { const c = t.category || 'Outro'; byCat[c] = (byCat[c] || 0) + (parseFloat(t.value) || 0); });
    openPDF('Relatório Dashboard', [
      { heading: 'Resumo', rows: [] as string[][], summary: [
        ['Saldo', fmt(saldo)],
        ['Receitas', fmt(rec)],
        ['Despesas', fmt(desp)],
        ['Transações', String(all.length)],
      ] },
      { heading: 'Resumo por Categoria', rows: Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, fmt(v)]) },
    ]);
  }

  function genTransactionsPDF() {
    const sorted = [...all].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    openPDF('Extrato de Transações', [
      { heading: 'Resumo', rows: [] as string[][], summary: [
        ['Total de Transações', String(all.length)],
        ['Receitas', String(all.filter((t: any) => (t.type || '').toLowerCase() === 'receita').length)],
        ['Despesas', String(all.filter((t: any) => (t.type || '').toLowerCase() === 'despesa').length)],
      ] },
      { heading: 'Lista Completa', rows: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'], ...sorted.map((t) => [
        t.date || '—', t.description || '—', t.category || '—',
        (t.type || '').toLowerCase() === 'receita' ? 'Receita' : 'Despesa',
        fmt(parseFloat(t.value) || 0),
      ])] },
    ]);
  }

  function genInvestmentsPDF() {
    const totalInv = invs.reduce((s: number, t: any) => s + (parseFloat(t.avg_price) || 0) * (parseFloat(t.qty) || 0), 0);
    const totalAtual = invs.reduce((s: number, t: any) => s + (parseFloat(t.current_price) || parseFloat(t.avg_price) || 0) * (parseFloat(t.qty) || 0), 0);
    openPDF('Carteira de Investimentos', [
      { heading: 'Resumo', rows: [] as string[][], summary: [
        ['Total Investido', fmt(totalInv)],
        ['Valor Atual', fmt(totalAtual)],
        ['Lucro/Prejuízo', fmt(totalAtual - totalInv)],
        ['Ativos', String(invs.length)],
      ] },
      { heading: 'Carteira', rows: [['Ticker', 'Nome', 'Categoria', 'Qtd', 'Preço Médio', 'Valor Atual', 'Corretora'], ...invs.map((inv) => [
        inv.ticker || '—', inv.name || '—', inv.category || '—',
        String(inv.qty || '—'), fmt(parseFloat(inv.avg_price) || 0),
        fmt((parseFloat(inv.current_price) || parseFloat(inv.avg_price) || 0) * (parseFloat(inv.qty) || 0)),
        inv.broker || '—',
      ])] },
    ]);
  }

  function genComercialPDF() {
    const totComp = purchases.reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);
    const totVend = sales.reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);
    openPDF('Relatório Comercial', [
      { heading: 'Resumo', rows: [] as string[][], summary: [
        ['Fornecedores', String(suppliers.length)],
        ['Compras', fmt(totComp)],
        ['Vendas', fmt(totVend)],
        ['Lucro', fmt(totVend - totComp)],
      ] },
      { heading: 'Fornecedores', rows: [['Nome', 'Contato', 'CNPJ', 'Telefone', 'Email'], ...suppliers.map((s) => [
        s.name || '—', s.contact || '—', s.cnpj || '—', s.phone || '—', s.email || '—',
      ])] },
      { heading: 'Compras', rows: [['Data', 'Descrição', 'Fornecedor', 'Categoria', 'Valor'], ...purchases.map((p) => [
        p.date || '—', p.description || '—', p.supplier || '—', p.category || '—', fmt(parseFloat(p.value) || 0),
      ])] },
      { heading: 'Vendas', rows: [['Data', 'Descrição', 'Categoria', 'Valor'], ...sales.map((s) => [
        s.date || '—', s.description || '—', s.category || '—', fmt(parseFloat(s.value) || 0),
      ])] },
    ]);
  }

  function download(reportIdx: number) {
    if (reportIdx === 0) genDashboardPDF();
    if (reportIdx === 1) genTransactionsPDF();
    if (reportIdx === 2) genInvestmentsPDF();
    if (reportIdx === 3) genComercialPDF();
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Downloads</h1>
        <p className="text-gray-500 text-sm">Baixe seus relatórios e dados em formato PDF.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r, i) => (
          <div key={i} className="relative group bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden hover:border-gray-700/50 transition-all">
            <div className={`absolute inset-0 bg-gradient-to-br ${r.color} pointer-events-none`} />
            <div className="relative p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800/60 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={r.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">{r.title}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{r.desc}</p>
                </div>
              </div>
              <button onClick={() => download(i)}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                </svg>
                Baixar PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-600 text-xs">Os relatórios são gerados com seus dados em tempo real. Abra o PDF e salve ou imprima.</p>
      </div>
    </div>
  );
}
