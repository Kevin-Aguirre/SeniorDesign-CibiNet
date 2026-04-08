import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate(loggedInUser.role === 'Donor' ? '/my-listings' : '/listings');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Hero panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 grid-pattern opacity-[0.04]" />

        <Link to="/" className="absolute top-6 left-8 z-20 flex items-center gap-2 group">
          <span className="font-display font-bold text-3xl tracking-tight text-white">
            Cibi<span className="text-primary-500">Net</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-lg px-16">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Platform v2.0</span>
            </div>
          </div>

          <h2 className="font-display text-5xl font-extrabold text-white leading-[1.1] tracking-tight animate-fade-up-1">
            Connecting surplus food with <span className="text-primary-500">those who need it.</span>
          </h2>

          <p className="text-white/35 text-lg leading-relaxed mt-6 animate-fade-up-2">
            CibiNet makes food donation effortless. Post what you have, find what you need — all in real time.
          </p>

          <div className="flex items-center gap-8 mt-10 pt-8 border-t border-white/[0.06] animate-fade-up-3">
            <div>
              <p className="text-2xl font-bold text-white font-display">2k+</p>
              <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-widest font-semibold">Meals shared</p>
            </div>
            <div className="w-px h-10 bg-white/[0.06]" />
            <div>
              <p className="text-2xl font-bold text-white font-display">150+</p>
              <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-widest font-semibold">Active donors</p>
            </div>
            <div className="w-px h-10 bg-white/[0.06]" />
            <div>
              <p className="text-2xl font-bold text-white font-display">98%</p>
              <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-widest font-semibold">Claimed rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
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
              Welcome back
            </h1>
            <p className="text-surface-400 mt-2 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up-1">
            {error && (
              <div className="card-bordered px-4 py-3 text-sm text-red-600 bg-red-50 border-red-100 animate-scale-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
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
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign in
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-surface-400 mt-8 animate-fade-up-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-surface-950 hover:text-primary-700 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
