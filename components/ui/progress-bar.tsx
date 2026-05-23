import * as React from 'react';

type ProgressColor = 'green' | 'orange' | 'red' | 'default';

const colorMap: Record<ProgressColor, string> = {
  green: 'bg-(--primary)/80',
  orange: 'bg-(--accent)',
  red: 'bg-(--danger)',
  default: 'bg-zinc-700',
};

export function ProgressBar({
  value,
  max = 100,
  color = 'green',
  label,
  className,
  border = true,
}: {
  value: number;
  max?: number;
  color?: ProgressColor;
  label?: string;
  className?: string;
  border?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-zinc-600">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div
        className={
          [
            'h-3 overflow-hidden rounded-full',
            border && 'border-2 border-(--border) shadow-[2px_2px_0_#1a1a1a]',
          ].join(' ')
        }
      >
        <div
          className={['h-full rounded-full transition-all duration-500', colorMap[color]].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
