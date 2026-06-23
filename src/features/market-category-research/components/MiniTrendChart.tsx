interface Props {
  data: { period: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
}

export function MiniTrendChart({ data, width = 80, height = 28, color = '#10b981' }: Props) {
  if (!data || data.length < 2) return <span className="text-xs text-slate-400">—</span>;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
