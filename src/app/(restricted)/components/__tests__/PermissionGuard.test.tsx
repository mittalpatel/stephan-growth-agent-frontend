import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/widgets',
  useRouter: () => ({ replace }),
}));

const usePermissions = vi.fn();

vi.mock('../../context/PermissionsContext', () => ({
  usePermissions: () => usePermissions(),
}));

import PermissionGuard from '../PermissionGuard';

// The backend is the real authorization boundary — this guard is documented as
// UX-level only. That makes its fail-closed contract easy to "fix" into
// failing open by a future maintainer who doesn't realize it's the only
// client-side gate. Locking in: whenever permissions are not confirmed as
// granting access to the current route, children must never render.
describe('PermissionGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    usePermissions.mockReset();
  });

  it('never renders children while permissions have not loaded yet', () => {
    usePermissions.mockReturnValue({
      loaded: false,
      hasRouteAccess: () => true,
      defaultRoute: () => '/no-role',
    });

    render(
      <PermissionGuard>
        <div>protected content</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('never renders children when the loaded permission set denies the route', () => {
    // Mirrors the documented fail-closed failure mode: `loaded` becomes true
    // even when the fetch failed with no server seed, with an empty
    // permission set — this must still block rendering, not fall through.
    usePermissions.mockReturnValue({
      loaded: true,
      hasRouteAccess: () => false,
      defaultRoute: () => '/no-role',
    });

    render(
      <PermissionGuard>
        <div>protected content</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/no-role');
  });

  it('renders children once permissions are loaded and grant the route', () => {
    usePermissions.mockReturnValue({
      loaded: true,
      hasRouteAccess: () => true,
      defaultRoute: () => '/no-role',
    });

    render(
      <PermissionGuard>
        <div>protected content</div>
      </PermissionGuard>
    );

    expect(screen.getByText('protected content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
