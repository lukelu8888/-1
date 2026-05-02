import { cn } from '../../../ui/utils';
import { getRegion } from '../context/regionConfig';
import type { RegionCode } from '../context/types';

const COLORS: Record<RegionCode, string> = {
  NA: 'bg-blue-50 text-blue-700 border-blue-200',
  SA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EA: 'bg-purple-50 text-purple-700 border-purple-200',
};

interface Props {
  region: RegionCode;
  size?: 'sm' | 'xs';
  className?: string;
  showName?: boolean;
}

export function RegionPill({ region, size = 'sm', className, showName = true }: Props) {
  const r = getRegion(region);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 leading-none whitespace-nowrap',
        size === 'sm' ? 'h-5 text-[11px]' : 'h-4 text-[10px]',
        COLORS[region],
        className,
      )}
    >
      <span>{r.flag}</span>
      {showName && <span>{r.code}</span>}
    </span>
  );
}
