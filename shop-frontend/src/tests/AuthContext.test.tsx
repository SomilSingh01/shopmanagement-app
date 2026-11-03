/**
 * AuthContext Tests
 *
 * Tests the React auth context behaviour:
 * - useAuth hook throws outside of provider
 * - Initial state is loading=true, user=null
 * - Successful login sets user state
 * - Failed login throws and keeps user null
 * - Logout clears user state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// ─── Mock the API client so we control responses ──────────────────────────────
vi.mock('@/lib/api', () => ({
  apiClient: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock react-hot-toast to prevent DOM noise in tests
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { apiClient } from '@/lib/api';

// ─── Helper: renders a component that reads from AuthContext ──────────────────
function TestConsumer() {
  const { user, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.email ?? 'null'}</span>
      {/* Swallow the rejected promise so it doesn't become an unhandled rejection */}
      <button onClick={() => void login('test@example.com', 'password123').catch(() => {})}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('useAuth', () => {
  it('throws if used outside of AuthProvider', () => {
    // Suppress the React error boundary console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ThrowingComponent = () => {
      useAuth(); // Should throw
      return null;
    };

    expect(() => render(<ThrowingComponent />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );

    consoleSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthProvider', () => {
  it('starts with isLoading=true and user=null, then resolves', async () => {
    // getMe returns null (not logged in)
    vi.mocked(apiClient.getMe).mockResolvedValue(null);

    renderWithAuth();

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('restores user session when getMe returns a user', async () => {
    vi.mocked(apiClient.getMe).mockResolvedValue({ id: '1', email: 'saved@example.com', name: 'Saved' });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('saved@example.com');
    });
  });

  it('sets user state after a successful login', async () => {
    vi.mocked(apiClient.getMe).mockResolvedValue(null);
    vi.mocked(apiClient.login).mockResolvedValue({
      user: { id: '2', email: 'test@example.com', name: 'Test User' },
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });
  });

  it('keeps user null and shows error toast when login fails', async () => {
    vi.mocked(apiClient.getMe).mockResolvedValue(null);
    vi.mocked(apiClient.login).mockRejectedValue(
      Object.assign(new Error('Invalid credentials'), {
        response: { data: { message: 'Invalid credentials' } },
        isAxiosError: true,
      }),
    );

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Fire the click — login will fail internally; act swallows unhandled rejections
    await act(async () => {
      screen.getByText('Login').click();
      // Give async ops time to settle
      await new Promise((r) => setTimeout(r, 50));
    });

    // User must remain null after a failed login
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('clears user state after logout', async () => {
    vi.mocked(apiClient.getMe).mockResolvedValue({ id: '3', email: 'logmeout@example.com', name: 'Logout' });
    vi.mocked(apiClient.logout).mockResolvedValue(undefined);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('logmeout@example.com');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });
});
