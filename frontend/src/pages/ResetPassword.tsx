import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(token.trim(), newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 grid-pattern opacity-[0.04]" />
        <Link to="/" className="absolute top-6 left-8 z-20 flex items-center gap-2 group">
          <span className="font-display font-bold text-3xl tracking-tight text-white">
            Cibi<span className="text-primary-500">Net</span>
          </span>
        </Link>
        <div className="relative z-10 max-w-lg px-16">
          <h2 className="font-display text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
            Enter your new <span className="text-primary-500">password.</span>
          </h2>
          <p className="text-white/35 text-lg leading-relaxed mt-6">
            Enter and confirm a new password for your account.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 animate-fade-up">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-surface-950 flex items-center justify-center">
                <span className="text-primary-500 font-bold text-sm">C</span>
              </div>
              <span className="font-display font-bold text-lg tracking-tight">CibiNet</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-surface-950 tracking-tight">
              New password
            </h1>
            <p className="text-surface-400 mt-2 text-sm">
              Enter a new password for your account.
            </p>
          </div>

          {success ? (
            <div className="space-y-4 animate-fade-up-1">
              <div className="card-bordered px-4 py-4 text-sm text-green-700 bg-green-50 border-green-100">
                <p className="font-semibold">Password updated!</p>
                <p className="mt-1 text-green-600">Redirecting you to login in a moment…</p>
              </div>
              <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
                Sign in now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up-1">
              {error && (
                <div className="card-bordered px-4 py-3 text-sm text-red-600 bg-red-50 border-red-100 animate-scale-in">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input"
                  placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-surface-400 mt-8 animate-fade-up-2">
            Remembered it?{' '}
            <Link to="/login" className="font-semibold text-surface-950 hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
