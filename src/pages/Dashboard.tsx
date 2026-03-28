import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RefreshCw, Shield } from 'lucide-react';
import { getOrganizations, triggerScan } from '../lib/services';
import type { Organization } from '../lib/types';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  async function handleScan() {
    if (!selectedOrg) return;
    setIsScanning(true);
    try {
      const scan = await triggerScan(selectedOrg.id);
      toast.info('Scan started — discovering assets…');
      navigate(`/scans/${scan.id}`);
    } catch (err: unknown) {
      // 409 = scan already running — redirect to that scan
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

      {/* Scores not available yet (Phase 2 — no score endpoint yet) */}
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
            { range: '61–80',  label: 'High Risk',  color: '#f97316' },
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
    </div>
  );
}
