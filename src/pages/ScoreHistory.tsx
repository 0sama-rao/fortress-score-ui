import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getScoreHistory } from '../lib/services';
import type { ScoreHistoryEntry } from '../lib/types';
import { getScoreColor } from '../lib/types';

export default function ScoreHistory() {
  const { orgId } = useParams<{ orgId: string }>();
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    getScoreHistory(orgId)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [orgId]);

  const chartData = history.map((h) => ({
    date: new Date(h.scannedAt).toLocaleDateString(),
    score: h.fortressScore,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Score History</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : history.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-text-secondary">No scan history yet.</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="text-sm font-medium text-text-secondary mb-4">Fortress Score Over Time</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-surface rounded-xl border border-border divide-y divide-border">
            <div className="grid grid-cols-3 px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
              <span>Date</span>
              <span>Fortress Score</span>
              <span>Scan ID</span>
            </div>
            {history.map((entry) => (
              <div key={entry.scanId} className="grid grid-cols-3 px-6 py-4 items-center">
                <span className="text-sm text-text">
                  {new Date(entry.scannedAt).toLocaleString()}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: getScoreColor(entry.fortressScore) }}
                >
                  {entry.fortressScore}
                </span>
                <span className="text-xs text-text-secondary font-mono">{entry.scanId}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
