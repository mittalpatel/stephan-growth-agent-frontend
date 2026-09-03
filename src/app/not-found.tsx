import Link from 'next/link';
import { t } from '@/locales';
import { NotFoundBackButton } from './not-found-back-button';

export default function NotFound() {
  return (
    <section
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/404-bg.png')" }}
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-card border px-8 py-14 text-center shadow-sm">
          {/* Decorative blurred blobs */}
          <span className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-info/40 blur-3xl" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-brand/20 blur-3xl" />

          <div className="relative flex flex-col items-center gap-5">
            {/* Error badge */}
            <span className="inline-flex items-center rounded-full bg-muted border px-5 py-1.5 text-xs font-semibold uppercase text-muted-foreground shadow-sm">
              {t.errors.error404Label}
            </span>

            {/* Headline */}
            <h1 className="text-4xl font-normal text-foreground md:text-5xl">
              {t.errors.notFound}
            </h1>

            {/* Description */}
            <p className="text-sm text-muted-foreground md:text-base">
              {t.errors.notFoundDescription}
            </p>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <NotFoundBackButton />
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-input bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition hover:border-input hover:text-foreground"
              >
                {t.errors.returnHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
