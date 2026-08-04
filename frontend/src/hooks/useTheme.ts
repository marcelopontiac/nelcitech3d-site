import { useState, useEffect } from 'react';

export function useTheme() {
  const [isLight, setIsLight] = useState(() => {
    return document.documentElement.classList.contains('light');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chart = isLight ? {
    grid: '#e2e8f0',
    axis: '#94a3b8',
    tick: '#64748b',
    tooltip: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    legendText: '#475569',
  } : {
    grid: '#1f2937',
    axis: '#4b5563',
    tick: '#4b5563',
    tooltip: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#fff', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
    legendText: '#9CA3AF',
  };

  return { isLight, chart };
}
