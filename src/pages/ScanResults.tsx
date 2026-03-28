import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getScan, getScanResults } from '../lib/services';
import type { Scan, ScanResult } from '../lib/types';
import { getScoreColor, getScoreLabel } from '../lib/types';
import Badge from '../components/ui/Badge';

const CATEGORY_LABELS = {
  TLS: 'TLS Security',
  HEADERS: 'HTTP Headers',
  NETWORK: 'Network',
  EMAIL: 'Email Security',
} as const;

function statusVariant(status: string) {
  if (status === 'COMPLETE') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'RUNNING') return 'info';
  return 'default';
}

export default function ScanResults() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchScan() {
      const data = await getScan(id!);
      setScan(data);

      if (data.status === 'COMPLETE' || data.status === 'FAILED') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (data.status === 'COMPLETE') {
          const res = await getScanResults(id!);
          setResults(res);
        }
      }
    }

    fetchScan().catch(console.error);
    intervalRef.current = setInterval(fetchScan, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  const filteredResults = filter === 'ALL'
    ? results
    : results.filter((r) => r.category === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Scan Results</h1>

      {/* Scan status card */}
      {scan && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={statusVariant(scan.status) as 'success' | 'danger' | 'info' | 'default'}>
              {scan.status}
            </Badge>
            {(scan.status === 'PENDING' || scan.status === 'RUNNING') && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                Scanning in progress…
              </div>
            )}
          </div>

          {scan.fortressScore !== null && (
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div
                  className="text-6xl font-bold"
                  style={{ color: getScoreColor(scan.fortressScore) }}
                >
                  {scan.fortressScore}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {getScoreLabel(scan.fortressScore)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {([
                  ['TLS', scan.tlsScore],
                  ['Headers', scan.headerScore],
                  ['Network', scan.networkScore],
                  ['Email', scan.emailScore],
                ] as [string, number | null][]).map(([label, val]) => (
                  val !== null && (
                    <div key={label} className="bg-background rounded-lg px-4 py-3">
                      <div className="text-xs text-text-secondary">{label}</div>
                      <div
                        className="text-xl font-bold mt-0.5"
                        style={{ color: getScoreColor(val) }}
                      >
                        {val}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Findings */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {['ALL', 'TLS', 'HEADERS', 'NETWORK', 'EMAIL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filter === cat
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-secondary hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Result cards */}
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <div key={result.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium text-text">{result.asset.hostname}</span>
                    <Badge variant="info" className="ml-2">{result.asset.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{CATEGORY_LABELS[result.category]}</Badge>
                    <span
                      className="font-bold text-lg"
                      style={{ color: getScoreColor(result.riskScore) }}
                    >
                      {result.riskScore}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {result.signals.map((signal, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className={signal.passed ? 'text-text-secondary' : 'text-text'}>
                        {signal.passed ? '✓' : '✗'} {signal.check}
                      </span>
                      {!signal.passed && signal.riskValue > 0 && (
                        <span className="text-danger font-medium">+{signal.riskValue}</span>
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
