import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Real-Time Listings',
    description: 'Post surplus food instantly. Recipients discover and claim donations as they appear.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Location-Aware',
    description: 'Find available food near you with built-in proximity search and address mapping.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Safe & Verified',
    description: 'Auto-expiry ensures food safety. Every claim is tracked with full logistics info.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant Handshake',
    description: 'One-click claim with pickup or delivery options. Atomic status updates prevent conflicts.',
  },
];

const stats = [
  { value: '2,000+', label: 'Meals Redirected' },
  { value: '150+', label: 'Active Donors' },
  { value: '98%', label: 'Claim Rate' },
  { value: '<5 min', label: 'Avg. Claim Time' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="overflow-hidden bg-black">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen min-h-[100dvh] flex items-center justify-center bg-black">
        <div className="absolute inset-0 grid-pattern opacity-[0.04]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Now live &mdash; v2.0</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-extrabold text-white leading-[0.95] tracking-tight animate-fade-up-1">
            Stop wasting food.
            <br />
            <span className="text-primary-500">Start sharing it.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-lg mx-auto text-base sm:text-lg text-white/35 leading-relaxed mt-8 animate-fade-up-2">
            CibiNet connects surplus food with people who need it — in real time, near you, with full safety tracking.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 animate-fade-up-3">
            {user ? (
              <Link to={user.role === 'Admin' ? '/admin' : user.role === 'Donor' ? '/my-listings' : '/listings'} className="btn-accent !px-8 !py-3.5 !text-sm">
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-accent !px-8 !py-3.5 !text-sm">
                  Get Started — Free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-8 py-3.5 text-sm font-semibold text-white/50 transition-all duration-200 hover:text-white hover:border-white/20 active:scale-[0.98]">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-10 sm:gap-14 mt-20 pt-10 border-t border-white/[0.06] animate-fade-up-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-white/25 mt-1.5 uppercase tracking-widest font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="relative py-24 bg-surface-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-4 py-2 mb-5">
              <span className="text-[11px] font-bold text-surface-500 uppercase tracking-widest">How it works</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-surface-950 tracking-tight">
              Effortless food rescue
            </h2>
            <p className="text-surface-400 mt-4 text-lg max-w-lg mx-auto leading-relaxed">
              From posting to pickup, every step is designed to be fast, safe, and frictionless.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="card-bordered p-6 group hover:-translate-y-0.5 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-11 h-11 rounded-2xl bg-surface-950 flex items-center justify-center mb-4 text-primary-500 transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="font-display text-base font-bold text-surface-950 mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-4 py-2 mb-5">
                <span className="text-[11px] font-bold text-surface-500 uppercase tracking-widest">For donors</span>
              </div>
              <h2 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight mb-6">
                Share surplus in under a minute
              </h2>
              <div className="space-y-5">
                {[
                  { step: '01', text: 'Describe your food — type, quantity, and pickup location' },
                  { step: '02', text: 'Set an expiry window for automatic safety compliance' },
                  { step: '03', text: 'Post it — nearby recipients get notified instantly' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-display" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0e7490' }}>
                      {item.step}
                    </span>
                    <p className="text-surface-600 text-sm leading-relaxed pt-2.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-4 py-2 mb-5">
                <span className="text-[11px] font-bold text-surface-500 uppercase tracking-widest">For recipients</span>
              </div>
              <h2 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight mb-6">
                Find and claim meals nearby
              </h2>
              <div className="space-y-5">
                {[
                  { step: '01', text: 'Browse available donations listed near your location' },
                  { step: '02', text: 'Claim with one click — choose self-pickup or delivery' },
                  { step: '03', text: 'Get the pickup address and logistics details instantly' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-xl bg-surface-950 text-primary-500 flex items-center justify-center text-sm font-bold font-display">
                      {item.step}
                    </span>
                    <p className="text-surface-600 text-sm leading-relaxed pt-2.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-24 bg-black overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-[0.04]" />

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to make a<br />
            <span className="text-primary-500">difference?</span>
          </h2>
          <p className="text-white/35 mt-5 text-lg leading-relaxed">
            Join CibiNet today. Whether you have food to share or meals to find — every connection counts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/register" className="btn-accent !px-8 !py-3.5 !text-sm">
              Create Free Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-8 py-3.5 text-sm font-semibold text-white/50 transition-all duration-200 hover:text-white hover:border-white/20 active:scale-[0.98]">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
