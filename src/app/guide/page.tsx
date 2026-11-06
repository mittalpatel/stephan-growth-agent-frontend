import type { Metadata } from 'next';

import { GuideReader } from './GuideReader';
import { guideChapters, guideChecklist } from './content';

export const metadata: Metadata = {
  title: 'Setup Guide',
  description:
    'A step by step walkthrough for setting up your Growth Agents assistant and adding it to your website.',
};

export default function GuidePage() {
  return <GuideReader chapters={guideChapters} checklist={guideChecklist} />;
}
