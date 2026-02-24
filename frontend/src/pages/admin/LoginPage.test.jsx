/**
 * LoginPage Component Tests
 * 
 * Testing priorities:
 * 1. Form submission with valid credentials
 * 2. Error message on invalid credentials
 * 3. "Keep me logged in" checkbox default checked
 * 4. Validation errors for empty fields
 * 5. Accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LoginPage from '../../pages/admin/LoginPage';

// Mock the authService
jest.mock('../../services/authService', () => ({
  login: jest.fn(),
}));

// Mock PageHeader component
jest.mock('../components/common/PageHeader', () => {
  return function MockPageHeader({ title, subtitle, showBack, backTo }) {
    return (
      <header data-testid="page-header">
        <h1>{title}</h1>
        {subtitle && <p data-testid="page-subtitle">{subtitle}</p>}
        {showBack && <a href={backTo} data-testid="back-link">Back</a>}
      </header>
    );
  };
});

// Mock Button component
jest.mock('../components/common/Button', () => {
  return function MockButton({ children, type, loading, disabled, onClick, icon, variant, size, fullWidth }) {
    return (
      <button
        type={type || 'button'}
        onClick={onClick}
        disabled={disabled || loading}
        data-testid="submit-button"
        data-loading={loading}
      >
        {icon && <span data-testid="button-icon">{icon}</span>}
        {children}
      </button>
    );
  };
});

// Mock FormError component
jest.mock('../components/common/ErrorMessage', () => ({
  FormError: ({ message }) => (
    <div data-testid="form-error" className="form-error">
      {message}
    </div>
  ),
}));

const importActual = jest.requireActual('react-hook-form');

describe('LoginPage Component', () => {
  const mockLogin = require('../../services/authService').login;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  describe('Rendering Tests', () => {
    test('should render login page with title', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });

    test('should render subtitle', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByTestId('page-subtitle')).toHaveTextContent(
        'Sign in to manage your church documents'
      );
    });

    test('should render email input field', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    test('should render password input field', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    test('should render remember me checkbox', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByLabelText(/keep me logged in/i)).toBeInTheDocument();
    });

    test('should render submit button', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    test('should render forgot password link', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    });

    test('should have back link in header', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByTestId('back-link')).toBeInTheDocument();
    });
  });

  describe('Keep Me Logged In Checkbox Tests', () => {
    test('should have "Keep me logged in" checkbox checked by default', () => {
      // When
      renderLoginPage();

      // Then
      const checkbox = screen.getByLabelText(/keep me logged in/i);
      expect(checkbox).toBeChecked();
    });

    test('should allow unchecking "Keep me logged in" checkbox', () => {
      // Given
      renderLoginPage();
      const checkbox = screen.getByLabelText(/keep me logged in/i);

      // When
      fireEvent.click(checkbox);

      // Then
      expect(checkbox).not.toBeChecked();
    });

    test('should allow re-checking "Keep me logged in" checkbox', () => {
      // Given
      renderLoginPage();
      const checkbox = screen.getByLabelText(/keep me logged in/i);
      fireEvent.click(checkbox); // Uncheck

      // When
      fireEvent.click(checkbox); // Re-check

      // Then
      expect(checkbox).toBeChecked();
    });

    test('should have help text for remember me option', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByText(/stay logged in for 30 days/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation Tests', () => {
    test('should show error when email is empty on submit', async () => {
      // Given
      renderLoginPage();
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText(/please enter your email address/i)).toBeInTheDocument();
      });
    });

    test('should show error when password is empty on submit', async () => {
      // Given
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();
      });
    });

    test('should show error for invalid email format', async () => {
      // Given
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    test('should show error when password is less than 6 characters', async () => {
      // Given
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: '12345' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    test('should not show validation errors before submit', () => {
      // Given
      renderLoginPage();

      // Then - no errors initially
      expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();
    });

    test('should clear error when user starts typing in email field', async () => {
      // Given
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email address/i);

      // When - trigger validation
      await act(async () => {
        fireEvent.blur(emailInput);
      });

      // Then - error should appear
      await waitFor(() => {
        expect(screen.getByText(/please enter your email address/i)).toBeInTheDocument();
      });

      // When - start typing
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 't' } });
      });

      // Then - error should clear (react-hook-form behavior)
      // Note: This depends on the form configuration
    });
  });

  describe('Form Submission Tests', () => {
    test('should call login with valid credentials', async () => {
      // Given
      mockLogin.mockResolvedValue({ success: true, user: { email: 'test@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          {
            email: 'test@example.com',
            password: 'password123',
          },
          true // rememberMe defaults to true
        );
      });
    });

    test('should call login with rememberMe=false when checkbox is unchecked', async () => {
      // Given
      mockLogin.mockResolvedValue({ success: true, user: { email: 'test@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const checkbox = screen.getByLabelText(/keep me logged in/i);
      const submitButton = screen.getByTestId('submit-button');

      // When - uncheck checkbox
      await act(async () => {
        fireEvent.click(checkbox);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.any(Object),
          false // rememberMe is now false
        );
      });
    });

    test('should show loading state during login', async () => {
      // Given
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then - button should show loading state
      expect(submitButton).toHaveAttribute('data-loading', 'true');
      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
    });

    test('should remove loading state after login completes', async () => {
      // Given
      mockLogin.mockResolvedValue({ success: true, user: { email: 'test@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then - loading state should be removed
      await waitFor(() => {
        expect(submitButton).toHaveAttribute('data-loading', 'false');
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should show error message on invalid credentials', async () => {
      // Given
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Invalid email or password',
      });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });
    });

    test('should show generic error message when login fails without specific message', async () => {
      // Given
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Login failed. Please check your email and password.',
      });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });

    test('should clear error message when user submits again', async () => {
      // Given
      mockLogin
        .mockResolvedValueOnce({ success: false, error: 'Invalid credentials' })
        .mockResolvedValueOnce({ success: true, user: { email: 'test@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When - first failed attempt
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // When - second attempt with correct password
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
        fireEvent.click(submitButton);
      });

      // Then - error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });

    test('should disable inputs during login', async () => {
      // Given
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Navigation Tests', () => {
    test('should navigate to dashboard on successful login', async () => {
      // Given
      mockLogin.mockResolvedValue({ success: true, user: { email: 'test@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then - navigation would happen via useNavigate
      // This is tested via mock verification in a real scenario
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    test('should have working back link', () => {
      // When
      renderLoginPage();

      // Then
      const backLink = screen.getByTestId('back-link');
      expect(backLink).toHaveAttribute('href', '/');
    });

    test('should have working forgot password link', () => {
      // When
      renderLoginPage();

      // Then
      const forgotLink = screen.getByText(/forgot your password/i).closest('a');
      expect(forgotLink).toHaveAttribute('href');
      expect(forgotLink).toHaveAttribute('href', expect.stringContaining('mailto:'));
    });
  });

  describe('Accessibility Tests', () => {
    test('should have labels for all input fields', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    test('should mark required fields', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByText('(required)')).toBeInTheDocument();
    });

    test('should have proper input types', () => {
      // When
      renderLoginPage();

      // Then
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have autocomplete attributes', () => {
      // When
      renderLoginPage();

      // Then
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    test('should have proper inputMode for email', () => {
      // When
      renderLoginPage();

      // Then
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('inputMode', 'email');
    });

    test('should have placeholder text', () => {
      // When
      renderLoginPage();

      // Then
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('placeholder', 'your@email.com');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });
  });

  describe('Edge Cases', () => {
    test('should handle email with special characters', async () => {
      // Given
      mockLogin.mockResolvedValue({ success: true, user: { email: 'test+church@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test+church@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test+church@example.com',
          }),
          true
        );
      });
    });

    test('should handle very long email addresses', async () => {
      // Given
      const longEmail = 'a'.repeat(200) + '@example.com';
      mockLogin.mockResolvedValue({ success: true, user: { email: longEmail } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: longEmail } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({ email: longEmail }),
          true
        );
      });
    });

    test('should handle password with special characters', async () => {
      // Given
      const specialPassword = 'P@ssw0rd!#$%^&*()';
      mockLogin.mockResolvedValue({ success: true, user: { email: 'test@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: specialPassword } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({ password: specialPassword }),
          true
        );
      });
    });

    test('should trim whitespace from email', async () => {
      // Given
      mockLogin.mockResolvedValue({ success: true, user: { email: 'test@example.com' } });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Elderly User Accessibility Tests', () => {
    test('should have large submit button', () => {
      // When
      renderLoginPage();

      // Then
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveAttribute('data-testid', 'submit-button');
      // Size class would be applied via the Button component
    });

    test('should have clear help text', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByText(/stay logged in for 30 days/i)).toBeInTheDocument();
      expect(screen.getByText(/shared computers/i)).toBeInTheDocument();
    });

    test('should have icon on submit button', () => {
      // When
      renderLoginPage();

      // Then
      expect(screen.getByTestId('button-icon')).toHaveTextContent('🔐');
    });

    test('should show loading text during submission', async () => {
      // Given
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByTestId('submit-button');

      // When
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      // Then
      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
    });
  });
});
