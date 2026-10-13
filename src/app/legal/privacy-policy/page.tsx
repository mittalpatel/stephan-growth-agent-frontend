import type { Metadata } from 'next';
import { t } from '@/locales';
import { LegalDocument } from '../components/LegalDocument';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.legal.privacyPolicy.title };
}

export default function PrivacyPolicyPage() {
  const { title, subtitle, sections } = t.legal.privacyPolicy;
  return <LegalDocument title={title} subtitle={subtitle} sections={sections} />;
}
