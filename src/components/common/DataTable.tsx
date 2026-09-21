import { cn } from '@/lib/utils';
import { MotionList, MotionListItem } from '@/components/motion/MotionList';

/**
 * Shared table primitive — the single base every data table in the app renders
 * through. It owns the table *chrome* (card shell, scroll container, the
 * `<table>` element) and the Motion entrance (rows cascade in via
 * `MotionList`/`MotionListItem`, reduced-motion aware). Structural and motion
 * changes are therefore made in **one place** and inherited everywhere.
 *
 * Each table keeps full control of its own `<thead>` and its `<td>` cells —
 * those vary too much (sortable headers, action buttons, badges, responsive
 * columns) to be worth abstracting. The primitive only standardizes the parts
 * that are genuinely identical across every table.
 *
 * For a cluster of near-identical tables, build a config-driven layer *on top of*
 * these primitives rather than re-implementing the chrome in each one.
 *
 * ```tsx
 * <DataTable header={<TableHeader title="…" />} minWidth={640}>
 *   <thead>…</thead>
 *   <DataTableBody>
 *     {rows.map((row) => (
 *       <DataTableRow key={row.id}>…</DataTableRow>
 *     ))}
 *   </DataTableBody>
 * </DataTable>
 * ```
 */

/** Default `<th>` cell classes. Header emphasis comes from the muted colour, not
 *  from weight or uppercase — all-caps headers cost legibility and buy nothing at
 *  this size. Reuse or override. */
export const dataTableTh = 'text-muted-foreground px-4 py-3 text-left text-sm font-medium sm:px-6';

/** Default `<td>` cell padding — rows land around 52px tall: roomy but compact,
 *  matching a dense-dashboard rhythm. Compose with per-cell utilities. */
export const dataTableTd = 'px-4 py-3.5 sm:px-6';

/** Default `<thead> <tr>` classes — a quiet band with a thin rule under it. */
export const dataTableHeadRow = 'bg-muted/50 border-b';

// Bordered and flat rather than a drop shadow. A shadow tuned for a light
// background disappears on a dark one, so the elevation cue has to be the border.
const DEFAULT_SHELL = 'bg-card overflow-hidden rounded-lg border';

const DEFAULT_ROW = 'border-b transition-colors hover:bg-muted/50 last:border-0';

type DataTableProps = Readonly<{
  /** Optional bar above the table (e.g. `<TableHeader title=… />`). */
  header?: React.ReactNode;
  /** Min table width before horizontal scroll kicks in. Number → px. */
  minWidth?: number | string;
  /** Override the outer card shell classes (radius/border/shadow). */
  className?: string;
  /** Override the scroll-container classes. */
  scrollClassName?: string;
  /** Extra classes on the `<table>` element. */
  tableClassName?: string;
  /** `<thead>` + a `<DataTableBody>`. */
  children: React.ReactNode;
}>;

export function DataTable({
  header,
  minWidth,
  className,
  scrollClassName,
  tableClassName,
  children,
}: DataTableProps) {
  const minWidthStyle =
    minWidth === undefined
      ? undefined
      : { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth };

  return (
    <div className={cn(DEFAULT_SHELL, className)}>
      {header}
      <div className={cn('w-full overflow-x-auto overflow-y-hidden', scrollClassName)}>
        <table className={cn('w-full', tableClassName)} style={minWidthStyle}>
          {children}
        </table>
      </div>
    </div>
  );
}

type DataTableBodyProps = Readonly<{
  className?: string;
  children: React.ReactNode;
}>;

/** `<tbody>` with staggered row entrance. Children are `<DataTableRow>`s. */
export function DataTableBody({ className, children }: DataTableBodyProps) {
  return (
    <MotionList as="tbody" className={className}>
      {children}
    </MotionList>
  );
}

type DataTableRowProps = Readonly<{
  className?: string;
  children: React.ReactNode;
  /** Makes the row itself clickable (e.g. opening a detail panel) in
   *  addition to any interactive elements inside its cells. */
  onClick?: () => void;
}>;

/** A `<tr>` that animates in. Pass `key` from the caller's map. */
export function DataTableRow({ className, children, onClick }: DataTableRowProps) {
  return (
    <MotionListItem
      as="tr"
      className={cn(DEFAULT_ROW, onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </MotionListItem>
  );
}
