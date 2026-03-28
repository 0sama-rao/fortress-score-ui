import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RefreshCw } from 'lucide-react';
import { getOrganizations, getOrgScore, triggerScan } from '../lib/services';
import type { Organization, OrgScore } from '../lib/types';
import { getScoreColor, getScoreLabel } from '../lib/types';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [score, setScore] = useState<OrgScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    getOrganizations()
      .then((data) => {
        setOrgs(data);
        if (data.length > 0) setSelectedOrg(data[0]);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedOrg) return;
    setScore(null);
    getOrgScore(selectedOrg.id)
      .then(setScore)
      .catch(() => setScore(null));
  }, [selectedOrg]);

  async function handleScan() {
    if (!selectedOrg) return;
    setIsScanning(true);
    try {
      const scan = await triggerScan(selectedOrg.id);
      navigate(`/scans/${scan.id}`);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-text-secondary mb-4">No organizations yet. Add one to start scanning.</p>
        <Button onClick={() => navigate('/organizations')}>Add Organization</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          {selectedOrg && (
            <p className="text-text-secondary text-sm mt-0.5">{selectedOrg.rootDomain}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {orgs.length > 1 && (
            <select
              value={selectedOrg?.id ?? ''}
              onChange={(e) => setSelectedOrg(orgs.find((o) => o.id === e.target.value) ?? null)}
              className="border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}
          <Button onClick={handleScan} isLoading={isScanning}>
            <Play className="h-4 w-4 mr-1.5" />
            Run New Scan
          </Button>
        </div>
      </div>

      {score ? (
        <>
          {/* Fortress Score */}
          <div className="bg-surface rounded-xl border border-border p-8 flex items-center gap-8">
            <div className="text-center">
              <div
                className="text-7xl font-bold"
                style={{ color: getScoreColor(score.fortressScore) }}
              >
                {score.fortressScore}
              </div>
              <div
                className="text-sm font-semibold mt-1 uppercase tracking-wide"
                style={{ color: getScoreColor(score.fortressScore) }}
              >
                {getScoreLabel(score.fortressScore)}
              </div>
              <div className="text-xs text-text-secondary mt-1">Fortress Score</div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              {[
                { label: 'TLS Security', value: score.tlsScore, weight: '30%' },
                { label: 'HTTP Headers', value: score.headerScore, weight: '30%' },
                { label: 'Network Exposure', value: score.networkScore, weight: '20%' },
                { label: 'Email Security', value: score.emailScore, weight: '20%' },
              ].map(({ label, value, weight }) => (
                <div key={label} className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">{label}</span>
                    <span className="text-xs text-text-secondary">{weight}</span>
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(value) }}
                  >
                    {value}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${value}%`, backgroundColor: getScoreColor(value) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {score.lastScannedAt && (
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Last scanned {new Date(score.lastScannedAt).toLocaleString()}
            </p>
          )}
        </>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">No scan data yet for this organization.</p>
          <Button onClick={handleScan} isLoading={isScanning}>
            <Play className="h-4 w-4 mr-1.5" />
            Run First Scan
          </Button>
        </div>
      )}
    </div>
  );
}
