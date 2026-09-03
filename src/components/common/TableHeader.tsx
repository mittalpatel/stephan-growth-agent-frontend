type TableHeaderProps = Readonly<{
  title: string;
  action?: React.ReactNode;
}>;

export function TableHeader({ title, action }: TableHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3">
      {/* font-sans pin: at 15px this h2 would otherwise take the global Anton
          heading rule (the small-heading fallback only catches text-xs/sm/base)
          and render squished. */}
      <h2 className="font-sans text-base font-semibold text-muted-foreground">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}
