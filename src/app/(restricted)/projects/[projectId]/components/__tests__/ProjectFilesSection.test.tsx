import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const usePermissions = vi.fn();
const useMyProjectAccess = vi.fn();
const useProjectFiles = vi.fn();
const useFilePreview = vi.fn();

vi.mock('@/app/(restricted)/context/PermissionsContext', () => ({
  usePermissions: () => usePermissions(),
}));

vi.mock('../../../hooks/useMyProjectAccess', () => ({
  useMyProjectAccess: (...args: unknown[]) => useMyProjectAccess(...args),
}));

vi.mock('../../../hooks/useProjectFiles', () => ({
  useProjectFiles: (...args: unknown[]) => useProjectFiles(...args),
}));

vi.mock('../../hooks/useFilePreview', () => ({
  useFilePreview: (...args: unknown[]) => useFilePreview(...args),
}));

vi.mock('@/lib/downloadBlob', () => ({
  downloadBlob: vi.fn(),
}));

// react-pdf doesn't work in jsdom (it needs a real canvas/worker), and the
// worker setup this component imports for its side effect (@/lib/pdfWorker)
// reaches into `pdfjs.GlobalWorkerOptions` on the same module — so both are
// stubbed out here rather than exercising the real PDF.js pipeline.
vi.mock('react-pdf', () => ({
  Document: ({
    children,
    onLoadSuccess,
  }: {
    children: ReactNode;
    onLoadSuccess?: (data: { numPages: number }) => void;
  }) => {
    onLoadSuccess?.({ numPages: 3 });
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }: { pageNumber: number }) => (
    <div data-testid="pdf-page">{pageNumber}</div>
  ),
  pdfjs: { GlobalWorkerOptions: {} },
}));

vi.mock('@/lib/pdfWorker', () => ({}));

import { ProjectFilesSection } from '../ProjectFilesSection';

const baseFiles = [
  {
    id: 'f1',
    name: 'Report',
    original_filename: 'report.pdf',
    size: 2048,
    content_type: 'application/pdf',
    owner_email: 'owner@example.com',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

function mockFilesHook(overrides: Partial<ReturnType<typeof useProjectFiles>> = {}) {
  useProjectFiles.mockReturnValue({
    files: baseFiles,
    isLoading: false,
    isError: false,
    pendingId: null,
    isUploading: false,
    upload: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  });
}

describe('ProjectFilesSection — access gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilesHook();
    useFilePreview.mockReturnValue({ url: null, isLoading: false, isError: false });
  });

  it('shows the upload control when the user holds org-wide project:manage', () => {
    usePermissions.mockReturnValue({ can: () => true });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: false });

    render(<ProjectFilesSection projectId="project-1" />);

    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
  });

  it('shows the upload control when the user is the project owner', () => {
    usePermissions.mockReturnValue({ can: () => false });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: true });

    render(<ProjectFilesSection projectId="project-1" />);

    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
  });

  it('shows the upload control for a user with an editor grant on this project', () => {
    usePermissions.mockReturnValue({ can: () => false });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: true });

    render(<ProjectFilesSection projectId="project-1" />);

    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
  });

  it('hides the upload control for a viewer-only grant', () => {
    usePermissions.mockReturnValue({ can: () => false });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: false });

    render(<ProjectFilesSection projectId="project-1" />);

    expect(screen.queryByRole('button', { name: /upload file/i })).not.toBeInTheDocument();
    // Download is still available regardless of access level.
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('hides the upload control for a user with no grant and no org-wide permission', () => {
    usePermissions.mockReturnValue({ can: () => false });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: false });

    render(<ProjectFilesSection projectId="project-1" />);

    expect(screen.queryByRole('button', { name: /upload file/i })).not.toBeInTheDocument();
  });
});

describe('ProjectFilesSection — rename', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFilePreview.mockReturnValue({ url: null, isLoading: false, isError: false });
  });

  it('shows the rename control for a user who can upload, and submits the new name', async () => {
    const rename = vi.fn().mockResolvedValue(true);
    mockFilesHook({ rename });
    usePermissions.mockReturnValue({ can: () => true });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: true });

    const user = userEvent.setup();

    render(<ProjectFilesSection projectId="project-1" />);

    await user.click(screen.getByRole('button', { name: /^rename$/i }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText(/name/i);
    await user.clear(input);
    await user.type(input, 'Renamed report');
    await user.click(within(dialog).getByRole('button', { name: /^rename$/i }));

    expect(rename).toHaveBeenCalledWith('f1', 'Renamed report');
  });

  it('hides the rename control for a viewer-only grant', () => {
    mockFilesHook();
    usePermissions.mockReturnValue({ can: () => false });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: false });

    render(<ProjectFilesSection projectId="project-1" />);

    expect(screen.queryByRole('button', { name: /rename/i })).not.toBeInTheDocument();
  });
});

describe('ProjectFilesSection — PDF preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilesHook();
    usePermissions.mockReturnValue({ can: () => true });
    useMyProjectAccess.mockReturnValue({ hasEditorGrant: false });
  });

  it('renders a react-pdf Document/Page for an application/pdf file', async () => {
    useFilePreview.mockReturnValue({
      url: 'blob:mock-url',
      isLoading: false,
      isError: false,
    });

    render(<ProjectFilesSection projectId="project-1" />);

    await screen.findByRole('button', { name: /report/i }).then((button) => button.click());

    expect(await screen.findByTestId('pdf-document')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});
