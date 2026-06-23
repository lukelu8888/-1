import { cn } from '../../../components/ui/utils';

interface Props {
  label: string;
  colorClass: string;
  className?: string;
}

export function StatusBadge({ label, colorClass, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
