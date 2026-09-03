import Link from 'next/link';
import { t } from '@/locales';

interface LegalSection {
  readonly heading?: string;
  readonly body: readonly string[];
}

interface LegalDocumentProps {
  readonly title: string;
  readonly subtitle: string;
  readonly sections: readonly LegalSection[];
}

export function LegalDocument({ title, subtitle, sections }: LegalDocumentProps) {
  return (
    <main className="bg-muted/40 min-h-screen w-full px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          {t.legal.backToLogin}
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.heading ?? index}>
              {section.heading && <h2 className="mb-2 text-lg font-semibold">{section.heading}</h2>}
              <div className="space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-muted-foreground text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
