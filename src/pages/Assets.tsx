import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrgAssets } from '../lib/services';
import type { Asset } from '../lib/types';
import Badge from '../components/ui/Badge';

export default function Assets() {
  const { orgId } = useParams<{ orgId: string }>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    getOrgAssets(orgId)
      .then(setAssets)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [orgId]);

  const typeVariant = (type: string) => {
    if (type === 'SUBDOMAIN') return 'info';
    if (type === 'IP') return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Discovered Assets</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-text-secondary">No assets discovered yet. Run a scan first.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border divide-y divide-border">
          <div className="grid grid-cols-3 px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
            <span>Asset</span>
            <span>Type</span>
            <span>Discovered</span>
          </div>
          {assets.map((asset) => (
            <div key={asset.id} className="grid grid-cols-3 px-6 py-4 items-center">
              <span className="font-medium text-text text-sm">
                {asset.hostname ?? asset.ipAddress}
              </span>
              <Badge variant={typeVariant(asset.type) as 'info' | 'warning' | 'default'}>
                {asset.type}
              </Badge>
              <span className="text-sm text-text-secondary">
                {new Date(asset.discoveredAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
