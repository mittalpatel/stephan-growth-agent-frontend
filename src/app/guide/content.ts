/**
 * Content for the public setup guide (`/guide`).
 *
 * Sourced from `YB-Inspire-Setup-Guide.docx` (the doc the founders write and
 * hand to Stephan / customers), converted once and checked in as data rather
 * than re-parsed at build time. Screenshots live in `public/guide/chNN-NN.png`,
 * named by chapter so a re-export lines up predictably.
 *
 * Re-generating this file: re-run the docx -> chapters extraction script noted
 * in `context/app/guide/page.md`, don't hand-edit the block arrays.
 */

export type GuideBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'image'; src: string; caption?: string }
  | { kind: 'list'; items: readonly string[] }
  | { kind: 'note'; text: string };

export interface GuideChapter {
  readonly title: string;
  readonly blocks: readonly GuideBlock[];
}

export const guideChapters: readonly GuideChapter[] = [
  {
    title: '1. Create your account',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Signing up gives you your own workspace with a ready-made website assistant.',
      },
      { kind: 'heading', text: '1.1 Open the website' },
      { kind: 'paragraph', text: 'Go to the Growth Agents home page and click Get started free .' },
      { kind: 'image', src: '/guide/ch01-01.png', caption: 'The Growth Agents home page' },
      { kind: 'heading', text: '1.2 Fill in your details' },
      {
        kind: 'paragraph',
        text: 'Enter your first name, last name, email address and a password (twice), then click Create account .',
      },
      { kind: 'note', text: 'First name: Priya Last name: Shah Email: priya@example.com' },
      { kind: 'image', src: '/guide/ch01-02.png', caption: 'The sign-up form, filled in' },
      { kind: 'heading', text: '1.3 Verify your email' },
      {
        kind: 'paragraph',
        text: 'We email you a 6-digit code. Type it in and click Verify and continue . No email after a minute? Check your spam folder, or click Resend .',
      },
      { kind: 'heading', text: '1.4 Your dashboard' },
      {
        kind: 'paragraph',
        text: 'You are signed in straight away and land on your dashboard. Your organization and your first assistant have already been created for you.',
      },
      {
        kind: 'image',
        src: '/guide/ch01-03.png',
        caption: 'Your dashboard right after signing up',
      },
    ],
  },
  {
    title: '2. Sign out and sign in again',
    blocks: [
      { kind: 'paragraph', text: 'How to get back into your account later.' },
      { kind: 'heading', text: '2.1 Sign out' },
      { kind: 'paragraph', text: 'Click your initials in the top-right corner, then Sign out .' },
      { kind: 'image', src: '/guide/ch02-01.png', caption: 'The profile menu' },
      { kind: 'heading', text: '2.2 Sign in' },
      {
        kind: 'paragraph',
        text: 'On the sign-in page, enter your email and password and click Sign in . You are taken back to your dashboard.',
      },
      { kind: 'image', src: '/guide/ch02-02.png', caption: 'The sign-in page' },
    ],
  },
  {
    title: '3. Open your assistant',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Everything about your assistant lives on one page, split into tabs.',
      },
      { kind: 'heading', text: '3.1 Go to Agents' },
      {
        kind: 'paragraph',
        text: 'Click Agents in the left menu. Your assistant is called Website Sales & Support . Click Open agent .',
      },
      { kind: 'image', src: '/guide/ch03-01.png', caption: 'The Agents page' },
      { kind: 'heading', text: '3.2 The overview' },
      {
        kind: 'paragraph',
        text: 'The bar under the title shows how many of the 5 setup steps are done and what to do next. Click Go to jump to that step, or Show all steps to see the full list. This guide goes through each step in order.',
      },
      {
        kind: 'paragraph',
        text: 'The tabs underneath are: Overview, Conversations, Prospects, Knowledge, Settings, Draft, Publish and Test.',
      },
      { kind: 'image', src: '/guide/ch03-02.png', caption: "Your assistant's overview page" },
    ],
  },
  {
    title: '4. Teach your assistant (Knowledge)',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Your assistant only answers from what you give it here, so it never makes things up.',
      },
      { kind: 'heading', text: '4.1 Open the Knowledge tab' },
      {
        kind: 'paragraph',
        text: 'At first it is empty. There are two ways to add content: Upload PDF and Add website .',
      },
      { kind: 'image', src: '/guide/ch04-01.png', caption: 'The empty Knowledge tab' },
      { kind: 'heading', text: '4.2 Add your website' },
      {
        kind: 'list',
        items: [
          'Click Add website . Type your website address, for example https://www.example.com .',
          'Choose how to read it. Read the whole website (recommended) reads every page found. Let me choose the pages finds the pages first so you can pick.',
          'Click Start . You can close the window: a bar at the top of the screen shows the progress.',
          'A website you already added (with or without www, http or https) is not added twice: you are told it is already there and can open it.',
        ],
      },
      { kind: 'image', src: '/guide/ch04-02.png', caption: 'Adding a website' },
      { kind: 'heading', text: '4.3 Choose the pages' },
      {
        kind: 'paragraph',
        text: 'If you chose Let me choose the pages, you see the pages that were found, all ticked. Untick anything the assistant should not learn from, then click Read N pages (the button shows how many are ticked). When it finishes you see Website added . Click Done .',
      },
      {
        kind: 'paragraph',
        text: 'You can close this window while it is working; it carries on in the background.',
      },
      { kind: 'image', src: '/guide/ch04-03.png', caption: 'Choosing which pages to include' },
      { kind: 'image', src: '/guide/ch04-04.png', caption: 'The website has been added' },
      { kind: 'heading', text: '4.4 Upload a PDF' },
      {
        kind: 'paragraph',
        text: 'Click Upload PDF , drag your file in (or click to browse), then click Upload .',
      },
      { kind: 'image', src: '/guide/ch04-05.png', caption: 'A PDF ready to upload' },
      { kind: 'heading', text: '4.5 Wait until everything is Ready' },
      {
        kind: 'paragraph',
        text: 'After a short while both items show Ready and the health score goes up. Your assistant can now answer from both.',
      },
      {
        kind: 'paragraph',
        text: 'The index is rebuilt for you whenever your knowledge changes. If you click Build index when nothing has changed, you are told the index is already up to date and no new version is added.',
      },
      { kind: 'image', src: '/guide/ch04-06.png', caption: 'Both sources are ready' },
    ],
  },
  {
    title: '5. Tell your assistant how to behave (Draft)',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Changes here stay private until you make them live on the Publish tab. The chat bubble in the corner of the screen previews your changes as you type.',
      },
      { kind: 'heading', text: '5.1 Instructions and name' },
      {
        kind: 'paragraph',
        text: 'In Instructions , describe in plain words how the assistant should talk and what it should never do. In Bot name , enter the name visitors will see.',
      },
      {
        kind: 'note',
        text: "Bot name: Acme Assistant Instructions: You are Acme's website assistant. Answer questions about the quotes and authors on our website using only the provided knowledge. You can also answer questions about the bedtime story 'The Little Star and the Sleepy Moon'. Be friendly and concise. If a visitor shows buying interest, offer to collect their contact details. Never invent prices or commitments.",
      },
      { kind: 'image', src: '/guide/ch05-01.png', caption: 'Instructions and bot name' },
      {
        kind: 'paragraph',
        text: 'The notice telling visitors they are chatting with an AI is always on. You can change its wording but not turn it off.',
      },
      { kind: 'heading', text: '5.2 Messages visitors see' },
      {
        kind: 'paragraph',
        text: 'The Greeting is the first thing visitors read. The Fallback message is shown when the assistant is not sure of an answer. Both, plus the AI notice, must be filled in before you can go live.',
      },
      {
        kind: 'note',
        text: "Greeting: Hi! I'm the Acme Assistant. Ask me about our quotes and authors, or about the story of the Little Star.",
      },
      { kind: 'image', src: '/guide/ch05-02.png', caption: 'The messages section' },
      { kind: 'heading', text: '5.3 Passing the chat to a person (Handoff)' },
      {
        kind: 'paragraph',
        text: 'Open Handoff . Keep Allow handoff to a human switched on. Click Add and type a phrase. When a visitor writes it, the chat is passed to your team straight away.',
      },
      { kind: 'note', text: 'Phrase: speak to a human' },
      { kind: 'image', src: '/guide/ch05-03.png', caption: 'Handoff settings' },
      { kind: 'heading', text: '5.4 Collecting contact details (Leads)' },
      {
        kind: 'paragraph',
        text: 'Open Lead qualification and keep Allow lead capture switched on. Then fill in:',
      },
      {
        kind: 'list',
        items: [
          'Trigger phrases: words that always bring up the contact form. We used pricing and quote . Required to qualify: what a contact must include to count as a good lead. We ticked Name and Phone. Required on the form: what visitors must fill in. We ticked Name. Email is always asked for. Scoring: points for each detail given. We used Name 30, Phone 40, Interest note 30. Qualified at / Partial at: we used 70% and 40%.',
        ],
      },
      {
        kind: 'paragraph',
        text: 'With these settings, a visitor who gives their name, phone and what they are interested in counts as Qualified .',
      },
      { kind: 'image', src: '/guide/ch05-04.png', caption: 'Trigger phrases and required fields' },
      { kind: 'image', src: '/guide/ch05-05.png', caption: 'Scoring' },
      { kind: 'heading', text: '5.5 Save' },
      {
        kind: 'paragraph',
        text: 'Click Save draft at the bottom. You see Draft saved . Visitors do not see these changes yet.',
      },
      { kind: 'image', src: '/guide/ch05-06.png', caption: 'Draft saved' },
    ],
  },
  {
    title: '6. Try it out (Test)',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Ask the questions your visitors would. Nothing here is shown to visitors.',
      },
      {
        kind: 'paragraph',
        text: 'Open the Test tab, type a question and press Enter . Each answer shows Answered when your content had the answer, and how many sources it used.',
      },
      { kind: 'paragraph', text: 'We tried three questions:' },
      {
        kind: 'list',
        items: [
          '"Which quotes by Albert Einstein are on your website?" was answered from the website. "In the story, who helps the little star fall asleep?" was answered from the PDF. "Can I get pricing for a custom chatbot?" did not make up a price: it showed No sources used and offered to collect their contact details so your team can follow up.',
        ],
      },
      { kind: 'image', src: '/guide/ch06-01.png', caption: 'Answer from the website' },
      { kind: 'image', src: '/guide/ch06-02.png', caption: 'Answer from the PDF' },
      { kind: 'image', src: '/guide/ch06-03.png', caption: 'A pricing question' },
    ],
  },
  {
    title: '7. Go live (Publish)',
    blocks: [
      { kind: 'paragraph', text: 'Publishing makes your draft the version visitors talk to.' },
      {
        kind: 'paragraph',
        text: 'Open the Publish tab and click Publish draft , then Publish to confirm. It now shows Version 1, Live .',
      },
      {
        kind: 'paragraph',
        text: 'Every version you publish is kept. If something goes wrong, click Roll back to this version on an earlier one.',
      },
      { kind: 'image', src: '/guide/ch07-01.png', caption: 'Confirming' },
      { kind: 'image', src: '/guide/ch07-02.png', caption: 'Version 1 is live' },
    ],
  },
  {
    title: '8. Add the chat window to your website (Settings)',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Two steps: say which website it may appear on, then copy the code for your website.',
      },
      { kind: 'heading', text: '8.1 Check your details' },
      {
        kind: 'paragraph',
        text: 'Under Agent details at the top of Settings , check Human inbox email . This is where you are emailed when a visitor asks for a person or leaves their details. You can also choose which languages the assistant speaks.',
      },
      { kind: 'image', src: '/guide/ch08-01.png', caption: 'Assistant details and languages' },
      { kind: 'heading', text: '8.2 Allow your website' },
      {
        kind: 'paragraph',
        text: 'Under Allowed domains , type your website address (for example www.example.com ) and click Add domain . Websites you added on the Knowledge tab are suggested under From your Knowledge : click one to add it. The chat window only appears on websites listed here.',
      },
      { kind: 'image', src: '/guide/ch08-02.png', caption: 'A website added to the allowed list' },
      { kind: 'heading', text: '8.3 Get the code' },
      {
        kind: 'paragraph',
        text: 'Click Generate embed code and copy the code straight away, because it is shown only once. Send it to whoever looks after your website and ask them to add it to every page.',
      },
      {
        kind: 'paragraph',
        text: 'If the code is ever shared by mistake, you can switch it off under Issued keys and create a new one.',
      },
      { kind: 'image', src: '/guide/ch08-03.png', caption: 'The code for your website' },
    ],
  },
  {
    title: '9. Try the chat window as a visitor',
    blocks: [
      {
        kind: 'paragraph',
        text: 'We added the code to a simple test page on www.example.com to see exactly what a visitor sees.',
      },
      { kind: 'heading', text: '9.1 Open the chat' },
      {
        kind: 'paragraph',
        text: 'A round chat button appears in the bottom-right corner. Click it. The window shows the bot name, the AI notice and your greeting.',
      },
      {
        kind: 'paragraph',
        text: 'The three small buttons at the top are: Leave your details , Start a new conversation and Close chat .',
      },
      { kind: 'image', src: '/guide/ch09-01.png', caption: 'The chat window open on a web page' },
      { kind: 'heading', text: '9.2 Ask questions' },
      {
        kind: 'paragraph',
        text: 'Answers appear with a Sources list underneath, so visitors can see where the answer came from.',
      },
      { kind: 'image', src: '/guide/ch09-02.png', caption: 'An answer from the website' },
      { kind: 'image', src: '/guide/ch09-03.png', caption: 'An answer from the PDF' },
      { kind: 'heading', text: '9.3 Leave contact details' },
      {
        kind: 'paragraph',
        text: 'We asked "Can I get a quote for a custom chatbot?". Because it contains quote , the reply has a Leave your details button. The visitor fills in the form, ticks the consent box and clicks Submit , then sees a thank-you message and clicks Close .',
      },
      { kind: 'image', src: '/guide/ch09-04.png', caption: 'The offer to leave details' },
      { kind: 'image', src: '/guide/ch09-05.png', caption: 'The contact form' },
      { kind: 'heading', text: '9.4 Ask for a person' },
      {
        kind: 'paragraph',
        text: 'The visitor wrote "I want to speak to a human please". The assistant stops and replies that a person has been told and will join shortly.',
      },
      { kind: 'image', src: '/guide/ch09-06.png', caption: 'A visitor asking for a person' },
    ],
  },
  {
    title: '10. Reply to a visitor yourself',
    blocks: [
      {
        kind: 'paragraph',
        text: 'You and your team reply from the Conversations page. New messages appear on their own, without refreshing.',
      },
      { kind: 'heading', text: '10.1 Find the conversation' },
      {
        kind: 'paragraph',
        text: 'Click Conversations in the left menu. The chat shows Handoff requested and says why. You can read everything said so far. At the bottom, click Take over conversation .',
      },
      { kind: 'image', src: '/guide/ch10-01.png', caption: 'A visitor waiting for a person' },
      { kind: 'heading', text: '10.2 Reply' },
      {
        kind: 'paragraph',
        text: 'The assistant pauses and the visitor is told you have joined. Type in Reply as a human and press Enter to send. Use Shift + Enter to start a new line.',
      },
      { kind: 'image', src: '/guide/ch10-02.png', caption: 'Typing a reply' },
      { kind: 'heading', text: '10.3 Chat back and forth' },
      {
        kind: 'paragraph',
        text: "Your reply appears in the visitor's chat window within seconds, marked Support agent . Their answer appears on your screen just as quickly.",
      },
      { kind: 'image', src: '/guide/ch10-03.png', caption: 'What the visitor sees' },
      { kind: 'image', src: '/guide/ch10-04.png', caption: 'What you see' },
      { kind: 'heading', text: '10.4 Finish the conversation' },
      {
        kind: 'paragraph',
        text: 'When you are done, click Resolve and confirm. The conversation is closed. If you would rather hand it back to the assistant, click Return to AI instead.',
      },
      {
        kind: 'paragraph',
        text: 'The visitor can start fresh at any time with Start a new conversation at the top of the chat window.',
      },
      { kind: 'image', src: '/guide/ch10-05.png', caption: 'Closing the conversation' },
      { kind: 'image', src: '/guide/ch10-06.png', caption: "The visitor's final view" },
    ],
  },
  {
    title: '11. See the contacts you collected',
    blocks: [
      { kind: 'paragraph', text: 'Everyone who left their details, in one list.' },
      {
        kind: 'paragraph',
        text: 'Click Leads in the left menu. The visitor from our test, Rahul Mehta, is listed as Qualified , with consent given.',
      },
      {
        kind: 'paragraph',
        text: "The same contacts also appear on your assistant's Prospects tab, and its chats on the Conversations tab.",
      },
      { kind: 'image', src: '/guide/ch11-01.png', caption: 'The Leads page' },
      { kind: 'image', src: '/guide/ch11-02.png', caption: 'The dashboard after the test' },
    ],
  },
  {
    title: '12. Plan levels: what each one adds',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Growth Agents grows with you in four levels. Each level keeps everything from the one before and adds more. In the app you only see the next level up from where you are, so you are never offered something you cannot use yet. This page lists all four.',
      },
      { kind: 'heading', text: 'Level 1 · Basic' },
      {
        kind: 'paragraph',
        text: 'Where every account starts, free during your trial. Your agents answer visitors from your own content.',
      },
      {
        kind: 'list',
        items: [
          'Website Sales & Support agent on your site',
          'Knowledge from your website pages and PDFs',
          'Lead capture: names, emails and phone numbers from chats',
          'Hand a conversation to a person on your team',
          'Conversations, leads and summary analytics',
        ],
      },
      { kind: 'heading', text: 'Level 2 · Enhanced' },
      {
        kind: 'paragraph',
        text: 'Each agent gets smarter about the people it talks to. For the Website Sales & Support agent this adds:',
      },
      {
        kind: 'list',
        items: [
          'Enrich prospects automatically',
          'Identify company information',
          'Analyze buying intent',
          'Generate personalized outreach',
          'Sync enriched data with your CRM',
        ],
      },
      {
        kind: 'paragraph',
        text: 'The other agents gain their own advanced features at this level: visibility monitoring and competitor benchmarking (SEVO), blogs, newsletters and campaigns (Content Strategy), and nurture sequences with CRM automation (Lead Outreach).',
      },
      { kind: 'heading', text: 'Level 3 · Connected' },
      {
        kind: 'paragraph',
        text: 'Opens once you are on Level 2. Your agents work together on one shared knowledge layer, with automatic actions between them.',
      },
      {
        kind: 'list',
        items: [
          'Every agent and feature available, not one at a time',
          'Activations: one agent can trigger another, for example a qualified lead starting a follow-up sequence',
          'Automated alerts and reports for your team',
          'Full analytics, detailed reports and data export',
        ],
      },
      { kind: 'heading', text: 'Level 4 · Customized' },
      {
        kind: 'paragraph',
        text: 'Once your team has proven value with the agents, we build a fully branded, company-trained agent designed to identify and accelerate your specific business opportunities.',
      },
      {
        kind: 'list',
        items: [
          'An agent custom-built on your brand and your data',
          'Designed around your own business processes',
          'Set up together with our team',
        ],
      },
      {
        kind: 'note',
        text: 'To move up a level, open Organization, then Billing, or use the upgrade card on any agent page.',
      },
    ],
  },
] as const;

export const guideChecklist: readonly string[] = [
  'Create your account. Knowledge: add your website and any PDFs, and wait until they show Ready. Draft: write the instructions, greeting and messages; set your handoff phrase and lead settings; click Save draft. Test: ask a few real questions. Publish: click Publish draft. Settings: add your website address, generate the code and send it to whoever manages your site. Visit your website and try the chat yourself. Reply to visitors from Conversations; find their details under Leads.',
];
