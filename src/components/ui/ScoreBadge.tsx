import { getScoreColor, getScoreLabel } from '../../lib/types';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };
const scoreSizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-3xl' };

export default function ScoreBadge({ score, size = 'md', showLabel = true }: ScoreBadgeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`font-bold ${scoreSizes[size]}`} style={{ color }}>
        {score}
      </span>
      {showLabel && (
        <span
          className={`font-medium px-2 py-0.5 rounded-full ${textSizes[size]}`}
          style={{ backgroundColor: `${color}20`, color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* Full score display — used on dashboard hero */
export function ScoreHero({ score }: { score: number }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="text-center">
      <div className="text-7xl font-bold tabular-nums" style={{ color }}>
        {score}
      </div>
      <div
        className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {label}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
        Fortress Score · lower is safer
      </div>
    </div>
  );
}
