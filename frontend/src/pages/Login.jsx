import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  // Real-time form validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });

    // Check if there are any validation errors
    const hasErrors = Object.keys(errors).some(key => key !== 'success');
    if (hasErrors || !formData.email || !formData.password) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Create FormData to match your backend's OAuth2PasswordRequestForm
      const loginFormData = new FormData();
      loginFormData.append('username', formData.email); // OAuth2 expects 'username'
      loginFormData.append('password', formData.password);

      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        body: loginFormData, // Send as FormData, not JSON
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Store token
        localStorage.setItem('token', data.access_token);
        
        // Show success message briefly before redirect
        setErrors({ success: 'Login successful! Redirecting...' });
        
        setTimeout(() => {
          navigate('/');
        }, 1000);
        
      } else {
        // Handle different error types based on your backend
        if (response.status === 401) {
          setErrors({ general: 'Invalid email or password' });
        } else if (response.status === 503) {
          setErrors({ general: 'Service temporarily unavailable. Please try again.' });
        } else {
          setErrors({ general: data.detail || 'Login failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your News Analyzer account</p>
        </div>
        
        {errors.general && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {errors.general}
          </div>
        )}
        
        {errors.success && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {errors.success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={(e) => validateField('email', e.target.value)}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
              required
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={(e) => validateField('password', e.target.value)}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    // Eye off icon
                    <>
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </>
                  ) : (
                    // Eye icon
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          
          <button 
            type="submit" 
            className="auth-btn"
            disabled={isLoading || Object.keys(errors).some(key => key !== 'success')}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account? 
            <Link to="/register" className="auth-link-primary">
              Sign up here
            </Link>
          </p>
          <p>
            <Link to="/home" className="auth-link-secondary">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
