'use client';

import Link from 'next/link';
import { ChevronDown, CircleHelp, Lightbulb } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { t } from '@/locales';

/** The guide chapter that walks through the Knowledge tab. */
const KNOWLEDGE_GUIDE_HREF = '/guide#chapter-4';

const copy = t.knowledge.tips;

type Props = Readonly<{ defaultOpen?: boolean }>;

/**
 * What a first-time user can add, with concrete examples and a few best
 * practices. Client testing (06 Oct 2026) asked for exactly this: a newcomer
 * did not know which files or content were worth adding, and wanted examples
 * such as an FAQ. Open by default while the org has no sources, collapsed
 * once it does so it stops taking space from the list.
 */
export function KnowledgeTipsPanel({ defaultOpen = false }: Props) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="bg-card rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold">
        <span className="inline-flex items-center gap-2">
          <Lightbulb className="text-muted-foreground size-4" aria-hidden />
          {copy.title}
        </span>
        <ChevronDown
          className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-5 px-4 pb-4 text-sm md:grid-cols-3">
        {[
          { title: copy.whatTitle, items: copy.what },
          { title: copy.examplesTitle, items: copy.examples },
          { title: copy.practicesTitle, items: copy.practices },
        ].map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="font-medium">{group.title}</p>
            <ul className="text-muted-foreground list-disc space-y-1.5 pl-5">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <Link
          href={KNOWLEDGE_GUIDE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-strong inline-flex items-center gap-1.5 font-semibold hover:underline md:col-span-3"
        >
          <CircleHelp className="size-4" aria-hidden />
          {copy.guideLink}
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}
