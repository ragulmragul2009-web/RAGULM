import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    quickLoginAsDemo,
    quickLoginAsAdmin,
  } = useAuth();

  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot password state
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await register({ name, email, password, phone, address });
    setSubmitting(false);
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toastError('Please enter your email');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.auth.forgotPassword(email);
      success(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setResetStep('reset');
      }
    } catch (err: any) {
      toastError(err.message || 'Password reset request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError('New password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.auth.resetPassword({ resetToken, newPassword, email });
      success(res.message);
      openAuthModal('login');
      setResetStep('request');
    } catch (err: any) {
      toastError(err.message || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-stone-900 text-stone-100 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍹</span>
            <h2 className="text-base font-bold text-white font-display">
              {authModalMode === 'login'
                ? 'Sign In to FreshSip'
                : authModalMode === 'register'
                ? 'Create Your Account'
                : 'Reset Password'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Logins Banner */}
        <div className="bg-amber-500/10 p-3.5 border-b border-amber-500/20 text-xs text-stone-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant 1-Click Evaluation Logins:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={quickLoginAsDemo}
              className="py-1.5 px-2.5 bg-stone-800 border border-stone-700 rounded-lg text-[11px] font-semibold text-stone-200 hover:bg-stone-700 hover:text-white transition-colors shadow-2xs"
            >
              👤 Demo Customer
            </button>
            <button
              type="button"
              onClick={quickLoginAsAdmin}
              className="py-1.5 px-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-semibold hover:bg-amber-500/30 transition-colors shadow-2xs"
            >
              🛡️ Admin Account
            </button>
          </div>
        </div>

        {/* Tab Toggle for Login / Register */}
        {authModalMode !== 'forgot' && (
          <div className="flex border-b border-stone-800 text-xs font-semibold">
            <button
              onClick={() => openAuthModal('login')}
              className={`flex-1 py-2.5 text-center transition-colors ${
                authModalMode === 'login'
                  ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className={`flex-1 py-2.5 text-center transition-colors ${
                authModalMode === 'register'
                  ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Modal Form Content */}
        <div className="p-6">
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-300">Password</label>
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 mt-2 shadow-xs"
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {authModalMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Priya Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Flat / Building, Street, City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 mt-2 shadow-xs"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {authModalMode === 'forgot' && (
            <div className="space-y-4">
              {resetStep === 'request' ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Enter the email registered with FreshSip. We will verify your account and provide a reset token.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-stone-300 block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Send Reset Instructions'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3">
                  <p className="text-xs text-stone-400">
                    Verification token generated. Please enter your new password.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-stone-300 block mb-1">Reset Code</label>
                    <input
                      type="text"
                      readOnly
                      value={resetToken}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-950 border border-stone-800 font-mono text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-300 block mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs"
                  >
                    {submitting ? 'Updating...' : 'Set New Password & Sign In'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="w-full text-center text-xs text-stone-400 hover:text-white pt-2"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
