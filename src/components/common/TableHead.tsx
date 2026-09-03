const TH_BASE = 'px-5 py-3 text-left text-[13px] font-extrabold uppercase  text-muted-foreground';

type Col = Readonly<{ label: string; className?: string }>;

type Props = Readonly<{ columns: readonly Col[] }>;

export function TableHead({ columns }: Props) {
  return (
    <thead>
      <tr className="border-y border-input bg-accent/80">
        {columns.map((c) => (
          <th key={c.label} className={c.className ?? TH_BASE}>
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
