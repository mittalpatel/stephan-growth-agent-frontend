export const errors = {
  notFound: 'Page not found',
  notFoundDescription: 'The page you are looking for does not exist.',
  goToDashboard: 'Go to Dashboard',
  goBack: 'Go Back',
  returnHome: 'Return Home',
  error404Label: 'Error 404',
  somethingWentWrong: 'Something went wrong',
  tryAgain: 'Try again',
  rateLimited: 'Too many requests. Please wait a moment and try again.',
  rateLimitedRetry: 'Too many requests. Try again in {seconds}s.',
  noRole: {
    badge: 'Limited Access',
    title: 'No role assigned to your account',
    description:
      'Your profile is active but does not yet have linked permissions. Contact an administrator to request a role so you can access the dashboards and tools you need.',
    refresh: 'Refresh session',
    hint: 'If you think this is a mistake, share this page ({route}) with your administrator when requesting access.',
    // Shown only when the account also belongs to no organization at all —
    // distinct from having an org but no role in it, which is the administrator
    // case above.
    orgLessTitle: "You're not part of an organization yet",
    orgLessDescription:
      'Ask whoever invited you for a fresh invitation, or create your own organization and invite others into it.',
    createOrganization: 'Create an organization',
    checkInvitations: 'Check your invitations',
  },
} as const;
