/**
 * Organization (tenancy) strings.
 *
 * Every user-visible string lives here — the ESLint `no-restricted-syntax` rule
 * fails the build on literal JSX text, placeholders, titles, alt text, aria-labels,
 * and toast arguments, so there is no path around it.
 */
export const organizations = {
  title: 'Organization',
  description: "Manage this organization's details, members, and roles.",

  settings: {
    title: 'Settings',
    nameLabel: 'Organization name',
    namePlaceholder: 'Acme Inc.',
    slugLabel: 'Handle',
    slugHint: 'Used in links and cannot be changed after creation.',
    seatsLabel: 'Seat limit',
    seatsUnlimited: 'Unlimited',
    planLabel: 'Plan',
    planNone: 'No plan assigned',
    saved: 'Organization updated.',
  },

  settingsTabs: {
    errorTitle: 'Could not load these settings',
    errorDescription: 'Something went wrong. Nothing has been changed.',
    tabs: {
      general: 'General',
      brand: 'Branding',
      domains: 'Domains',
      data: 'Data',
    },
    brand: {
      saved: 'Brand settings updated.',
      logoLabel: 'Logo',
      logoHint: 'PNG, JPEG or WebP, up to 2 MB.',
      faviconLabel: 'Favicon',
      faviconHint: 'PNG or ICO, up to 512 KB.',
      imageInputLabel: 'Choose a file for {label}',
      imageUpload: 'Upload',
      imageReplace: 'Replace',
      imageUploading: 'Uploading',
      imageRemove: 'Remove',
      imageUploaded: 'Image uploaded.',
      imageRemoved: 'Image removed.',
      imageTypeError: 'This file type is not supported.',
      imageSizeError: 'This file is too large.',
      colorLabel: 'Primary color',
      colorPrimaryPlaceholder: '#0A3D51',
      colorInvalid: 'Enter a hex color like #0A3D51.',
      emailInvalid: 'Enter a valid email address.',
      displayNameLabel: 'Display name',
      displayNamePlaceholder: 'The name your customers see',
      displayNameHint:
        'Shown to your customers in place of your organization name. Your internal name and web address stay the same.',
      emailReplyToLabel: 'Reply-to address',
      emailReplyToPlaceholder: 'replies@example.com',
    },
    contact: {
      title: 'Contact details',
      saved: 'Contact details updated.',
      websiteLabel: 'Website',
      websitePlaceholder: 'https://example.com',
      websiteInvalid: 'Enter a valid web address.',
      emailInvalid: 'Enter a valid email address.',
      contactEmailLabel: 'Contact email',
    },
    domains: {
      notice:
        'Add a domain, publish the DNS record shown for it, then check it. A verified domain lets your sign-in page carry your branding. Serving the whole app from your domain also needs routing to be switched on for it.',
      domainLabel: 'Domain',
      domainPlaceholder: 'app.example.com',
      addAction: 'Add domain',
      added: 'Domain added.',
      invalid: 'Enter a domain like app.example.com, with no https:// and no path.',
      emptyTitle: 'No domains claimed',
      emptyDescription: 'Add a domain to reserve it for your organization.',
      statusPendingVerification: 'Pending verification',
      statusAwaitingRouting: 'Awaiting routing',
      statusActive: 'Active',
      hintAwaitingRouting:
        'Ownership is verified. Your branding shows on the sign-in page for this domain. The app itself is not served from it yet.',
      recordTitle: 'Publish this DNS record',
      recordType: 'Type',
      recordName: 'Name',
      recordValue: 'Value',
      primary: 'Primary',
      verifyAction: 'Check DNS record',
      setPrimaryAction: 'Make primary',
      removeAction: 'Remove',
      removeConfirmTitle: 'Remove {domain}',
      removeConfirmBody:
        'This releases the domain so another organization can claim it. You can add it again later.',
    },
    data: {
      noPermission: 'You do not have access to export or delete this organization’s data.',
      exportTitle: 'Data export',
      requestExport: 'Request export',
      exportRequested: 'Export requested. You will be notified when it is ready.',
      noExports: 'No exports have been requested yet.',
      exportsErrorTitle: 'Could not load your exports',
      exportsErrorDescription: 'Something went wrong fetching your export history.',
      download: 'Download',
      downloading: 'Downloading…',
      exportStatus: {
        pending: 'Pending',
        processing: 'Processing',
        ready: 'Ready',
        failed: 'Failed',
      },
      deleteTitle: 'Delete this organization',
      deleteDescription:
        'This permanently deletes the organization and all its data. A confirmation link will be emailed to you first.',
      deleteAction: 'Delete organization',
      deleteRequested: 'Check your email to confirm deletion.',
      deleteConfirmTitle: 'Delete organization',
      deleteConfirmEmailBody:
        'A confirmation link will be emailed to you. The organization is not deleted until you confirm it.',
      deleteConfirmBody:
        'This link permanently deletes your organization and all its data. This cannot be undone.',
      deleteConfirmAction: 'Confirm deletion',
      deleteConfirmMissingToken:
        'This confirmation link is incomplete. Open the link from your email again, or request deletion once more.',
      deleteConfirmed: 'Your organization has been deleted.',
    },
  },

  dangerZone: {
    title: 'Danger zone',
    deleteTitle: 'Delete this organization',
    deleteDescription:
      'All of its data is retained for a grace period before being permanently removed.',
    deleteAction: 'Delete organization',
    deleteConfirmTitle: 'Delete {name}?',
    deleteConfirmBody:
      'Everyone loses access immediately. This can be undone during the grace period.',
    deleted: 'Organization deleted.',
    transferTitle: 'Transfer ownership',
    transferDescription:
      'Hand full control of this organization to another member. You keep Admin access afterward and are not removed.',
    memberLabel: 'New owner',
    memberPlaceholder: 'Select a member',
    transferAction: 'Transfer ownership',
    transferConfirmTitle: 'Transfer ownership to {name}?',
    transferConfirmBody:
      'They become the Owner immediately. You become an Admin instead of losing access.',
    transferred: 'Ownership transferred.',
  },

  create: {
    title: 'Create an organization',
    description: 'You will be its owner.',
    nameLabel: 'Organization name',
    namePlaceholder: 'Acme Inc.',
    submit: 'Create organization',
    created: 'Organization created.',
  },

  members: {
    title: 'Members',
    description: 'People with access to this organization.',
    emptyTitle: 'No members yet',
    emptyDescription: 'Invite someone to get started.',
    columns: {
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      joined: 'Joined',
    },
    count: { one: '{count} member', other: '{count} members' },
    changeRole: 'Change role',
    roleChanged: 'Role updated.',
    status: {
      active: 'Active',
      suspended: 'Suspended',
    },
    suspend: 'Suspend member',
    suspended: 'Member suspended.',
    reactivate: 'Reactivate member',
    reactivated: 'Member reactivated.',
    remove: 'Remove from organization',
    removeConfirmTitle: 'Remove {name}?',
    removeConfirmBody: 'They lose access immediately. You can invite them again later.',
    removed: 'Member removed.',
    inviteRevoked: 'Invitation revoked.',
    inviteResent: 'Invitation resent.',
    explain: 'Explain access',
  },

  pendingInvites: {
    title: 'Pending invitations',
    emptyDescription: 'No invitations are waiting to be accepted.',
    columns: {
      email: 'Email',
      role: 'Role',
      expires: 'Expires',
    },
    revoke: 'Revoke',
    revokeConfirmTitle: 'Revoke the invitation to {email}?',
    revokeConfirmBody: 'The link they were sent will stop working immediately.',
    resend: 'Resend',
  },

  explain: {
    title: 'Why does {name} have this access?',
    description: 'Every permission this member effectively holds, and where it comes from.',
    sourceRole: 'Via the {role} role',
    sourceOverride: 'Direct grant to this member',
    sourceSuperuser: 'Platform superuser: bypasses all checks',
    empty: 'This member currently holds no permissions.',
    loadFailed: 'Could not load this member’s permissions.',
  },

  overrides: {
    title: 'Overrides',
    titleFor: 'Overrides for {name}',
    description: 'Change what this member can do without changing their role.',
    manageLink: 'Manage overrides',
    backToMembers: '← All members',
    notFoundTitle: 'Member not found',
    notFoundDescription: 'They may have left the organization, or never belonged to it.',

    // "What they have" — every permission the member currently, effectively holds.
    currentAccessTitle: 'Current access',
    currentAccessDescription: 'Everything this member can currently do, and why.',
    currentAccessEmpty: 'This member currently holds no permissions.',
    sourceRole: 'Via role',
    sourceOverride: 'Via override',
    denyAction: 'Deny',
    removeOverrideAction: 'Remove override',

    // "What they don't have yet" — grant one, or undo an existing denial.
    grantMoreTitle: 'Grant more access',
    grantMoreDescription: 'Permissions this member does not currently have.',
    grantAction: 'Grant',
    deniedBadge: 'Denied by override',
    removeDenialAction: 'Remove denial',

    expiresLabel: 'Expires',
    expiresPlaceholder: 'No expiry',
    expiresTimeLabel: 'Expiry time',
    expiresHint: 'Optional. Leave blank for a permanent change to this permission.',
    expiresTimeHint: 'Defaults to end of day if no time is set.',
    expiresTimeTooSoon: 'Pick a time at least 5 minutes from now.',
    expiresBadge: 'Expires {date}',

    grantConfirmTitle: 'Grant "{permission}"?',
    grantConfirmBody:
      'This member will gain this permission immediately, regardless of their role.',
    denyConfirmTitle: 'Deny "{permission}"?',
    denyConfirmBody: 'This blocks the permission for this member even though their role grants it.',

    saved: 'Override saved.',
    removed: 'Override removed.',
    // Same ceiling rule as role editing: you cannot grant a permission you do
    // not hold yourself. A DENY has no such restriction.
    permissionLocked: 'You cannot grant a permission you do not hold.',
  },

  audit: {
    title: 'Audit trail',
    description: 'A record of every membership, role, and organization change.',
    emptyTitle: 'No activity yet',
    emptyDescription: 'Changes to this organization will appear here.',
    // Distinct from emptyTitle on purpose: "nothing matched your filters" and
    // "nothing has happened" call for different copy and different actions.
    emptyFilteredTitle: 'No matching activity',
    emptyFilteredDescription: 'No audit entries match the current filters.',
    searchPlaceholder: 'Search by actor or target…',
    columns: {
      when: 'When',
      actor: 'Actor',
      action: 'Action',
      target: 'Target',
    },
    loadFailed: 'Could not load the audit trail.',
    errorTitle: 'Could not load the audit trail',
    errorDescription: 'Something went wrong fetching this organization’s activity.',
    // -- detail drawer --
    detail: {
      title: 'Audit entry',
      whatChanged: 'What changed',
      noChanges: 'This entry recorded no field-level changes.',
      context: 'Context',
      metadata: 'Details',
      actor: 'Actor',
      action: 'Action',
      event: 'Event',
      target: 'Target',
      targetId: 'Target ID',
      when: 'When',
      ipAddress: 'IP address',
      // Shown rather than an empty cell: a blank reads as a rendering bug,
      // whereas this says the value was never captured.
      notRecorded: 'Not recorded',
      from: 'From',
      to: 'To',
      loadFailed: 'Could not load this audit entry.',
      viewLabel: 'View details',
    },
  },

  impersonation: {
    // -- banner --
    banner: {
      actingAs: 'Acting as',
      inOrganization: 'in',
      readOnly: 'Read-only',
      writesEnabled: 'Writes enabled',
      expiresIn: 'Ends in',
      expired: 'Ended',
      end: 'End session',
      ending: 'Ending\u2026',
      endFailed: 'Could not end the session.',
    },
    // -- admin page --
    title: 'Impersonate a user',
    description:
      'Act as a customer to reproduce what they see. Every session is time-boxed and every action is recorded against your account.',
    emailLabel: 'User email',
    emailPlaceholder: 'customer@example.com',
    organizationLabel: 'Organization',
    reasonLabel: 'Reason',
    reasonPlaceholder: 'Ticket reference and what you need to check',
    reasonHelp: 'Recorded in the audit trail. At least 10 characters.',
    minutesLabel: 'Duration',
    minutesHelp: 'Maximum 60 minutes. The session ends itself.',
    writeEnabledLabel: 'Allow writes',
    writeEnabledHelp:
      'Off by default. Only enable if you need to change the customer\u2019s data \u2014 it is recorded either way.',
    lookupFailed: 'No account with that email address.',
    noOrganizations: 'That user is not an active member of any organization.',
    submit: 'Start session',
    submitting: 'Starting\u2026',
    started: 'Impersonation session started.',
    startFailed: 'Could not start the session.',
    // -- session list --
    sessionsTitle: 'Recent sessions',
    columns: {
      impersonator: 'Admin',
      target: 'Acting as',
      organization: 'Organization',
      reason: 'Reason',
      started: 'Started',
      expires: 'Expires',
      status: 'Status',
    },
    statusLive: 'Live',
    statusEnded: 'Ended',
    emptyTitle: 'No sessions yet',
    emptyDescription: 'Impersonation sessions will be listed here.',
    loadFailed: 'Could not load impersonation sessions.',
  },

  invite: {
    title: 'Invite a member',
    emailLabel: 'Email address',
    emailPlaceholder: 'person@example.com',
    roleLabel: 'Role',
    roleHelp: 'Choose what this person can see and change. You can change it later.',
    recommendedRole: '{name} (recommended)',
    // Keyed by system role slug (`apps/rbac/seed_data.py`). A custom role has
    // no entry and simply shows no description.
    roleDescriptions: {
      owner:
        'Full control, including billing, deleting the organization and transferring ownership.',
      admin:
        'Runs the organization day to day: members, agents, knowledge and settings. Unlike the Owner, cannot pay, delete the organization or transfer ownership.',
      agent_manager:
        'Sets up agents and their knowledge, and can read conversations to improve answers. No access to members or billing.',
      billing_manager:
        'Manages the plan, invoices and payment details. No access to conversations.',
      operator: 'Handles visitor conversations, leads and hand-offs to a human.',
      member: 'Basic access to the organization. Cannot see or change agents.',
      analyst: 'Can view agents, conversations, leads and analytics, without changing anything.',
      'read-only': 'Can see the organization only. Cannot see agents or conversations.',
    } as Record<string, string>,
    submit: 'Send invitation',
    // Both outcomes are now "invited, not yet a member" — an existing account
    // accepts in-app (see myInvites below), a new one gets an emailed signup link.
    sent: 'Invitation sent.',
  },

  myInvites: {
    title: 'Invitations',
    description: 'Organizations that have invited you to join.',
    emptyTitle: 'No pending invitations',
    emptyDescription: "You'll see invitations to join other organizations here.",
    loadFailedTitle: 'Could not load your invitations',
    loadFailedDescription: 'Something went wrong. Please try again.',
    asRole: 'As {role}',
    noRole: 'member',
    expires: 'Expires {date}',
    accept: 'Accept',
    decline: 'Decline',
    accepted: "You've joined the organization.",
    declined: 'Invitation declined.',
  },

  roles: {
    title: 'Roles',
    description: 'Every role and exactly what it can do. Click one to change its permissions.',
    systemBadge: 'System',
    customBadge: 'Custom',
    createTitle: 'Create a role',
    editTitle: 'Edit {name}',
    editDescription: 'Move permissions between the two lists, or drag them across.',
    backToList: 'All roles',
    notFoundTitle: 'Role not found',
    notFoundDescription: 'It may have been deleted, or it never existed.',
    loadFailedTitle: 'Could not load this role',
    loadFailedDescription: 'Something went wrong fetching it. Please try again.',
    nameLabel: 'Role name',
    namePlaceholder: 'Auditor',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What this role is for',
    permissionsLabel: 'Permissions',
    permissionCount: { one: '{count} permission', other: '{count} permissions' },
    // Shown on a permission the current user does not hold themselves.
    permissionLocked: 'You cannot grant a permission you do not hold.',
    created: 'Role created.',
    updated: 'Role updated.',
    deleted: 'Role deleted.',
    emptyTitle: 'No custom roles',
    emptyDescription: 'Create one to grant a permission set the system roles do not cover.',

    // The dual-panel permission picker.
    searchPlaceholder: 'Search permissions…',
    availableTitle: 'Available',
    availableEmpty: 'No matching permissions.',
    grantedTitle: 'Granted',
    grantedEmpty: 'Drag a permission here, or click one on the left.',
    grantAction: 'Grant',
    revokeAction: 'Revoke',

    // Editing a system role directly. Accurate whether or not this organization
    // has already made its own copy: the first save creates one (see the
    // backend's `RBACService._fork_or_get_org_role`), so it's never true that
    // an edit here reaches another organization, at any point in the flow.
    systemEditNotice: 'These changes will only apply to this organization.',
    resetAction: 'Reset to defaults',
    resetConfirmTitle: 'Reset {name} to its default permissions?',
    resetConfirmBody:
      'Any custom changes to this role are discarded and replaced with the original set.',
    resetDone: 'Role reset to its defaults.',

    deleteAction: 'Delete role',
    deleteConfirmTitle: 'Delete {name}?',
    deleteConfirmBody: 'Members holding this role lose the permissions it grants immediately.',
  },

  apiKeys: {
    title: 'API keys',
    description: 'Credentials for scripts and integrations to act on this organization.',
    emptyTitle: 'No API keys yet',
    emptyDescription: 'Create one to let a script or integration call the API on your behalf.',
    emptyFilteredTitle: 'No matching keys',
    emptyFilteredDescription: 'No API keys match the current filters.',
    searchPlaceholder: 'Search by name or prefix…',
    errorTitle: 'Could not load API keys',
    errorDescription: 'Something went wrong fetching this organization’s API keys.',
    columns: {
      name: 'Name',
      prefix: 'Prefix',
      status: 'Status',
      permissions: 'Permissions',
      lastUsed: 'Last used',
      expires: 'Expires',
      created: 'Created',
    },
    status: {
      active: 'Active',
      expired: 'Expired',
      revoked: 'Revoked',
    },
    never: 'Never',
    noExpiry: 'No expiry',
    permissionCount: { one: '{count} permission', other: '{count} permissions' },

    create: {
      trigger: 'Create API key',
      title: 'Create an API key',
      description:
        'The secret is shown once, immediately after creation. It cannot be retrieved again.',
      nameLabel: 'Name',
      namePlaceholder: 'Nightly sync',
      permissionsLabel: 'Permissions',
      permissionsHelp: 'This key can only ever do what you can currently do.',
      expiresLabel: 'Expiry',
      expiresHelp: 'Optional. Leave blank for a key that does not expire on its own.',
      submit: 'Create key',
      submitting: 'Creating…',
      created: 'API key created.',
      createFailed: 'Could not create the API key.',
      permissionsRequired: 'Select at least one permission.',
    },

    reveal: {
      title: 'Your new API key',
      warning:
        'This is the only time this secret will be shown. Copy it now, because it cannot be shown again.',
      secretLabel: 'Secret',
      copyLabel: 'Copy secret',
      copied: 'Secret copied to clipboard.',
      copyFailed: 'Could not copy automatically. Select and copy the secret manually.',
      done: "I've saved it",
    },

    revoke: 'Revoke',
    revokeConfirmTitle: 'Revoke "{name}"?',
    revokeConfirmBody:
      'Any script or integration using this key will stop working immediately. This cannot be undone.',
    revoked: 'API key revoked.',
    revokeFailed: 'Could not revoke the API key.',
  },
} as const;
