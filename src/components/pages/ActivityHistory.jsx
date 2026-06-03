import React, { useState, useEffect } from 'react';

const ACTIVITY_COLORS = {
  'Sitting':    { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400', icon: 'chair' },
  'Standing':   { bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-400',  icon: 'accessibility_new' },
  'Walking':    { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', icon: 'directions_walk' },
  'Running':    { bg: 'bg-red-100',   text: 'text-red-700',   dot: 'bg-red-500',   icon: 'directions_run' },
  'Awake':      { bg: 'bg-purple-100',text: 'text-purple-700',dot: 'bg-purple-400',icon: 'light_mode' },
  'Light_Sleep':{ bg: 'bg-indigo-100',text: 'text-indigo-700',dot: 'bg-indigo-400',icon: 'nights_stay' },
  'Deep_Sleep': { bg: 'bg-slate-200', text: 'text-slate-700', dot: 'bg-slate-500',  icon: 'bedtime' },
  'REM_Sleep':  { bg: 'bg-violet-100',text: 'text-violet-700',dot: 'bg-violet-500', icon: 'mode_night' },
};

const DEFAULT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', icon: 'device_unknown' };

const ActivityHistory = ({ cardsVisible }) => {
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setLastFetch(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  // Count per activity for summary
  const activityCounts = history.reduce((acc, r) => {
    acc[r.prediction] = (acc[r.prediction] || 0) + 1;
    return acc;
  }, {});

  const topActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-on-surface tracking-tight font-sans">Activity History</h2>
          <p className="text-base text-on-surface-variant mt-1">Log aktivitas real-time dari sensor wearable</p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs text-on-surface-variant font-medium">
              Diperbarui: {lastFetch}
            </span>
          )}
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-12 gap-6">

        {/* Summary Cards */}
        {topActivities.map(([activity, count], i) => {
          const c = ACTIVITY_COLORS[activity] || DEFAULT_COLOR;
          return (
            <div
              key={activity}
              className={`bento-card col-span-2 md:col-span-3 p-5 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.12)] border-[1.5px] border-white flex flex-col justify-between min-h-[130px] ${cardsVisible ? 'visible' : ''}`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`material-symbols-outlined text-2xl ${c.text}`}>{c.icon}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                  {Math.round((count / history.length) * 100)}%
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-on-surface-variant font-medium mt-0.5">
                  {activity.replace('_', ' ')}
                </div>
              </div>
            </div>
          );
        })}

        {/* Timeline Table */}
        <div className={`bento-card col-span-4 md:col-span-12 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white ${cardsVisible ? 'visible' : ''}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">history</span>
              Log Terkini ({history.length} entri)
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs text-secondary font-semibold">LIVE</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              Memuat data...
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-4xl">inbox</span>
              <p className="text-sm">Belum ada data. Jalankan backend dan simulator.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[420px] pr-1 space-y-2">
              {[...history].reverse().map((record, idx) => {
                const c = ACTIVITY_COLORS[record.prediction] || DEFAULT_COLOR;
                const isActive = !['Awake', 'Light_Sleep', 'Deep_Sleep', 'REM_Sleep'].includes(record.prediction);
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 p-3.5 rounded-2xl bg-surface-low/70 hover:bg-surface-high/50 transition-colors"
                  >
                    {/* Status Dot */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                      {idx === 0 && <div className={`absolute inset-0 rounded-full ${c.dot} animate-ping opacity-50`} />}
                    </div>

                    {/* Activity Icon + Label */}
                    <div className={`flex items-center gap-2 min-w-[160px] px-3 py-1.5 rounded-xl ${c.bg}`}>
                      <span className={`material-symbols-outlined text-[16px] ${c.text}`}>{c.icon}</span>
                      <span className={`text-sm font-semibold ${c.text}`}>
                        {record.prediction.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex-1">
                      <span className="text-xs text-on-surface-variant font-mono">{record.timestamp}</span>
                    </div>

                    {/* LDR Lux */}
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant min-w-[70px]">
                      <span className="material-symbols-outlined text-[14px] text-amber-500">light_mode</span>
                      <span className="font-medium">{record.ldr_value} lux</span>
                    </div>

                    {/* Motion std */}
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant min-w-[80px]">
                      <span className="material-symbols-outlined text-[14px] text-primary">sensors</span>
                      <span className="font-medium">σ {record.ax_std?.toFixed(3) ?? '—'}</span>
                    </div>

                    {/* Sleep/Active badge */}
                    <div className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {isActive ? '⚡ Active' : '😴 Sleep'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ActivityHistory;
