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
  Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid="pdf-page">{pageNumber}</div>,
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

    // `delay: null` skips userEvent's per-keystroke timer hop. With the
    // default, typing this name is slow enough to hit the 5s test timeout
    // when the suite runs under load, which made this test flaky.
    const user = userEvent.setup({ delay: null });

    render(<ProjectFilesSection projectId="project-1" />);

    await user.click(screen.getByRole('button', { name: /^rename$/i }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText(/name/i);
    await user.clear(input);
    await user.type(input, 'Renamed report');
    await user.click(within(dialog).getByRole('button', { name: /^rename$/i }));

    expect(rename).toHaveBeenCalledWith('f1', 'Renamed report');
    // 15s, not the 5s default. This file mounts `ProjectFilesSection`, which
    // pulls `PdfPreview` in through `next/dynamic`; that import is
    // transformed on first use and the whole file runs ~10s in a full
    // parallel suite versus ~3s alone. The default left almost no margin, so
    // this test failed only under load and never in isolation. The timeout is
    // headroom for a slow environment, not a wait for a real async condition
    // (every assertion here is still awaited on its own).
  }, 15000);

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

    const user = userEvent.setup({ delay: null });

    // `ProjectFilesSection` pulls in `PdfPreview` through `next/dynamic`, so
    // the preview only mounts once that chunk's import promise resolves.
    // Importing it here first puts the module in the registry before the
    // click, leaving `next/dynamic` a promise that settles on the next
    // microtask instead of one that has to transform and evaluate the module
    // (plus react-pdf's CSS imports) while the assertion below is already
    // counting down. That transform is what pushed this test past the default
    // 1s `findBy*` timeout under full-suite load, and it is why this test
    // failed only in a full run and never in isolation.
    await import('../PdfPreview');

    render(<ProjectFilesSection projectId="project-1" />);

    // `userEvent.click`, not a raw DOM `.click()`: the latter is not
    // act()-wrapped, so React's resulting state update was never flushed
    // synchronously and the assertion below had to poll for it until the
    // 5s timeout. That was this test's flakiness, and the source of its
    // "not wrapped in act(...)" warning.
    await user.click(await screen.findByRole('button', { name: /report/i }));

    // Still generous on top of the preload: a dynamic boundary means at least
    // one extra tick, and the CI box this runs on is not the one it was
    // measured on.
    expect(await screen.findByTestId('pdf-document', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    // See the rename test above for why this file gets a raised timeout.
  }, 15000);
});
