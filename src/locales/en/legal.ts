/**
 * Legal page copy.
 *
 * **Placeholder text. Replace it before you ship.**
 *
 * The pages, routing, and layout are real and working — only the words are
 * stand-ins. They are written as an outline of the sections most jurisdictions
 * expect, so the structure is useful even though the content is not.
 *
 * Do not paste another company's policy here and edit the names. A privacy
 * notice is a legal commitment about what *your* application does with data,
 * and one adapted from elsewhere describes someone else's systems. Have counsel
 * review the final text.
 *
 * If your product genuinely has no such pages, delete `src/app/legal/` and the
 * two links at the bottom of `LoginForm.tsx`.
 */
export const legal = {
  privacyLinkLabel: 'Privacy Notice',
  termsLinkLabel: 'Terms and Conditions',
  backToLogin: 'Back to sign in',

  privacyPolicy: {
    title: 'Privacy Notice',
    subtitle: 'Placeholder text. Replace before launch.',
    sections: [
      {
        body: [
          'This is placeholder text shipped with the application template. It is not a privacy notice and has no legal effect. Replace every section on this page with content describing what your organization actually collects, why, and how long it keeps it.',
        ],
      },
      {
        heading: '(1) Who is responsible',
        body: [
          'Name the legal entity that controls the data, its registered address, and a contact route for privacy questions.',
        ],
      },
      {
        heading: '(2) What data is collected',
        body: [
          'List the categories of personal data the application actually handles. Describe what is collected, not what might one day be collected: an over-broad notice is as much of a problem as a missing one.',
        ],
      },
      {
        heading: '(3) Why it is collected',
        body: [
          'State a purpose for each category, and the lawful basis if your jurisdiction requires one.',
        ],
      },
      {
        heading: '(4) Who it is shared with',
        body: [
          'Name the processors and sub-processors that receive the data: hosting, email delivery, error monitoring, analytics. Anything the application transmits data to belongs here.',
        ],
      },
      {
        heading: '(5) How long it is kept',
        body: [
          'Give a retention period per category and say what happens at the end of it. Note that soft-deleted records are retained rather than erased; see the backend documentation.',
        ],
      },
      {
        heading: '(6) Rights and how to exercise them',
        body: [
          'Describe the rights available to users in your jurisdiction, such as access, correction, deletion, portability, and objection, and give the concrete route for exercising each.',
        ],
      },
      {
        heading: '(7) Changes to this notice',
        body: ['State how users are told when this notice changes, and when it last did.'],
      },
    ],
  },

  termsAndConditions: {
    title: 'Terms and Conditions of Use',
    subtitle: 'Placeholder text. Replace before launch.',
    sections: [
      {
        body: [
          'This is placeholder text shipped with the application template. It is not a set of terms and has no legal effect. Replace every section below.',
        ],
      },
      {
        heading: '(1) Acceptance',
        body: ['Explain what using the service signifies, and who may agree on whose behalf.'],
      },
      {
        heading: '(2) Accounts',
        body: [
          'Cover eligibility, accuracy of registration details, credential responsibility, and the fact that accounts here are issued by invitation rather than open registration.',
        ],
      },
      {
        heading: '(3) Acceptable use',
        body: [
          'Set out what users may not do: interfering with the service, circumventing access controls, scraping, or reaching data belonging to others.',
        ],
      },
      {
        heading: '(4) Intellectual property',
        body: ['State what the provider owns, what the user owns, and what each may do with it.'],
      },
      {
        heading: '(5) Availability and support',
        body: [
          'Describe any uptime commitment and the support channels, or say plainly that none is promised.',
        ],
      },
      {
        heading: '(6) Liability',
        body: [
          'State the limitations and exclusions that apply, subject to whatever your jurisdiction does not permit excluding.',
        ],
      },
      {
        heading: '(7) Termination',
        body: [
          'Explain how either party ends the relationship and what happens to data afterwards.',
        ],
      },
      {
        heading: '(8) Governing law',
        body: ['Name the governing law and the forum for disputes.'],
      },
    ],
  },
} as const;
