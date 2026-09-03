import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { useProjectFiles } from '../useProjectFiles';

const filesRefetch = vi.fn();
const mutateAsync = vi.fn();

let filesData: { data: unknown[] } | undefined;
let filesLoading = false;
let filesError = false;

vi.mock('@/hooks/useAuthQuery', () => ({
  useAuthQuery: () => ({
    data: filesData,
    isLoading: filesLoading,
    isError: filesError,
    refetch: filesRefetch,
  }),
}));

vi.mock('@/hooks/useAuthMutation', () => ({
  useAuthMutation: () => ({ mutateAsync }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useProjectFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filesLoading = false;
    filesError = false;
    filesData = {
      data: [
        {
          id: 'f1',
          name: 'Report',
          original_filename: 'report.pdf',
          size: 1024,
          content_type: 'application/pdf',
          owner_email: 'owner@example.com',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    };
  });

  it('exposes the file list from the query', () => {
    const { result } = renderHook(() => useProjectFiles('project-1'));
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]?.name).toBe('Report');
  });

  it('uploads with a multipart POST and refetches on success', async () => {
    mutateAsync.mockResolvedValueOnce({});
    const { result } = renderHook(() => useProjectFiles('project-1'));

    const file = new File(['x'], 'report.pdf', { type: 'application/pdf' });
    const ok = await result.current.upload(file, 'Report');

    expect(ok).toBe(true);
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/projects/project-1/files/',
        method: 'post',
        body: expect.any(FormData),
      })
    );
    const call = mutateAsync.mock.calls[0]?.[0] as { body: FormData };
    expect(call.body.get('name')).toBe('Report');
    expect(call.body.get('file')).toBe(file);
    expect(toast.success).toHaveBeenCalled();
    expect(filesRefetch).toHaveBeenCalled();
  });

  it('renames with a PATCH and refetches on success', async () => {
    mutateAsync.mockResolvedValueOnce({});
    const { result } = renderHook(() => useProjectFiles('project-1'));

    const ok = await result.current.rename('f1', 'New name');

    expect(ok).toBe(true);
    expect(mutateAsync).toHaveBeenCalledWith({
      url: '/api/v1/projects/project-1/files/f1/',
      method: 'patch',
      body: { name: 'New name' },
    });
    expect(filesRefetch).toHaveBeenCalled();
  });

  it('deletes with a DELETE and refetches on success', async () => {
    mutateAsync.mockResolvedValueOnce({});
    const { result } = renderHook(() => useProjectFiles('project-1'));

    const ok = await result.current.remove('f1');

    expect(ok).toBe(true);
    expect(mutateAsync).toHaveBeenCalledWith({
      url: '/api/v1/projects/project-1/files/f1/',
      method: 'delete',
    });
    expect(filesRefetch).toHaveBeenCalled();
  });

  it('returns false and clears pendingId after a failed mutation without throwing', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useProjectFiles('project-1'));

    const ok = await result.current.remove('f1');

    expect(ok).toBe(false);
    await waitFor(() => expect(result.current.pendingId).toBeNull());
  });

  it('reports loading/error from the underlying query', () => {
    filesError = true;
    const { result } = renderHook(() => useProjectFiles('project-1'));
    expect(result.current.isError).toBe(true);
  });
});
