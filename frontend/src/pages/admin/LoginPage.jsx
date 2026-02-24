/**
 * LoginPage.jsx - Admin Authentication
 * Simple, clear login form for administrators
 *
 * Accessibility Requirements:
 * - Labels above input fields
 * - "Keep me logged in" defaults to ON
 * - Clear error messages below fields
 * - Large tap targets (56px minimum for primary button)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { FormError } from '../components/common/ErrorMessage';
import { login } from '../services/authService';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true, // Default ON for busy admins
    },
  });

  const onSubmit = async (data) => {
    setLoginError(null);
    setIsLoading(true);

    const result = await login(
      {
        email: data.email,
        password: data.password,
      },
      data.rememberMe
    );

    setIsLoading(false);

    if (result.success) {
      // Redirect to dashboard on success
      navigate('/admin/dashboard', { replace: true });
    } else {
      setLoginError(result.error);
    }
  };

  return (
    <div className="login-page">
      <PageHeader
        title="Admin Login"
        subtitle="Sign in to manage your church documents"
        showBack={true}
        backTo="/"
      />

      <div className="login-form-container">
        <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required">(required)</span>
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="your@email.com"
              disabled={isLoading}
              {...register('email', {
                required: 'Please enter your email address',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.email && <FormError message={errors.email.message} />}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required">(required)</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="Enter your password"
              disabled={isLoading}
              {...register('password', {
                required: 'Please enter your password',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.password && <FormError message={errors.password.message} />}
          </div>

          {/* Remember Me - Default ON */}
          <div className="form-group form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox-input"
                disabled={isLoading}
                {...register('rememberMe')}
              />
              <span>Keep me logged in</span>
            </label>
            <p className="form-help-text">
              Stay logged in for 30 days. Uncheck for shared computers.
            </p>
          </div>

          {/* Login Error */}
          {loginError && (
            <div className="login-error-banner">
              <FormError message={loginError} />
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={isLoading}
              fullWidth
              icon={isLoading ? null : '🔐'}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>

          {/* Forgot Password Link */}
          <div className="login-forgot-password">
            <a href="mailto:support@churchshare.app?subject=Password Reset Request" className="forgot-password-link">
              Forgot your password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
