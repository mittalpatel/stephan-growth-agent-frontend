import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sin Rol Asignado',
  description: 'Tu cuenta aún no tiene un rol asignado. Contacta al administrador.',
};

export default function NoRoleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
