/**
 * Demo module strings — removed by `npm run strip-demo`.
 *
 * The shape here is the one every feature namespace should copy: sub-objects by
 * concern (list / detail / form / actions / errors), plural forms declared as
 * objects rather than hardcoded `+ 's'`, and `{placeholder}` tokens resolved
 * through `format()` rather than template literals at the call site.
 */
export const projects = {
  title: 'Projects',
  description: 'Everything the starter demonstrates, in one removable module.',

  list: {
    searchPlaceholder: 'Search projects…',
    emptyTitle: 'No projects yet',
    emptyDescription: 'Create your first project to see it here.',
    emptyFilteredTitle: 'No projects match these filters',
    emptyFilteredDescription: 'Try clearing a filter or widening your search.',
    errorTitle: 'Could not load projects',
    errorDescription: 'Something went wrong fetching the list. Try again.',
    // Plural forms, resolved by `plural()` in src/lib/i18n.ts.
    resultCount: {
      one: '{count} project',
      other: '{count} projects',
    },
  },

  columns: {
    name: 'Name',
    status: 'Status',
    category: 'Category',
    owner: 'Owner',
    createdAt: 'Created',
    updatedAt: 'Updated',
  },

  detail: {
    title: 'Project details',
    notFoundTitle: 'Project not found',
    notFoundDescription: 'It may have been deleted, or you may not have access to it.',
    backToList: 'Back to projects',
    archivedNotice: 'This project is archived and cannot be edited.',
  },

  form: {
    createTitle: 'New project',
    editTitle: 'Edit project',
    // Field labels match the backend serializer field names one-for-one, which
    // is what lets `applyApiError` bind a server-side field error to the right
    // input with no mapping table. See src/lib/apiError.ts.
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Reference project',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What is this project for?',
    statusLabel: 'Status',
    categoryLabel: 'Category',
  },

  validation: {
    nameRequired: 'Name is required.',
    nameTooLong: 'Name must be 200 characters or fewer.',
    descriptionTooLong: 'Description must be 5000 characters or fewer.',
  },

  actions: {
    create: 'New project',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
  },

  confirm: {
    deleteTitle: 'Delete this project?',
    deleteDescription: 'It can be restored by an administrator, but it will disappear from lists.',
  },

  toast: {
    created: 'Project created.',
    updated: 'Project updated.',
    deleted: 'Project deleted.',
  },

  status: {
    draft: 'Draft',
    active: 'Active',
    archived: 'Archived',
  },

  category: {
    standard: 'Standard',
    premium: 'Premium',
    legacy: 'Legacy',
  },

  /**
   * The per-project "who has access" section on the detail page. Gated on
   * `project:access_manage` via `usePermissions().can('project', 'access_manage')`
   * — visible and editable only to someone holding that permission.
   */
  access: {
    title: 'Share project',
    shareButton: 'Share',
    description: 'Add specific people from your organization and choose what they can do.',
    addPeoplePlaceholder: 'Add people by name or email…',
    noMatches: 'No matching members',
    everyoneAdded: 'Everyone in the organization already has access.',
    addButton: 'Add',
    ownerBadge: 'Owner',
    // Owner/Admin-role members bypass per-project grants entirely, so the
    // dialog labels them rather than offering a revoke that would do nothing.
    orgWideBadge: '{role} · all projects',
    orgWideBadgeFallback: 'All projects',
    orgWideAccessHint:
      'This role has access to every project in the organization, so it cannot be changed here.',
    peopleWithAccessTitle: 'People with access',
    removeAriaLabel: 'Remove access',
    columns: {
      name: 'Name',
      email: 'Email',
      accessLevel: 'Access level',
      grantedBy: 'Granted by',
      grantedAt: 'Granted',
    },
    levels: {
      none: 'No access',
      viewer: 'Viewer',
      editor: 'Editor',
      manager: 'Manager',
    },
    emptyTitle: 'No one has access yet',
    emptyDescription: 'Add a member above to give them access to this project.',
    errorTitle: 'Could not load access',
    errorDescription: 'Something went wrong fetching who has access. Try again.',
    toast: {
      granted: 'Access updated.',
      revoked: 'Access revoked.',
    },
  },

  /**
   * The per-project attached-files section on the detail page. Upload/rename/
   * delete are gated in `ProjectFilesSection.tsx` on either the org-wide
   * `project:manage` permission or an `editor`/`manager` grant on this project
   * from `useProjectAccess` — a `viewer` grant (or no grant) sees view/download
   * only. This is a UI convenience gate; the backend re-checks independently.
   */
  files: {
    title: 'Files',
    description: 'Files attached to this project.',
    uploadButton: 'Upload file',
    columns: {
      name: 'Name',
      size: 'Size',
      contentType: 'Type',
      owner: 'Uploaded by',
      uploadedAt: 'Uploaded',
    },
    emptyTitle: 'No files yet',
    emptyDescription: 'Upload a file above to see it here.',
    errorTitle: 'Could not load files',
    errorDescription: 'Something went wrong fetching the files. Try again.',
    previewUnavailable: 'No preview available for this file type.',
    previewClose: 'Close preview',
    previewLoadError: 'Could not load this PDF for preview.',
    pdf: {
      pageOf: 'Page {current} of {total}',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
    },
    form: {
      title: 'Upload file',
      nameLabel: 'Name',
      namePlaceholder: 'e.g. Q3 report',
      dropzoneHint: 'Drag and drop a file here, or click to browse.',
      dropzoneActive: 'Drop the file to attach it.',
      selectedFile: 'Selected file',
      submit: 'Upload',
    },
    validation: {
      nameRequired: 'Name is required.',
      nameTooLong: 'Name must be 200 characters or fewer.',
      fileRequired: 'Choose a file to upload.',
      fileTooLarge: 'This file is larger than {limit}. Choose a smaller file.',
    },
    actions: {
      download: 'Download',
      rename: 'Rename',
      delete: 'Delete',
      preview: 'Preview',
    },
    confirm: {
      deleteTitle: 'Delete this file?',
      deleteDescription: 'This cannot be undone.',
    },
    toast: {
      uploaded: 'File uploaded.',
      renamed: 'File renamed.',
      deleted: 'File deleted.',
    },
  },
} as const;
