import React, { useState } from 'react';
import { api } from '../services/api';
import { CRA } from '../types';
import {
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  User,
  LogIn,
} from 'lucide-react';
import {
  Button,
  Input,
  PasswordInput,
  Alert,
  Badge,
} from '../components/ui';

interface Props {
  onLoginSuccess: (role?: 'admin' | 'cra', user?: CRA) => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [loginRole, setLoginRole] = useState<'CRA' | 'ADMIN'>(() =>
    window.location.pathname.startsWith('/admin') ? 'ADMIN' : 'CRA'
  );
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const handleRoleTabChange = (role: 'CRA' | 'ADMIN') => {
    setLoginRole(role);
    setError(null);
    setSuccessMessage(null);
  };

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setLoadingStep('Authenticating credentials...');

    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      if (!cleanEmail || !targetPass) {
        throw new Error('Please enter both your email address and password to log in.');
      }

      // Fast auth call that yields access_token & cached profile
      const loginRes = await api.login(cleanEmail, targetPass);
      localStorage.setItem(
        'placemein:login_timestamp',
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );

      const currentUser = loginRes.user || (await api.getCurrentCRA());

      // If user is an Admin, always verify and grant full Admin Portal privileges
      if (currentUser.role === 'admin') {
        sessionStorage.setItem('placemein:admin_verified', 'true');
        localStorage.setItem('placemein:preferred_portal', 'admin');
        onLoginSuccess('admin', currentUser);
      } else {
        // CRA employee account
        sessionStorage.removeItem('placemein:admin_verified');
        localStorage.setItem('placemein:preferred_portal', 'employee');
        onLoginSuccess('cra', currentUser);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify email and password.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      if (isForgotMode) {
        setLoading(true);
        if (resetToken.trim()) {
          await api.resetPassword(resetToken.trim(), password);
          setIsForgotMode(false);
          setResetToken('');
          setSuccessMessage('Password reset successfully. You can now log in.');
        } else {
          const result = await api.forgotPassword(email);
          setSuccessMessage(result.message);
        }
        setLoading(false);
      } else if (isRegisterMode) {
        setLoading(true);
        setLoadingStep('Registering account...');
        await api.register(name.trim(), email.trim(), password, loginRole === 'ADMIN' ? 'admin' : 'cra');
        await performLogin(email.trim(), password);
      } else {
        await performLogin(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || (isRegisterMode ? 'Registration failed' : 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#0B0F19]/95 border border-neutral-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="bg-white p-3 rounded-2xl w-fit mx-auto shadow-xl shadow-purple-600/20 border border-neutral-200 flex items-center justify-center">
            <img
              src="/placemein-logo.png"
              alt="CRM Logo"
              className="h-10 w-10 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('placemein-symbol.svg')) {
                  target.src = '/placemein-symbol.svg';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CRM</h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-normal">
              Recruitment Automation & CRA Sourcing CRM
            </p>
          </div>
        </div>

        {/* Dual Portal Selection Tabs */}
        {!isForgotMode && (
          <div className="grid grid-cols-2 gap-1.5 bg-[#0D1322] p-1 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => handleRoleTabChange('ADMIN')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                loginRole === 'ADMIN'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 border border-amber-400/40'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('CRA')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                loginRole === 'CRA'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
              }`}
            >
              <User className="h-4 w-4" />
              <span>CRA Employee</span>
            </button>
          </div>
        )}

        {/* Role Access Tag */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0D1322] border border-neutral-800 text-xs">
          <span className="flex items-center gap-2 text-neutral-300 font-medium">
            {loginRole === 'ADMIN' ? (
              <ShieldCheck className="h-4 w-4 text-amber-400" />
            ) : (
              <User className="h-4 w-4 text-purple-400" />
            )}
            <span>{loginRole === 'ADMIN' ? 'Leadership Access' : 'CRA Specialist Portal'}</span>
          </span>
          <Badge variant={loginRole === 'ADMIN' ? 'amber' : 'primary'} size="sm">
            {loginRole}
          </Badge>
        </div>

        {/* Status Alerts */}
        {error && (
          <Alert type="danger">
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert type="success">
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && !isForgotMode && (
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="e.g. Aravind Reddy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserCheck className="h-4 w-4" />}
            />
          )}

          <Input
            label={loginRole === 'ADMIN' ? 'Admin Email Address' : 'Employee Email Address'}
            type="email"
            required
            autoComplete="email"
            placeholder={loginRole === 'ADMIN' ? 'aravind@placemein.com' : 'employee@placemein.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
          />

          {!isForgotMode && (
            <PasswordInput
              label="Password"
              required
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />
          )}

          {isForgotMode && (
            <Input
              label="Reset Token (optional)"
              placeholder="Leave empty to request a reset link"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
            />
          )}

          <Button
            type="submit"
            variant={loginRole === 'ADMIN' ? 'amber' : 'primary'}
            size="lg"
            className="w-full mt-2"
            isLoading={loading}
            loadingText={loadingStep || 'Signing In...'}
            leftIcon={<LogIn className="h-4 w-4" />}
          >
            {isForgotMode
              ? resetToken
                ? 'Reset Password'
                : 'Send Recovery Email'
              : isRegisterMode
              ? `Register as ${loginRole === 'ADMIN' ? 'Admin' : 'CRA Employee'}`
              : `Sign In to ${loginRole === 'ADMIN' ? 'Admin Portal' : 'Employee Portal'}`}
          </Button>
        </form>

        {!isRegisterMode && !isForgotMode && (
          <button
            type="button"
            onClick={() => {
              setIsForgotMode(true);
              setError(null);
              setSuccessMessage(null);
            }}
            className="w-full text-xs text-neutral-400 hover:text-white transition font-medium text-center block cursor-pointer"
          >
            Forgot password? Reset password
          </button>
        )}

        <div className="text-center pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              if (isForgotMode) {
                setIsForgotMode(false);
                setResetToken('');
                setError(null);
                setSuccessMessage(null);
                return;
              }
              setIsRegisterMode(!isRegisterMode);
              setError(null);
              setSuccessMessage(null);
            }}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
          >
            {isForgotMode
              ? 'Back to login'
              : isRegisterMode
              ? 'Already registered? Login here'
              : 'Need a new account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
