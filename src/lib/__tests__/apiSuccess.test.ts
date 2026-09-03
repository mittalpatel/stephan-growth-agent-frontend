import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toast } from 'sonner';
import { applyApiSuccess } from '@/lib/apiSuccess';

describe('applyApiSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefers the envelope message over the fallback', () => {
    applyApiSuccess({ message: 'Sucursal actualizada' }, { fallbackMessage: 'Saved' });
    expect(toast.success).toHaveBeenCalledWith('Sucursal actualizada');
  });

  it('reads the message from an AxiosResponse-shaped result (data.message)', () => {
    applyApiSuccess({ status: 200, data: { message: 'Correo enviado' } });
    expect(toast.success).toHaveBeenCalledWith('Correo enviado');
  });

  it('falls back to the curated message when the envelope has no message', () => {
    applyApiSuccess({ message: '   ', data: {} }, { fallbackMessage: 'Saved' });
    expect(toast.success).toHaveBeenCalledWith('Saved');
  });

  it('shows nothing when there is neither a message nor a fallback', () => {
    applyApiSuccess({ data: {} });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('routes through a custom notify channel when provided', () => {
    const notify = vi.fn();
    applyApiSuccess({ message: 'Hecho' }, { notify });
    expect(notify).toHaveBeenCalledWith('Hecho');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
