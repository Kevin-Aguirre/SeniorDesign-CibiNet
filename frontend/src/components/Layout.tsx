import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.notifications.unreadCount()
        .then(data => setUnreadCount(data.unread_count))
        .catch(() => {});
    } else {
      setUnreadCount(0);
    }
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLanding = location.pathname === '/';
  const isDark = (isLanding && !user) || isAuthPage;
  const landingGuest = isLanding && !user;

  return (
    <div className={`min-h-screen flex flex-col ${landingGuest ? 'bg-black' : 'bg-surface-50'}`}>
      {!isAuthPage && (
        <header className={`sticky top-0 z-50 ${
          isDark
            ? 'bg-black'
            : 'glass'
        }`}>
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className={`font-display font-bold text-3xl tracking-tight transition-colors ${
                isDark ? 'text-white' : 'text-surface-950'
              }`}>
                Cibi<span className="text-primary-500">Net</span>
              </span>
            </Link>

            {/* Right side */}
            {user ? (
              <nav className="flex items-center gap-0.5">
                {user.role === 'Recipient' && (
                  <Link
                    to="/listings"
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                      isActive('/listings')
                        ? 'bg-surface-950 text-white'
                        : 'text-surface-400 hover:text-surface-900'
                    }`}
                  >
                    Browse
                  </Link>
                )}
                {user.role === 'Donor' && (
                  <>
                    <Link
                      to="/new-listing"
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                        isActive('/new-listing')
                          ? 'bg-surface-950 text-white'
                          : 'text-surface-400 hover:text-surface-900'
                      }`}
                    >
                      Donate
                    </Link>
                    <Link
                      to="/my-listings"
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                        isActive('/my-listings')
                          ? 'bg-surface-950 text-white'
                          : 'text-surface-400 hover:text-surface-900'
                      }`}
                    >
                      My Listings
                    </Link>
                  </>
                )}
                {user.role === 'Recipient' && (
                  <Link
                    to="/my-claims"
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                      isActive('/my-claims')
                        ? 'bg-surface-950 text-white'
                        : 'text-surface-400 hover:text-surface-900'
                    }`}
                  >
                    My Claims
                  </Link>
                )}
                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                      isActive('/admin')
                        ? 'bg-surface-950 text-white'
                        : 'text-surface-400 hover:text-surface-900'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/notifications"
                  className={`relative px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                    isActive('/notifications')
                      ? 'bg-surface-950 text-white'
                      : 'text-surface-400 hover:text-surface-900'
                  }`}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-black px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="w-px h-4 bg-surface-200 mx-3" />

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-surface-950 flex items-center justify-center">
                    <span className="text-primary-500 text-[10px] font-bold">
                      {user.email ? user.email[0].toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block leading-none">
                    <p className="text-[12px] font-medium text-surface-700">{user.email || 'User'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary-700 mt-0.5">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-surface-300 hover:text-red-500 text-[12px] font-medium ml-1 transition-colors duration-200"
                  >
                    Log out
                  </button>
                </div>
              </nav>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className={`text-[13px] font-medium transition-colors duration-200 ${
                    isDark ? 'text-white/40 hover:text-white' : 'text-surface-400 hover:text-surface-900'
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-full bg-primary-500 px-5 py-2 text-[13px] font-semibold text-black transition-all duration-200 hover:bg-primary-400 active:scale-[0.97]"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </header>
      )}

      <main className={`flex-1 ${landingGuest ? 'bg-black' : ''}`}>
        <Outlet />
      </main>

      <footer className="border-t border-surface-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-[11px] text-surface-300">
            &copy; {new Date().getFullYear()} CibiNet
          </p>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-surface-300">Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
