import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { getScan, getScanResults } from '../lib/services';
import type { Scan, ScanResult, ScanCategory } from '../lib/types';
import { getScoreColor, getScoreLabel } from '../lib/types';
import { parseSignals, getSpecialSignals, getSeverityColor, getSeverityBg } from '../lib/signals';
import { ScoreHero } from '../components/ui/ScoreBadge';
import { SkeletonCard } from '../components/ui/Skeleton';

const CATEGORY_LABELS: Record<ScanCategory, string> = {
  TLS:     'TLS Security',
  HEADERS: 'HTTP Headers',
  NETWORK: 'Network Exposure',
  EMAIL:   'Email Security',
};

const CATEGORY_ORDER: ScanCategory[] = ['TLS', 'HEADERS', 'NETWORK', 'EMAIL'];

const STATUS_MESSAGES: Record<string, string> = {
  PENDING:  'Queued — starting asset discovery…',
  RUNNING:  'Discovering subdomains and scanning infrastructure…',
  COMPLETE: 'Scan complete',
  FAILED:   'Scan failed',
};

// Group results by asset
function groupByAsset(results: ScanResult[]): Map<string, ScanResult[]> {
  const map = new Map<string, ScanResult[]>();
  for (const r of results) {
    const arr = map.get(r.assetValue) ?? [];
    arr.push(r);
    map.set(r.assetValue, arr);
  }
  return map;
}

export default function ScanResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
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
            // Auto-expand first asset
            if (res.length > 0) {
              setExpandedAsset((prev) => prev ?? res[0].assetValue);
            }
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
  const assetGroups = groupByAsset(results);

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
          Scan Results
        </h1>
      </div>

      {/* Status + Score Card */}
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

            {isLive && (
              <div className="ml-auto flex items-center gap-2">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>LIVE</span>
              </div>
            )}

            {/* Link to assets */}
            {scan.status === 'COMPLETE' && scan.organizationId && (
              <Link
                to={`/organizations/${scan.organizationId}/assets`}
                className="ml-auto flex items-center gap-1 text-xs transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                View Assets <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Scores */}
          {scan.status === 'COMPLETE' && scan.fortressScore !== null ? (
            <div className="flex items-center gap-10">
              <ScoreHero score={scan.fortressScore} />

              <div className="flex-1 grid grid-cols-2 gap-3">
                {([
                  ['TLS Security',      scan.tlsScore,      '30%'],
                  ['HTTP Headers',      scan.headersScore,   '30%'],
                  ['Network Exposure',  scan.networkScore,  '20%'],
                  ['Email Security',    scan.emailScore,    '20%'],
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
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{ backgroundColor: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--color-accent)' }}
            >
              Asset discovery complete — security scores will appear after scanners finish processing.
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

      {/* Per-Asset Findings */}
      {assetGroups.size > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Findings by Asset
            </h2>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {assetGroups.size} asset{assetGroups.size !== 1 ? 's' : ''} scanned
            </span>
          </div>

          {[...assetGroups.entries()].map(([assetValue, assetResults]) => {
            const isExpanded = expandedAsset === assetValue;
            // Worst risk score across all categories for this asset
            const worstScore = Math.max(...assetResults.map((r) => r.riskScore));

            return (
              <div
                key={assetValue}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                {/* Asset header — click to expand */}
                <button
                  onClick={() => setExpandedAsset(isExpanded ? null : assetValue)}
                  className="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-colors"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                      : <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    }
                    <span className="text-sm font-mono font-medium">{assetValue}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                      {assetResults.length} categor{assetResults.length !== 1 ? 'ies' : 'y'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>worst:</span>
                    <span className="text-sm font-bold" style={{ color: getScoreColor(worstScore) }}>
                      {worstScore}
                    </span>
                    <span className="text-xs" style={{ color: getScoreColor(worstScore) }}>
                      {getScoreLabel(worstScore)}
                    </span>
                  </div>
                </button>

                {/* Expanded — category cards */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="pt-4" />
                    {CATEGORY_ORDER
                      .filter((cat) => assetResults.some((r) => r.category === cat))
                      .map((cat) => {
                        const result = assetResults.find((r) => r.category === cat)!;
                        const findings = parseSignals(cat, result.signals);
                        const specials = getSpecialSignals(cat, result.signals);
                        const failCount = findings.filter((f) => !f.passed).length;

                        return (
                          <div
                            key={cat}
                            className="rounded-lg overflow-hidden"
                            style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border-subtle)' }}
                          >
                            {/* Category header */}
                            <div className="flex items-center justify-between px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                                  {CATEGORY_LABELS[cat]}
                                </span>
                                {failCount > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}>
                                    {failCount} issue{failCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold" style={{ color: getScoreColor(result.riskScore) }}>
                                  {result.riskScore}
                                </span>
                              </div>
                            </div>

                            {/* Signals */}
                            <div className="px-4 pb-3 space-y-1">
                              {/* Special signals (ports, expiry) */}
                              {specials.map((text, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs py-1 px-2 rounded"
                                  style={{ backgroundColor: 'rgba(6,182,212,0.08)', color: 'var(--color-accent)' }}
                                >
                                  <span>ℹ</span>
                                  <span>{text}</span>
                                </div>
                              ))}

                              {/* Boolean findings */}
                              {findings.map((f) => (
                                <div
                                  key={f.key}
                                  className="flex items-center justify-between py-1 px-2 rounded text-xs"
                                  style={{
                                    backgroundColor: f.passed ? 'transparent' : getSeverityBg(f.severity),
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span style={{ color: f.passed ? 'var(--color-success)' : getSeverityColor(f.severity) }}>
                                      {f.passed ? '✓' : '✗'}
                                    </span>
                                    <span style={{ color: f.passed ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}>
                                      {f.label}
                                    </span>
                                  </div>
                                  {!f.passed && (
                                    <span
                                      className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded"
                                      style={{ color: getSeverityColor(f.severity), backgroundColor: getSeverityBg(f.severity) }}
                                    >
                                      {f.severity}
                                    </span>
                                  )}
                                </div>
                              ))}

                              {findings.length === 0 && specials.length === 0 && (
                                <div className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>
                                  No signals detected
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
