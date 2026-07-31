import { useAuth } from '../api/auth';

export default function Subscriptions() {
  const { user } = useAuth();
  const isPremium = user?.premium;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Planos NELCi Tech 3D</h1>
        <p className="text-gray-400 text-sm">Escolha o plano ideal para você</p>
        <p className="text-gray-500 text-xs mt-2 max-w-lg mx-auto">
          Assine e tenha acesso completo ao Finance Dashboard com todas as funcionalidades. Pagamento rápido e seguro via PIX.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mensal */}
        <div className="relative bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative p-6 flex-1">
            <h3 className="text-white font-bold text-lg mb-1">Mensal</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-white">R$ 49,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
            </div>
            <p className="text-gray-500 text-xs mb-5">Pagamento via PIX</p>
            <ul className="space-y-2.5 mb-6">
              {[
                'Controle completo de receitas e despesas',
                'Gestão de investimentos',
                'Controle comercial',
                'Relatórios em PDF',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative px-6 pb-6">
            <button
              disabled={isPremium}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-500/20"
            >
              {isPremium ? 'Plano Ativo' : 'Assinar Agora'}
            </button>
          </div>
        </div>

        {/* Anual */}
        <div className="relative bg-gray-900/60 backdrop-blur-sm rounded-2xl border-2 border-emerald-500/30 overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            ECONOMIA DE 2 MESES
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 pointer-events-none" />
          <div className="relative p-6 flex-1">
            <h3 className="text-white font-bold text-lg mb-1">Anual</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-white">R$ 299,90</span>
              <span className="text-gray-500 text-sm">/ano</span>
            </div>
            <p className="text-emerald-400 text-xs font-medium mb-5">R$ 24,99/mês • Economize R$ 298,90</p>
            <ul className="space-y-2.5 mb-6">
              {[
                'Tudo do plano Mensal',
                '12 meses de acesso',
                'Suporte prioritário',
                'Atualizações gratuitas',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative px-6 pb-6">
            <button
              disabled={isPremium}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/30"
            >
              {isPremium ? 'Plano Ativo' : 'Assinar Agora'}
            </button>
          </div>
        </div>
      </div>

      {/* PIX Info */}
      <div className="mt-6 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-gray-400 text-sm font-medium">Pagamento via PIX</span>
        </div>
        <p className="text-gray-500 text-xs">Após o pagamento, sua assinatura é ativada instantaneamente. Cancele quando quiser, sem burocracia.</p>
      </div>
    </div>
  );
}
