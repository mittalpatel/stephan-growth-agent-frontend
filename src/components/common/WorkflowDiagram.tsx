import { formatNumber } from '@/lib/i18n';

type WorkflowDiagramProps = Readonly<{
  /** Already-translated step labels, in order. */
  steps: readonly string[];
  /** Accessible name for the list, e.g. "How it works". */
  label: string;
}>;

/**
 * A numbered left-to-right pipeline, matching
 * `components/common/WorkflowDiagram` in the `ai-agents-platform` reference:
 * a ringed step number over a caption, joined by a dashed connector.
 *
 * The connector is a decorative `span`, not an SVG, so it inherits the border
 * token and needs no colour of its own. It sits between steps rather than
 * inside them, and is `aria-hidden`, so the list reads as an ordered sequence
 * of steps with nothing in between.
 *
 * Scrolls inside itself on a narrow viewport: nine steps never fit on a
 * phone, and letting the page scroll sideways instead breaks every other
 * screen.
 */
export function WorkflowDiagram({ steps, label }: WorkflowDiagramProps) {
  return (
    <ol aria-label={label} className="flex items-start overflow-x-auto py-2">
      {steps.map((step, index) => (
        <li key={step} className="flex shrink-0 items-start">
          <div className="flex w-[132px] flex-col items-center gap-2.5 px-1">
            <span className="border-primary text-primary bg-primary/10 flex size-9 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold">
              {formatNumber(index + 1)}
            </span>
            <span className="text-center text-xs leading-snug font-medium">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <span
              aria-hidden
              className="border-border mt-[18px] block w-10 shrink-0 border-t-2 border-dashed"
            />
          )}
        </li>
      ))}
    </ol>
  );
}
