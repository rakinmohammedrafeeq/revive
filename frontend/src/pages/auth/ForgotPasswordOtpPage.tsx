import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { otpApi } from '@/api/otpApi';
import { OtpInput } from '@/components/auth/OtpInput';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'email' | 'otp' | 'password' | 'success';

export const ForgotPasswordOtpPage: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Pre-fill email if user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.email && !email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user, email]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Requesting OTP for email:', email.trim());
      await otpApi.requestOtp({ email: email.trim() });
      console.log('OTP request successful');
      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      console.error('OTP Request Error Details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        fullError: err
      });
      
      let errorMessage = err.response?.data?.message || err.message || 'Failed to send OTP';
      
      // Add helpful context for rate limiting
      if (errorMessage.includes('Too many OTP requests')) {
        errorMessage = 'Too many OTP requests. Please wait 15 minutes and try again, or use a different email address.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await otpApi.verifyOtp({ email, otp });
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await otpApi.resetPasswordWithOtp({ email, otp, newPassword });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setLoading(true);
      setError('');
      setOtp('');
      await otpApi.requestOtp({ email });
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6 && step === 'otp') {
      handleVerifyOtp();
    }
  }, [otp]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
              {step === 'success' ? (
                <CheckCircle className="w-8 h-8 text-primary" />
              ) : step === 'password' ? (
                <Lock className="w-8 h-8 text-primary" />
              ) : (
                <Mail className="w-8 h-8 text-primary" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {step === 'email' && 'Reset Password'}
              {step === 'otp' && 'Enter Code'}
              {step === 'password' && 'New Password'}
              {step === 'success' && 'All Set!'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'otp' && `We sent a 6-digit code to ${email}`}
              {step === 'password' && 'Choose a strong password for your account'}
              {step === 'success' && 'Your password has been reset successfully'}
            </p>
          </div>

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="space-y-6">
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={loading}
                error={!!error}
              />

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <button
                onClick={() => setStep('email')}
                className="w-full px-4 py-3 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors"
              >
                Change Email
              </button>
            </div>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <p className="text-green-600 dark:text-green-400">
                  {isAuthenticated 
                    ? 'Your password has been updated successfully'
                    : 'You can now sign in with your new password'}
                </p>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="block w-full px-4 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20 text-center"
                >
                  Back to Dashboard
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20 text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          )}

          {/* Back to Login - Only show for non-authenticated users */}
          {step !== 'success' && !isAuthenticated && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
