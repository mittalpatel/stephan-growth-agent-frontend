/**
 * Copy for the public marketing landing page (`/`) only. Every other public
 * page (`/login`, `/signup`, `/legal/*`) has its own namespace — this one
 * exists so a future rewrite of the homepage never touches auth copy by
 * accident.
 */
export const marketing = {
  nav: {
    signIn: 'Sign in',
    getStarted: 'Get started',
  },
  hero: {
    badge: 'AI-powered, built for teams',
    heading: 'Turn your website into a 24/7 sales and support team',
    subheading:
      'Stand up an AI agent that answers from your own content, qualifies leads, and hands off to a human the moment it should, all without writing a line of code.',
    primaryCta: 'Get started free',
    secondaryCta: 'Sign in',
    previewLabel: 'Live preview',
  },
  stats: [
    { value: '4', label: 'Active agents' },
    { value: '128', label: 'Conversations' },
    { value: '64', label: 'Leads captured' },
  ],
  features: {
    heading: 'Everything you need to launch an AI agent',
    subheading: 'One platform for setup, testing, and the embeddable widget that goes live.',
    items: [
      {
        title: 'Agent management',
        description:
          'Configure persona, policy, and confidence thresholds, then publish with a version history and one-click rollback.',
      },
      {
        title: 'Knowledge from your own content',
        description:
          'Crawl your site or upload PDFs. Every answer cites the page it came from, so nothing is invented.',
      },
      {
        title: 'Multilingual by design',
        description:
          'Enable the languages your visitors actually use, each with its own greeting, disclosure, and fallback text.',
      },
      {
        title: 'An embeddable widget',
        description:
          'A single script tag streams a grounded, cited answer on any page, with clear AI disclosure and no lead gating on ordinary questions.',
      },
      {
        title: 'Lead capture with real consent',
        description:
          'Leads are only ever captured from a visitor’s own submission, with the purpose stated and consent recorded.',
      },
      {
        title: 'An inbox for what needs a human',
        description:
          'Escalations are triaged by reason, sorted so anything urgent is impossible to miss, never lost in a generic queue.',
      },
    ],
  },
  steps: {
    heading: 'From knowledge to a live agent in three steps',
    items: [
      {
        title: 'Connect your knowledge',
        description: 'Point it at your website or upload documents. Review what it found before anything goes live.',
      },
      {
        title: 'Set it up and test it',
        description: 'Write the persona and fallback behaviour, then ask it real questions against the draft before anyone else does.',
      },
      {
        title: 'Publish and embed',
        description: 'Copy one script tag onto your site. Roll back to any previous version whenever you need to.',
      },
    ],
  },
  cta: {
    heading: 'Ready to launch your first AI agent?',
    subheading: 'Set it up in minutes. No credit card, no code.',
    button: 'Get started free',
  },
  footer: {
    tagline: 'AI-powered sales and support agent platform.',
  },
} as const;
