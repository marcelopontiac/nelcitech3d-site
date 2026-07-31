import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../api/auth';

const API_KEY_STORE = 'deepseek_api_key';

const suggestions = [
  'Como está meu saldo financeiro?',
  'Onde posso economizar?',
  'Analise meus investimentos',
  'Dicas para organizar as finanças do mês',
  'Qual a minha rentabilidade?',
];

export default function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Olá! Eu sou o Assistente Financeiro Nelci IA, alimentado por DeepSeek. Posso ajudar com finanças, investimentos e dicas de economia. Como posso ajudar hoje?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState(() => localStorage.getItem(API_KEY_STORE) || '');
  const [keySaved, setKeySaved] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const apiKey = localStorage.getItem(API_KEY_STORE) || '';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function saveKey() {
    const k = keyDraft.trim();
    if (!k.startsWith('sk-')) {
      setError('A chave deve começar com "sk-".');
      return;
    }
    localStorage.setItem(API_KEY_STORE, k);
    setKeySaved(true);
    setError('');
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function send(text: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    if (!apiKey) {
      setError('Configure sua chave da DeepSeek API antes de perguntar.');
      return;
    }
    setError('');
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ api_key: apiKey, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao consultar a IA');
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${e.message || 'Erro de conexão'}` }]);
    }
    setLoading(false);
  }

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Assistente Financeiro</h1>
          <p className="text-gray-500 text-xs">Assistente IA Financeira · Powered by DeepSeek</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-600 bg-gray-900/50 px-2 py-1 rounded-full border border-gray-800/30">
            <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {apiKey ? 'Chave configurada' : 'Sem chave de API'}
          </span>
        </div>
      </div>

      {/* Config API Key */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Configurar API Key
          </h2>
          <button onClick={() => setShowKey(!showKey)} className="text-gray-500 hover:text-gray-300 text-xs transition">
            {showKey ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <p className="text-gray-500 text-xs mb-3">Cole sua chave da DeepSeek API (plataforma.deepseek.com)</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyDraft}
              onChange={e => { setKeyDraft(e.target.value); setError(''); }}
              placeholder="sk-..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button type="button" onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showKey ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <button onClick={saveKey}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shrink-0">
            {keySaved ? 'Salvo ✓' : 'Salvar Chave'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {/* Chat */}
      <div className="flex-1 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">🤖</div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-500/90 text-white rounded-br-md'
                  : 'bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/40'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">🤖</div>
              <div className="bg-gray-800/80 border border-gray-700/40 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-400 flex items-center gap-1.5">
                <span className="animate-pulse">Pensando</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-[11px] text-gray-500 hover:text-emerald-400 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/40 rounded-full px-3 py-1.5 transition">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-gray-800/50 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(''); }}
              placeholder="Pergunte sobre finanças, investimentos, economia..."
              className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition"
            />
            <button onClick={() => send('')} disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-40 shrink-0 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Enviar
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Olá, {user?.name || ''} · O assistente usa seus dados financeiros para responder com contexto.</p>
        </div>
      </div>
    </div>
  );
}
