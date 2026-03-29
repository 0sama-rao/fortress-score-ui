import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RefreshCw, Shield, History, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { getOrganizations, triggerScan, getOrgScans, getOrgScore } from '../lib/services';
import type { Organization, Scan, OrgScore } from '../lib/types';
import { getScoreColor } from '../lib/types';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { ScoreHero } from '../components/ui/ScoreBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [score, setScore] = useState<OrgScore | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoreLoading, setIsScoreLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    getOrganizations()
      .then((data) => {
        setOrgs(data);
        if (data.length > 0) setSelectedOrg(data[0]);
      })
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch score + recent scans when org changes
  useEffect(() => {
    if (!selectedOrg) return;
    setScore(null);
    setRecentScans([]);
    setIsScoreLoading(true);

    const orgId = selectedOrg.id;

    Promise.allSettled([
      getOrgScore(orgId),
      getOrgScans(orgId),
    ]).then(([scoreResult, scansResult]) => {
      if (scoreResult.status === 'fulfilled') setScore(scoreResult.value);
      if (scansResult.status === 'fulfilled') setRecentScans(scansResult.value.slice(0, 5));
      setIsScoreLoading(false);
    });
  }, [selectedOrg]);

  async function handleScan() {
    if (!selectedOrg) return;
    setIsScanning(true);
    try {
      const scan = await triggerScan(selectedOrg.id);
      toast.info('Scan started — discovering assets…');
      navigate(`/scans/${scan.id}`);
    } catch (err: unknown) {
      if (
        err && typeof err === 'object' && 'response' in err &&
        (err as { response: { status: number; data: { scanId?: string } } }).response?.status === 409
      ) {
        const scanId = (err as { response: { data: { scanId?: string } } }).response.data.scanId;
        toast.warning('A scan is already running for this organization');
        if (scanId) navigate(`/scans/${scanId}`);
      } else {
        toast.error('Failed to start scan');
      }
      setIsScanning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No organizations yet"
        description="Add a company domain to start scanning its external attack surface."
        action={{ label: 'Add Organization', onClick: () => navigate('/organizations') }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Dashboard</h1>
          {selectedOrg && (
            <p className="text-sm mt-0.5 font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              {selectedOrg.rootDomain}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {orgs.length > 1 && (
            <select
              value={selectedOrg?.id ?? ''}
              onChange={(e) => setSelectedOrg(orgs.find((o) => o.id === e.target.value) ?? null)}
              className="text-sm px-3 py-2 rounded-lg focus:outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}
          <Button onClick={handleScan} isLoading={isScanning}>
            <Play className="h-4 w-4 mr-1.5" />
            Run Scan
          </Button>
        </div>
      </div>

      {isScoreLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : score && score.fortressScore !== null ? (
        <>
          {/* Fortress Score Hero + Category Breakdown */}
          <div
            className="rounded-xl p-8"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-10">
              {/* Score hero + velocity */}
              <div className="flex flex-col items-center gap-2">
                <ScoreHero score={score.fortressScore} />
                {score.riskVelocity !== null && score.riskVelocity !== undefined && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: score.riskVelocity < 0
                        ? 'rgba(34,197,94,0.12)' : score.riskVelocity > 0
                        ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.12)',
                      color: score.riskVelocity < 0
                        ? '#22c55e' : score.riskVelocity > 0
                        ? '#ef4444' : 'var(--color-text-muted)',
                    }}
                  >
                    {score.riskVelocity < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : score.riskVelocity > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {score.riskVelocity > 0 ? '+' : ''}{score.riskVelocity.toFixed(1)}/day
                  </div>
                )}
              </div>

              {/* 4 category cards */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {([
                  ['TLS Security',     score.breakdown.tls.score,     '30%'],
                  ['HTTP Headers',     score.breakdown.headers.score, '30%'],
                  ['Network Exposure', score.breakdown.network.score, '20%'],
                  ['Email Security',   score.breakdown.email.score,   '20%'],
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

            {/* Last scanned */}
            {score.scannedAt && (
              <p className="text-xs mt-6 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                <RefreshCw className="h-3 w-3" />
                Last scanned {new Date(score.scannedAt).toLocaleString()}
                <span className="mx-1">·</span>
                <button
                  onClick={() => navigate(`/scans/${score.scanId}`)}
                  className="cursor-pointer underline transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                >
                  View full results
                </button>
                <span className="mx-1">·</span>
                <button
                  onClick={() => navigate(`/organizations/${score.organizationId}/history`)}
                  className="cursor-pointer underline transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Score history
                </button>
              </p>
            )}
          </div>

          {/* Score Scale */}
          <div
            className="rounded-xl px-6 py-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { range: '0–20',   label: 'Excellent', color: '#22c55e' },
                { range: '21–40',  label: 'Good',      color: '#14b8a6' },
                { range: '41–60',  label: 'Moderate',  color: '#eab308' },
                { range: '61–80',  label: 'High Risk', color: '#f97316' },
                { range: '81–100', label: 'Critical',  color: '#ef4444' },
              ].map(({ range, label, color }) => (
                <div key={label}>
                  <div className="h-1 rounded-full mb-2" style={{ backgroundColor: color }} />
                  <div className="font-medium" style={{ color }}>{range}</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
              Lower score = stronger security posture
            </p>
          </div>

          {/* Recent Scans */}
          {recentScans.length > 1 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    Recent Scans
                  </span>
                </div>
              </div>
              {recentScans.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-3 cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                  onClick={() => navigate(`/scans/${s.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          s.status === 'COMPLETE' ? 'var(--color-success)' :
                          s.status === 'FAILED' ? 'var(--color-danger)' :
                          'var(--color-accent)',
                      }}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(s.startedAt).toLocaleString()}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                    >
                      {s.status}
                    </span>
                  </div>
                  {s.fortressScore !== null && (
                    <span className="text-sm font-bold" style={{ color: getScoreColor(s.fortressScore) }}>
                      {s.fortressScore}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* No completed scans yet */
        <div
          className="rounded-xl p-8"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Shield className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Run your first scan
            </h2>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Scan {selectedOrg?.rootDomain} to discover its public infrastructure and calculate a Fortress Score.
            </p>
            <Button onClick={handleScan} isLoading={isScanning}>
              <Play className="h-4 w-4 mr-1.5" />
              Run Scan
            </Button>
          </div>

          {/* Score scale reference */}
          <div
            className="mt-8 pt-6 grid grid-cols-5 gap-2 text-center text-xs"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {[
              { range: '0–20',   label: 'Excellent', color: '#22c55e' },
              { range: '21–40',  label: 'Good',      color: '#14b8a6' },
              { range: '41–60',  label: 'Moderate',  color: '#eab308' },
              { range: '61–80',  label: 'High Risk', color: '#f97316' },
              { range: '81–100', label: 'Critical',  color: '#ef4444' },
            ].map(({ range, label, color }) => (
              <div key={label}>
                <div className="h-1 rounded-full mb-2" style={{ backgroundColor: color }} />
                <div className="font-medium" style={{ color }}>{range}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw className="inline h-3 w-3 mr-1" />
            Lower score = stronger security posture
          </p>
        </div>
      )}
    </div>
  );
}
