'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { t } from '@/locales';
import { cn } from '@/lib/utils';

import type { GuideChapter } from './content';

interface GuideReaderProps {
  readonly chapters: readonly GuideChapter[];
  readonly checklist: readonly string[];
}

/**
 * Public setup guide, read as a single scrollable page with a chapter rail.
 *
 * No auth, no fetch: `chapters`/`checklist` are static data from `content.ts`,
 * so this only needs client interactivity for the scroll spy, the mobile
 * chapter drawer, and jump-to-chapter — everything else could be a server
 * component, but those three need the DOM.
 */
export function GuideReader({ chapters, checklist }: GuideReaderProps) {
  const [activeId, setActiveId] = useState('chapter-1');
  const [progress, setProgress] = useState(0);
  const [railOpen, setRailOpen] = useState(false);
  const sectionRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      setProgress(
        scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0
      );

      let current = sectionRefs.current[0];
      for (const el of sectionRefs.current) {
        if (el && el.getBoundingClientRect().top <= 140) current = el;
      }
      if (current) setActiveId(current.id);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setRailOpen(false);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="bg-border sticky top-0 z-30 h-0.75">
        <div className="bg-primary h-full transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto flex max-w-6xl">
        {/* Chapter rail */}
        <nav
          className={cn(
            'bg-card border-border sticky top-0.75 z-20 h-fit max-h-[calc(100vh-3px)] w-72 shrink-0 overflow-y-auto border-r px-4 py-6',
            'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-[85vw] max-lg:max-w-sm max-lg:transition-transform',
            !railOpen && 'max-lg:-translate-x-full'
          )}
        >
          <Link href="/" className="text-muted-foreground hover:text-foreground mb-6 block text-sm">
            {t.guide.backToHome}
          </Link>
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            {t.guide.navEyebrow}
          </p>
          <ol className="space-y-0.5">
            {chapters.map((chapter, index) => {
              const id = `chapter-${index + 1}`;
              const active = id === activeId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(id)}
                    className={cn(
                      'flex w-full items-baseline gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className="text-primary font-mono text-[11px] tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{chapter.title.replace(/^\d+\.\s*/, '')}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => jumpTo('chapter-checklist')}
                className={cn(
                  'flex w-full items-baseline gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                  activeId === 'chapter-checklist'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-primary font-mono text-[11px]">✓</span>
                <span>{t.guide.checklistNavLabel}</span>
              </button>
            </li>
          </ol>
          <div className="mt-6 border-t pt-4">
            <a href="/guide/setup-guide.pdf" download>
              <Button variant="cta" className="w-full">
                {t.guide.downloadPdf}
              </Button>
            </a>
          </div>
        </nav>

        {railOpen && (
          <button
            type="button"
            aria-label={t.guide.closeChapterList}
            onClick={() => setRailOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* Reading column */}
        <main className="min-w-0 flex-1 px-6 py-10 sm:px-10 lg:px-14">
          <button
            type="button"
            onClick={() => setRailOpen(true)}
            className="text-muted-foreground mb-6 inline-flex items-center gap-1.5 text-sm lg:hidden"
          >
            {t.guide.openChapterList}
          </button>

          <header className="border-border mb-14 border-b pb-10">
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              {t.guide.heroEyebrow}
            </p>
            <h1 className="font-display mt-3 max-w-[16ch] text-4xl font-bold text-balance sm:text-5xl">
              {t.guide.heroTitle}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-[60ch] text-lg">{t.guide.heroLead}</p>
          </header>

          <div className="max-w-[70ch] space-y-24">
            {chapters.map((chapter, index) => (
              <section
                key={chapter.title}
                id={`chapter-${index + 1}`}
                ref={(el) => {
                  if (el) sectionRefs.current[index] = el;
                }}
                className="scroll-mt-6"
              >
                <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                  {t.guide.chapterLabel} {String(index + 1).padStart(2, '0')} {t.guide.chapterOf}{' '}
                  {chapters.length}
                </p>
                <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">
                  {chapter.title}
                </h2>

                <div className="mt-6 space-y-4">
                  {chapter.blocks.map((block, blockIndex) => {
                    const key = `${index}-${blockIndex}`;
                    switch (block.kind) {
                      case 'heading':
                        return (
                          <h3
                            key={key}
                            className="border-border mt-9 border-b pb-2 text-lg font-semibold first:mt-0"
                          >
                            {block.text}
                          </h3>
                        );
                      case 'paragraph':
                        return (
                          <p key={key} className="text-foreground/90 leading-relaxed">
                            {block.text}
                          </p>
                        );
                      case 'note':
                        return (
                          <p
                            key={key}
                            className="bg-muted text-muted-foreground rounded-md px-3 py-2 font-mono text-xs"
                          >
                            {block.text}
                          </p>
                        );
                      case 'list':
                        return (
                          <ul key={key} className="list-disc space-y-1.5 pl-5">
                            {block.items.map((item) => (
                              <li key={item} className="text-foreground/90 leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        );
                      case 'image':
                        return (
                          <figure key={key} className="mt-6!">
                            <div className="border-border bg-muted relative aspect-16/10 w-full overflow-hidden rounded-lg border shadow-sm">
                              <Image
                                src={block.src}
                                alt={block.caption ?? ''}
                                fill
                                className="object-contain"
                                sizes="(min-width: 1024px) 640px, 90vw"
                              />
                            </div>
                            {block.caption && (
                              <figcaption className="text-muted-foreground mt-2 text-sm italic">
                                {block.caption}
                              </figcaption>
                            )}
                          </figure>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </section>
            ))}

            <section id="chapter-checklist" className="scroll-mt-6">
              <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                {t.guide.checklistEyebrow}
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">
                {t.guide.checklistTitle}
              </h2>
              <ul className="mt-6 space-y-2.5">
                {checklist.map((item) => (
                  <li
                    key={item}
                    className="bg-card border-border flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
                  >
                    <span className="border-primary text-primary mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 text-[10px]">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
