import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { getScoreHistory } from '../lib/services';
import type { ScoreHistoryEntry } from '../lib/types';
import { getScoreColor } from '../lib/types';
import { useToast } from '../context/ToastContext';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

const SERIES: SeriesConfig[] = [
  { key: 'fortressScore',  label: 'Fortress Score',   color: '#3b82f6' },
  { key: 'tlsScore',       label: 'TLS Security',     color: '#a78bfa' },
  { key: 'headersScore',   label: 'HTTP Headers',     color: '#06b6d4' },
  { key: 'networkScore',   label: 'Network Exposure', color: '#f97316' },
  { key: 'emailScore',     label: 'Email Security',   color: '#22c55e' },
];

// Custom dark-themed tooltip
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 text-xs shadow-xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{entry.name}</span>
          </div>
          <span className="font-bold" style={{ color: entry.color }}>
            {entry.value ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ScoreHistory() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    new Set(['fortressScore'])
  );

  useEffect(() => {
    if (!orgId) return;
    getScoreHistory(orgId)
      .then(setHistory)
      .catch(() => toast.error('Failed to load score history'))
      .finally(() => setIsLoading(false));
  }, [orgId]);

  function toggleSeries(key: string) {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // keep at least one
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const chartData = history.map((h) => ({
    date: new Date(h.scannedAt).toLocaleDateString(),
    fortressScore: h.fortressScore,
    tlsScore: h.tlsScore,
    headersScore: h.headersScore,
    networkScore: h.networkScore,
    emailScore: h.emailScore,
  }));

  // Trend: compare last two entries
  const trend =
    history.length >= 2
      ? (history[history.length - 1].fortressScore ?? 0) -
        (history[history.length - 2].fortressScore ?? 0)
      : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm cursor-pointer transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>
        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
        <h1 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          Score History
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="No score history yet"
          description="Run at least one scan to see your Fortress Score trend over time."
          action={{ label: 'Back to Dashboard', onClick: () => navigate('/') }}
        />
      ) : (
        <>
          {/* Trend indicator */}
          {trend !== null && (
            <div
              className="rounded-xl px-5 py-4 flex items-center gap-3"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              {trend < 0 ? (
                <TrendingDown className="h-5 w-5" style={{ color: '#22c55e' }} />
              ) : trend > 0 ? (
                <TrendingUp className="h-5 w-5" style={{ color: '#ef4444' }} />
              ) : null}
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {trend < 0
                  ? `Score improved by ${Math.abs(trend)} points since last scan`
                  : trend > 0
                    ? `Score increased by ${trend} points since last scan`
                    : 'Score unchanged since last scan'}
              </span>
              {trend !== 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: trend < 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: trend < 0 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {trend > 0 ? '+' : ''}{trend}
                </span>
              )}
            </div>
          )}

          {/* Chart */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Score Over Time
              </h2>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {history.length} scan{history.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Series toggles */}
            <div className="flex flex-wrap gap-2 mb-5">
              {SERIES.map((s) => {
                const active = visibleSeries.has(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSeries(s.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                    style={{
                      backgroundColor: active ? `${s.color}20` : 'var(--color-surface-2)',
                      border: `1px solid ${active ? s.color : 'var(--color-border)'}`,
                      color: active ? s.color : 'var(--color-text-muted)',
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: active ? s.color : 'var(--color-text-muted)' }}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip content={<ChartTooltip />} />
                {SERIES.filter((s) => visibleSeries.has(s.key)).map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={s.key === 'fortressScore' ? 2.5 : 1.5}
                    dot={{ fill: s.color, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* History table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="grid grid-cols-6 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}
            >
              <span>Date</span>
              <span>Fortress</span>
              <span>TLS</span>
              <span>Headers</span>
              <span>Network</span>
              <span>Email</span>
            </div>
            {[...history].reverse().map((entry) => (
              <div
                key={entry.scanId}
                className="grid grid-cols-6 px-5 py-3 items-center cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                onClick={() => navigate(`/scans/${entry.scanId}`)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(entry.scannedAt).toLocaleDateString()}
                </span>
                <span className="text-sm font-bold" style={{ color: entry.fortressScore !== null ? getScoreColor(entry.fortressScore) : 'var(--color-text-muted)' }}>
                  {entry.fortressScore ?? '—'}
                </span>
                <span className="text-xs" style={{ color: entry.tlsScore !== null ? getScoreColor(entry.tlsScore) : 'var(--color-text-muted)' }}>
                  {entry.tlsScore ?? '—'}
                </span>
                <span className="text-xs" style={{ color: entry.headersScore !== null ? getScoreColor(entry.headersScore) : 'var(--color-text-muted)' }}>
                  {entry.headersScore ?? '—'}
                </span>
                <span className="text-xs" style={{ color: entry.networkScore !== null ? getScoreColor(entry.networkScore) : 'var(--color-text-muted)' }}>
                  {entry.networkScore ?? '—'}
                </span>
                <span className="text-xs" style={{ color: entry.emailScore !== null ? getScoreColor(entry.emailScore) : 'var(--color-text-muted)' }}>
                  {entry.emailScore ?? '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Score scale reminder */}
          <div className="flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Lower score = stronger security posture
          </div>
        </>
      )}
    </div>
  );
}
