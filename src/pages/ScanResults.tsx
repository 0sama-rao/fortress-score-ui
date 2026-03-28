import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getScan, getScanResults } from '../lib/services';
import type { Scan, ScanResult } from '../lib/types';
import { getScoreColor, getScoreLabel } from '../lib/types';
import { ScoreHero } from '../components/ui/ScoreBadge';
import { SkeletonCard } from '../components/ui/Skeleton';

const CATEGORY_LABELS: Record<string, string> = {
  TLS:     'TLS Security',
  HEADERS: 'HTTP Headers',
  NETWORK: 'Network',
  EMAIL:   'Email Security',
};

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: 'Queued — starting asset discovery…',
  RUNNING: 'Discovering subdomains and scanning infrastructure…',
  COMPLETE: 'Scan complete',
  FAILED: 'Scan failed',
};

export default function ScanResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchScan() {
      try {
        const data = await getScan(id!);
        setScan(data);

        if (data.status === 'COMPLETE' || data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (data.status === 'COMPLETE') {
            const res = await getScanResults(id!);
            setResults(res);
          }
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }

    fetchScan();
    intervalRef.current = setInterval(fetchScan, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [id]);

  const isLive = scan?.status === 'PENDING' || scan?.status === 'RUNNING';
  const filteredResults = filter === 'ALL' ? results : results.filter((r) => r.category === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
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
          Scan Results
        </h1>
      </div>

      {/* Status card */}
      {!scan ? (
        <SkeletonCard />
      ) : (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {/* Status row */}
          <div className="flex items-center gap-3 mb-6">
            {scan.status === 'COMPLETE' && <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--color-success)' }} />}
            {scan.status === 'FAILED'   && <XCircle className="h-5 w-5" style={{ color: 'var(--color-danger)' }} />}
            {isLive && <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-accent)' }} />}

            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {STATUS_MESSAGES[scan.status]}
              </div>
              <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                <Clock className="h-3 w-3" />
                Started {new Date(scan.startedAt).toLocaleString()}
                {scan.completedAt && ` · Completed ${new Date(scan.completedAt).toLocaleString()}`}
              </div>
            </div>

            {/* Live pulse */}
            {isLive && (
              <div className="ml-auto flex items-center gap-2">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>LIVE</span>
              </div>
            )}
          </div>

          {/* Scores — show when COMPLETE with scores */}
          {scan.status === 'COMPLETE' && scan.fortressScore !== null ? (
            <div className="flex items-center gap-10">
              <ScoreHero score={scan.fortressScore} />

              <div className="flex-1 grid grid-cols-2 gap-3">
                {([
                  ['TLS Security',      scan.tlsScore,     '30%'],
                  ['HTTP Headers',      scan.headersScore,  '30%'],
                  ['Network Exposure',  scan.networkScore, '20%'],
                  ['Email Security',    scan.emailScore,   '20%'],
                ] as [string, number | null, string][]).map(([label, val, weight]) => (
                  <div
                    key={label}
                    className="rounded-lg px-4 py-3"
                    style={{ backgroundColor: 'var(--color-background)' }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{weight}</span>
                    </div>
                    {val !== null ? (
                      <>
                        <div className="text-xl font-bold" style={{ color: getScoreColor(val) }}>{val}</div>
                        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: getScoreColor(val) }} />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>—</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : scan.status === 'COMPLETE' && scan.fortressScore === null ? (
            /* Phase 2: scan complete but no scores yet (scanners not built yet) */
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{ backgroundColor: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--color-accent)' }}
            >
              Asset discovery complete — security scores will appear after Phase 3 scanners are deployed.
              Check the Assets tab to see discovered subdomains.
            </div>
          ) : scan.status === 'FAILED' ? (
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
            >
              Scan failed. This can happen with invalid or unreachable domains. Try again with a real public domain.
            </div>
          ) : null}
        </div>
      )}

      {/* Findings (Phase 3+) */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'TLS', 'HEADERS', 'NETWORK', 'EMAIL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                style={
                  filter === cat
                    ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                    : { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }
                }
              >
                {cat === 'ALL' ? `All (${results.length})` : `${CATEGORY_LABELS[cat]} (${results.filter(r => r.category === cat).length})`}
              </button>
            ))}
          </div>

          {/* Result cards */}
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium font-mono" style={{ color: 'var(--color-text)' }}>
                      {result.assetValue}
                    </span>
                    <span
                      className="ml-2 text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(6,182,212,0.15)', color: 'var(--color-accent)' }}
                    >
                      {CATEGORY_LABELS[result.category]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: getScoreColor(result.riskScore) }}>
                      {result.riskScore}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {getScoreLabel(result.riskScore)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {result.signals.map((signal, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                      <span style={{ color: signal.passed ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}>
                        <span className="mr-1.5" style={{ color: signal.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {signal.passed ? '✓' : '✗'}
                        </span>
                        {signal.check}
                      </span>
                      {!signal.passed && signal.riskValue > 0 && (
                        <span className="font-medium" style={{ color: 'var(--color-danger)' }}>+{signal.riskValue}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
