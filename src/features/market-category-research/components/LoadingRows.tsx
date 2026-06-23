interface Props {
  cols?: number;
  rows?: number;
}

export function LoadingRows({ cols = 5, rows = 5 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="animate-pulse">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-3 py-2.5">
              <div className="h-3.5 rounded bg-slate-100" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function LoadingCard() {
  return (
    <div className="animate-pulse space-y-3 rounded-lg border border-slate-100 bg-white p-4">
      <div className="h-4 w-1/3 rounded bg-slate-100" />
      <div className="h-3 w-2/3 rounded bg-slate-100" />
      <div className="h-3 w-1/2 rounded bg-slate-100" />
    </div>
  );
}
