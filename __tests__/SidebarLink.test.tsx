import React from 'react';
import { render, screen } from '@testing-library/react';
import SidebarLink from '../app/dashboard/components/SidebarLink';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode, href: string, className: string }) => (
    <a href={href} className={className}>{children}</a>
  );
});

describe('SidebarLink Component', () => {
  const mockIcon = () => <svg data-testid="mock-icon" />;

  it('renders correctly when sidebar is open', () => {
    render(
      <SidebarLink
        href="/dashboard/test"
        label="Test Link"
        Icon={mockIcon}
        active={false}
        sidebarOpen={true}
      />
    );
    
    expect(screen.getByText('Test Link')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('hides label when sidebar is closed', () => {
    render(
      <SidebarLink
        href="/dashboard/test"
        label="Test Link"
        Icon={mockIcon}
        active={false}
        sidebarOpen={false}
      />
    );
    
    expect(screen.queryByText('Test Link')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('applies active styles when active is true', () => {
    render(
      <SidebarLink
        href="/dashboard/test"
        label="Test Link"
        Icon={mockIcon}
        active={true}
        sidebarOpen={true}
      />
    );
    
    const link = screen.getByText('Test Link').closest('a');
    expect(link).toHaveClass('active');
  });
});
