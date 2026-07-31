import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useState } from 'react';

function Bar({ label, value, max, color, suffix = '%' }: { label: string; value: number; max?: number; color: string; suffix?: string }) {
  const pct = max ? Math.min((value / max) * 100, 100) : Math.min(value, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{value.toFixed(1)}{suffix}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function fmtBytes(b: number) {
  if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
  if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
  if (b >= 1024) return (b / 1024).toFixed(1) + ' KB';
  return b + ' B';
}

export default function MonitoringPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [interval, setInterval_] = useState(5000);
  const { data } = useQuery({
    queryKey: ['system-stats'],
    queryFn: api.getSystemStats,
    refetchInterval: interval,
  } as any) as any;
  const { data: fw } = useQuery({
    queryKey: ['system-firewall'],
    queryFn: () => fetch('/api/system/firewall').then(r => r.json()),
    refetchInterval: 30000,
  } as any) as any;

  const memColor = data?.memory?.percent > 80 ? 'bg-red-500' : data?.memory?.percent > 50 ? 'bg-yellow-500' : 'bg-blue-500';
  const diskColor = data?.disk?.percent > 80 ? 'bg-red-500' : data?.disk?.percent > 50 ? 'bg-yellow-500' : 'bg-purple-500';

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 transform transition-transform overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="sticky top-0 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 z-10 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">Monitoramento</h2>
            <p className="text-gray-500 text-xs">Status do servidor em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={interval} onChange={e => setInterval_(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-emerald-500">
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
          </div>
        </div>

        {!data ? (
          <div className="p-5 text-gray-500 text-sm">Carregando...</div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">CPU</div>
              <div className="text-2xl font-bold text-white mb-1">{data.cpu.percent.toFixed(1)}<span className="text-base text-gray-500">%</span></div>
              <div className="text-gray-500 text-xs mb-3">{data.cpu.cores} cores</div>
              <div className="space-y-1.5">
                {data.cpu.per_core.map((p: number, i: number) => (
                  <Bar key={i} label={`Core ${i + 1}`} value={p} color={p > 80 ? 'bg-red-500' : p > 50 ? 'bg-yellow-500' : 'bg-emerald-500'} />
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">Memória RAM</div>
              <div className="text-2xl font-bold text-white mb-1">{data.memory.percent.toFixed(1)}<span className="text-base text-gray-500">%</span></div>
              <div className="text-gray-500 text-xs mb-3">{fmtBytes(data.memory.used)} / {fmtBytes(data.memory.total)}</div>
              <Bar label="Usado" value={data.memory.percent} color={memColor} />
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">Disco</div>
              <div className="text-2xl font-bold text-white mb-1">{data.disk.percent.toFixed(1)}<span className="text-base text-gray-500">%</span></div>
              <div className="text-gray-500 text-xs mb-3">{fmtBytes(data.disk.used)} / {fmtBytes(data.disk.total)}</div>
              <Bar label="Usado" value={data.disk.percent} color={diskColor} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Uptime</div>
                <div className="text-lg font-bold text-white">{data.uptime}</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">CPU Python</div>
                <div className="text-lg font-bold text-white">{data.python.cpu_percent.toFixed(1)}<span className="text-sm text-gray-500">%</span></div>
                <div className="text-gray-500 text-xs mt-0.5">{fmtBytes(data.python.memory_rss)}</div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Rede</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Recebido</span><span className="text-white font-mono">{fmtBytes(data.network.bytes_recv)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Enviado</span><span className="text-white font-mono">{fmtBytes(data.network.bytes_sent)}</span></div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">Firewall</div>
              {!fw ? (
                <div className="text-gray-500 text-sm">Carregando...</div>
              ) : fw.rules && fw.rules.length > 0 ? (
                <div className="space-y-2">
                  {fw.rules.map((r: any, i: number) => (
                    <div key={i} className="bg-gray-900/50 rounded-lg p-2.5 text-xs font-mono space-y-0.5">
                      <div className="flex gap-2 text-gray-400">
                        <span className="text-orange-400">{r.family}</span>
                        <span>{r.table}</span>
                        <span className="text-blue-400">{r.chain}</span>
                      </div>
                      {r.dest && <div className="text-white"><span className="text-gray-500">Dest:</span> {r.dest}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-500 text-xs mb-1">Nenhuma regra encontrada via nft</div>
                  {fw.config_raw && (
                    <pre className="text-[10px] text-gray-400 bg-gray-900/50 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">{fw.config_raw}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
