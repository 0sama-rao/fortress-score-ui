import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, ExternalLink, AlertTriangle, Wrench, Skull, Globe, Cloud, Bug, Server } from 'lucide-react';
import { getScan, getScanResults } from '../lib/services';
import type { Scan, ScanResult, ScanCategory, ExecutiveSummary, IntelligenceSignals, BusinessImpact } from '../lib/types';
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

const IMPACT_SEVERITY_COLORS: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  MEDIUM:   { color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  LOW:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
};

const STATUS_MESSAGES: Record<string, string> = {
  PENDING:  'Queued — starting asset discovery…',
  RUNNING:  'Discovering subdomains and scanning infrastructure…',
  COMPLETE: 'Scan complete',
  FAILED:   'Scan failed',
};

// Group scan results by asset
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
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [intel, setIntel] = useState<IntelligenceSignals | null>(null);
  const [impacts, setImpacts] = useState<BusinessImpact[]>([]);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [expandedIntelSection, setExpandedIntelSection] = useState<string | null>('subdomainTakeover');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchScan() {
      try {
        const data = await getScan(id!);
        setScan(data);

        // Fetch results for COMPLETE, and also try for RUNNING (partial results)
        if (data.status === 'COMPLETE' || data.status === 'RUNNING') {
          try {
            const resp = await getScanResults(id!);
            setResults(resp.results);
            if (resp.executiveSummary) setSummary(resp.executiveSummary);
            if (resp.intelligenceData) setIntel(resp.intelligenceData);
            if (resp.businessImpactData) setImpacts(resp.businessImpactData);

            // Auto-expand first asset
            if (resp.results.length > 0) {
              setExpandedAsset((prev) => prev ?? resp.results[0].assetValue);
            }
          } catch {
            // Results not ready yet — that's fine for RUNNING
          }
        }

        if (data.status === 'COMPLETE' || data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }

    fetchScan();
    intervalRef.current = setInterval(fetchScan, 5000);
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

      {/* Partial results banner */}
      {isLive && results.length > 0 && (
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-3"
          style={{ backgroundColor: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}
        >
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm" style={{ color: 'var(--color-accent)' }}>
            Scan in progress — partial results shown below. Page updates automatically.
          </span>
        </div>
      )}

      {/* Executive Summary */}
      {summary && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {/* Posture badge header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Executive Summary
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {summary.company} — {summary.domain}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                backgroundColor: `${getScoreColor(summary.fortressScore)}20`,
                color: getScoreColor(summary.fortressScore),
              }}
            >
              {summary.posture}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: 'var(--color-border)' }}>
            {/* Key Issues */}
            <div className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4" style={{ color: '#f97316' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Key Issues
                </span>
              </div>
              <ul className="space-y-2">
                {summary.keyIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: '#f97316' }} />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Fixes */}
            <div className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4" style={{ color: '#22c55e' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Recommended Fixes
                </span>
              </div>
              <ol className="space-y-2">
                {summary.recommendedFixes.map((fix, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span
                      className="mt-0.5 shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                    >
                      {i + 1}
                    </span>
                    {fix}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Business Impact */}
      {impacts.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: '#f97316' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Business Impact Analysis
              </h2>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {impacts.filter(i => i.severity === 'CRITICAL').length} critical
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {impacts.map((imp, i) => {
              const sc = IMPACT_SEVERITY_COLORS[imp.severity] ?? IMPACT_SEVERITY_COLORS.MEDIUM;
              return (
                <div
                  key={i}
                  className="rounded-lg px-4 py-3"
                  style={{ backgroundColor: sc.bg, border: `1px solid ${sc.color}30` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: sc.bg, color: sc.color }}
                    >
                      {imp.severity}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {imp.category}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    {imp.finding}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {imp.impact}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intelligence Panel */}
      {intel && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Threat Intelligence
              </h2>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto">
            {([
              { key: 'subdomainTakeover', label: 'Takeover Risks',  icon: Globe,  count: intel.subdomainTakeover?.filter(r => r.vulnerable).length ?? 0 },
              { key: 'cloudExposure',     label: 'Cloud Exposure',  icon: Cloud,  count: intel.cloudExposure?.length ?? 0 },
              { key: 'threatIntel',       label: 'Blocklists',      icon: AlertTriangle, count: intel.threatIntel?.filter(r => r.inDnsBlocklist).length ?? 0 },
              { key: 'vulnIntel',         label: 'Known Vulns',     icon: Skull,  count: intel.vulnIntel?.totalKEVMatches ?? 0 },
              { key: 'asnInfo',           label: 'Infrastructure',  icon: Server, count: Object.keys(intel.asnInfo ?? {}).length },
            ] as const).map(({ key, label, icon: Icon, count }) => {
              const active = expandedIntelSection === key;
              return (
                <button
                  key={key}
                  onClick={() => setExpandedIntelSection(active ? null : key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: active ? 'var(--color-surface-2)' : 'transparent',
                    border: `1px solid ${active ? 'var(--color-border)' : 'transparent'}`,
                    color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
                  }}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                  {count > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 rounded-full"
                      style={{
                        backgroundColor: count > 0 ? 'rgba(239,68,68,0.15)' : 'var(--color-surface-2)',
                        color: count > 0 ? '#ef4444' : 'var(--color-text-muted)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section content */}
          <div className="px-4 pb-4">
            {/* Subdomain Takeover */}
            {expandedIntelSection === 'subdomainTakeover' && (
              <div className="space-y-2">
                {(intel.subdomainTakeover ?? []).length === 0 ? (
                  <div className="text-xs py-3" style={{ color: 'var(--color-text-muted)' }}>No subdomain takeover risks detected</div>
                ) : (
                  (intel.subdomainTakeover ?? []).map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{
                        backgroundColor: t.vulnerable ? 'rgba(239,68,68,0.08)' : 'var(--color-background)',
                        border: `1px solid ${t.vulnerable ? 'rgba(239,68,68,0.2)' : 'var(--color-border-subtle)'}`,
                      }}
                    >
                      <div>
                        <div className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>{t.hostname}</div>
                        {t.cname && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            CNAME → {t.cname}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {t.service && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>
                            {t.service}
                          </span>
                        )}
                        {t.vulnerable ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            Vulnerable
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                            Safe
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Cloud Exposure */}
            {expandedIntelSection === 'cloudExposure' && (
              <div className="space-y-2">
                {(intel.cloudExposure ?? []).length === 0 ? (
                  <div className="text-xs py-3" style={{ color: 'var(--color-text-muted)' }}>No exposed cloud buckets detected</div>
                ) : (
                  (intel.cloudExposure ?? []).map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{
                        backgroundColor: b.listable ? 'rgba(239,68,68,0.08)' : b.exposed ? 'rgba(249,115,22,0.08)' : 'var(--color-background)',
                        border: `1px solid ${b.listable ? 'rgba(239,68,68,0.2)' : b.exposed ? 'rgba(249,115,22,0.2)' : 'var(--color-border-subtle)'}`,
                      }}
                    >
                      <div>
                        <div className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>{b.url}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Provider: {b.provider}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.listable ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            Listable
                          </span>
                        ) : b.exposed ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                            Exposed
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Threat Intel / Blocklists */}
            {expandedIntelSection === 'threatIntel' && (
              <div className="space-y-2">
                {(intel.threatIntel ?? []).length === 0 ? (
                  <div className="text-xs py-3" style={{ color: 'var(--color-text-muted)' }}>No blocklist entries found</div>
                ) : (
                  (intel.threatIntel ?? []).map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{
                        backgroundColor: t.inDnsBlocklist ? 'rgba(239,68,68,0.08)' : 'var(--color-background)',
                        border: `1px solid ${t.inDnsBlocklist ? 'rgba(239,68,68,0.2)' : 'var(--color-border-subtle)'}`,
                      }}
                    >
                      <div>
                        <div className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>{t.hostname}</div>
                        {t.ip && (
                          <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>{t.ip}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {t.inDnsBlocklist && t.blocklists.map((bl) => (
                          <span key={bl} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            {bl}
                          </span>
                        ))}
                        {t.reverseRecordMismatch && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                            Reverse DNS Mismatch
                          </span>
                        )}
                        {!t.inDnsBlocklist && !t.reverseRecordMismatch && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                            Clean
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* KEV / Known Vulnerabilities */}
            {expandedIntelSection === 'vulnIntel' && (
              <div className="space-y-2">
                {!intel.vulnIntel || intel.vulnIntel.totalKEVMatches === 0 ? (
                  <div className="text-xs py-3" style={{ color: 'var(--color-text-muted)' }}>
                    No known exploited vulnerabilities matched
                    {intel.vulnIntel?.servicesChecked?.length > 0 && (
                      <span> (checked: {intel.vulnIntel.servicesChecked.join(', ')})</span>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                      >
                        {intel.vulnIntel.totalKEVMatches} CVE{intel.vulnIntel.totalKEVMatches !== 1 ? 's' : ''} matched
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        (CISA Known Exploited Vulnerabilities)
                      </span>
                    </div>
                    {intel.vulnIntel.kevFindings.map((kev) => (
                      <div
                        key={kev.cveId}
                        className="rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: kev.ransomwareUse ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)',
                          border: `1px solid ${kev.ransomwareUse ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono font-bold" style={{ color: '#ef4444' }}>{kev.cveId}</span>
                          {kev.ransomwareUse && (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                              <Skull className="h-3 w-3" /> Ransomware
                            </span>
                          )}
                        </div>
                        <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {kev.vendor} — {kev.product}
                        </div>
                        <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                          {kev.description}
                        </div>
                        <div className="flex gap-3 mt-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          <span>Added: {new Date(kev.dateAdded).toLocaleDateString()}</span>
                          <span>Due: {new Date(kev.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ASN / Infrastructure */}
            {expandedIntelSection === 'asnInfo' && (
              <div>
                {Object.keys(intel.asnInfo ?? {}).length === 0 ? (
                  <div className="text-xs py-3" style={{ color: 'var(--color-text-muted)' }}>No ASN data available</div>
                ) : (
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
                    {/* Table header */}
                    <div
                      className="grid grid-cols-5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border-subtle)' }}
                    >
                      <span>Hostname</span>
                      <span>IP</span>
                      <span>ASN</span>
                      <span>ISP</span>
                      <span>Country</span>
                    </div>
                    {Object.entries(intel.asnInfo ?? {}).map(([hostname, info]) => (
                      <div
                        key={hostname}
                        className="grid grid-cols-5 px-4 py-2 text-xs"
                        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      >
                        <span className="font-mono" style={{ color: 'var(--color-text)' }}>{hostname}</span>
                        <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{info.ip}</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{info.asn}</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{info.isp}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{info.country}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
