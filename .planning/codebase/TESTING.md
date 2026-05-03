# Testing Patterns

**Analysis Date:** 2026-05-03

## Test Framework

**Runner:**
- Jest 30.3.0
- Config: `jest.config.js`

**Assertion Library:**
- Expect (built-in to Jest)
- Testing Library (for DOM assertions)

**Run Commands:**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode (if configured)
```

## Test File Organization

**Location:**
- Separate `__tests__/` directory at project root.

**Naming:**
- `[ComponentName].test.tsx`

## Test Structure

**Suite Organization:**
```typescript
describe('SidebarLink', () => {
  it('renders correctly with label', () => {
    render(<SidebarLink label="Dashboard" ... />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

## Mocking

**Framework:** `jest.mock()`

**Patterns:**
- Mocking Supabase client calls to avoid real network requests during unit tests.

## Coverage

**Requirements:** None strictly enforced currently.

---

*Testing analysis: 2026-05-03*
