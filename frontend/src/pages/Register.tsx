import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Donor' | 'Recipient'>('Donor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, role);
      navigate('/listings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Join the community</span>
            </div>
          </div>

          <h2 className="font-display text-5xl font-extrabold text-white leading-[1.1] tracking-tight animate-fade-up-1">
            Every meal shared is a meal saved.
          </h2>

          <p className="text-white/35 text-lg leading-relaxed mt-6 animate-fade-up-2">
            Whether you're donating surplus or finding meals — every connection on CibiNet makes a real difference.
          </p>

          {/* Testimonial card */}
          <div className="mt-10 animate-fade-up-3">
            <div className="rounded-2xl border border-white/[0.06] p-5">
              <p className="text-sm text-white/50 leading-relaxed italic">
                "We used to throw away 30+ meals every weekend. Now they go to families who need them."
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <span className="text-primary-500 text-xs font-bold">K</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">Kevin's Bakery</p>
                  <p className="text-[10px] text-white/25">Active Donor</p>
                </div>
              </div>
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
              Create your account
            </h1>
            <p className="text-surface-400 mt-2 text-sm">
              Start donating or receiving food today
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
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-3">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Donor')}
                  className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    role === 'Donor'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-transparent bg-surface-100 hover:bg-surface-50'
                  }`}
                  style={role === 'Donor' ? { boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.15)' } : {}}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all ${
                    role === 'Donor' ? 'bg-surface-950' : 'bg-surface-200'
                  }`}>
                    <svg className={`w-5 h-5 ${role === 'Donor' ? 'text-primary-500' : 'text-surface-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <p className={`text-sm font-bold ${role === 'Donor' ? 'text-surface-950' : 'text-surface-600'}`}>
                    Donate
                  </p>
                  <p className="text-[11px] text-surface-400 mt-0.5">Share surplus food</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('Recipient')}
                  className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    role === 'Recipient'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-transparent bg-surface-100 hover:bg-surface-50'
                  }`}
                  style={role === 'Recipient' ? { boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.15)' } : {}}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all ${
                    role === 'Recipient' ? 'bg-surface-950' : 'bg-surface-200'
                  }`}>
                    <svg className={`w-5 h-5 ${role === 'Recipient' ? 'text-primary-500' : 'text-surface-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className={`text-sm font-bold ${role === 'Recipient' ? 'text-surface-950' : 'text-surface-600'}`}>
                    Receive
                  </p>
                  <p className="text-[11px] text-surface-400 mt-0.5">Find available meals</p>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create account
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-surface-400 mt-8 animate-fade-up-2">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-surface-950 hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
