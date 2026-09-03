import '@testing-library/jest-dom';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: () => '/',
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  getSession: vi.fn().mockResolvedValue(null),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));
