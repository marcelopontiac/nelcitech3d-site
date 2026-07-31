const UPDATES = [
  {
    version: 'v3.1.2',
    date: '01/07/2026',
    status: 'Instalado',
    changes: [
      'Correções de segurança e melhorias na aba de investimentos internacionais.',
      'Correção de vulnerabilidade de sessão',
      'Correção de cálculo de FIIs',
      'Novos filtros por data na aba Comercial',
    ],
  },
  {
    version: 'v3.1.1',
    date: '15/06/2026',
    status: 'Instalado',
    changes: [
      'Sincronização automática de cotações B3 via yfinance ao fim do pregão.',
      'Cálculo de CDB e Renda Fixa por CDI (API Banco Central).',
      'Gráfico de evolução individual por investimento.',
      'Reorganização de categorias de investimento.',
    ],
  },
  {
    version: 'v3.1.0',
    date: '01/06/2026',
    status: 'Instalado',
    changes: [
      'Novo dashboard com telemetria em tempo real.',
      'Gráficos de evolução mensal com linhas de receita, despesa e saldo.',
      'Página de Administração com gerenciamento de usuários.',
      'Sistema de configurações com tema e perfil.',
    ],
  },
  {
    version: 'v3.0.0',
    date: '15/05/2026',
    status: 'Instalado',
    changes: [
      'Reescrita completa do backend em FastAPI + SQLAlchemy.',
      'Frontend redesenhado em React + TypeScript + TailwindCSS.',
      'Autenticação JWT com bcrypt.',
      'Integração com Cloudflare Tunnel para acesso remoto.',
    ],
  },
];

export default function Updates() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-white">Atualizações</h1>
        <span className="text-[10px] text-gray-500 bg-gray-900/50 px-2 py-1 rounded-full border border-gray-800/30">
          Versão atual: {UPDATES[0].version}
        </span>
      </div>

      <div className="space-y-3">
        {UPDATES.map((u, i) => (
          <div key={i} className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/30">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-sm">{u.version}</span>
                <span className="text-gray-500 text-xs">Lançado em {u.date}</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                {u.status}
              </span>
            </div>
            <div className="px-4 py-3">
              <ul className="space-y-2">
                {u.changes.map((c, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
