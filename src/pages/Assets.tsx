import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { getOrgAssets } from '../lib/services';
import type { Asset } from '../lib/types';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  SUBDOMAIN: { label: 'Subdomain', color: 'var(--color-accent)',   bg: 'rgba(6,182,212,0.12)'  },
  DOMAIN:    { label: 'Domain',    color: 'var(--color-primary)',  bg: 'rgba(59,130,246,0.12)' },
  IP:        { label: 'IP',        color: 'var(--color-warning)',  bg: 'rgba(234,179,8,0.12)'  },
};

export default function Assets() {
  const { orgId } = useParams<{ orgId: string }>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!orgId) return;
    getOrgAssets(orgId)
      .then(setAssets)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [orgId]);

  const filtered = search
    ? assets.filter((a) => a.value.toLowerCase().includes(search.toLowerCase()))
    : assets;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Discovered Assets
          </h1>
          {!isLoading && assets.length > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {assets.length} asset{assets.length !== 1 ? 's' : ''} discovered
            </p>
          )}
        </div>
        {assets.length > 5 && (
          <input
            placeholder="Filter assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg focus:outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              width: '220px',
            }}
          />
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        {isLoading ? (
          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No assets discovered yet"
            description="Run a scan on this organization to discover subdomains and IPs."
          />
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid grid-cols-3 px-6 py-3 text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
            >
              <span>Asset</span>
              <span>Type</span>
              <span>Discovered</span>
            </div>

            {filtered.map((asset, i) => {
              const style = TYPE_STYLES[asset.type] ?? TYPE_STYLES.DOMAIN;
              return (
                <div
                  key={asset.id}
                  className="grid grid-cols-3 px-6 py-3.5 items-center transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <span className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                    {asset.value}
                  </span>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full inline-block w-fit"
                    style={{ backgroundColor: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(asset.discoveredAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}

            {search && filtered.length === 0 && (
              <div className="px-6 py-8 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                No assets match "{search}"
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
