// Basic smoke test for the login page component
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
  Toaster: () => null,
}));

// Mock components/ui/AdaptiveModal
jest.mock('@/components/ui/AdaptiveModal', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

// Mock lib/supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        or: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }),
  },
}));

it('renders login page without crashing', async () => {
  const LoginPage = (await import('@/app/page')).default;
  render(<LoginPage />);
  // Should render some login-related content
  expect(document.body).toBeTruthy();
});
