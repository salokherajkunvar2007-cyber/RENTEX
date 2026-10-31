import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { GiFarmTractor } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';
import { getNotificationsApi, markAllNotificationsReadApi } from '../api/endpoints';
import type { AppNotification } from '../types';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-canopy-800' : 'text-canopy-600 hover:text-canopy-800'
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const { data } = await getNotificationsApi();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // silently ignore - notifications are non-critical
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotifications = async () => {
    setNotifOpen((prev) => !prev);
    if (unreadCount > 0) {
      try {
        await markAllNotificationsReadApi();
        setUnreadCount(0);
      } catch {
        // ignore
      }
    }
  };

  const dashboardPath = user?.role === 'owner' ? '/owner/dashboard' : '/user/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-canopy-100 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-canopy-700 text-cream">
            <GiFarmTractor size={20} />
          </span>
          <span className="font-display text-xl font-semibold text-canopy-900">Rentex</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Find Machines
          </NavLink>
          {user && (
            <NavLink to={dashboardPath} className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
          {user?.role === 'owner' && (
            <NavLink to="/owner/machines" className={navLinkClass}>
              My Machines
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={openNotifications}
                  aria-label="Notifications"
                  className="relative rounded-full p-2 text-canopy-700 hover:bg-canopy-100"
                >
                  <FiBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-clay text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl2 border border-canopy-100 bg-white shadow-glass">
                    <div className="max-h-96 overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-canopy-500">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className="rounded-lg p-3 text-sm hover:bg-canopy-50 border-b border-canopy-50 last:border-none"
                          >
                            <p className="font-semibold text-canopy-800">{n.title}</p>
                            <p className="mt-0.5 text-canopy-600">{n.message}</p>
                            <p className="mt-1 text-xs text-canopy-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-full border border-canopy-200 px-3 py-1.5 text-sm font-medium text-canopy-700 hover:bg-canopy-50 sm:flex"
              >
                <FiUser size={16} />
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={logout}
                aria-label="Log out"
                className="rounded-full p-2 text-canopy-700 hover:bg-canopy-100"
              >
                <FiLogOut size={20} />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/login" className="btn-secondary !px-5 !py-2 text-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !px-5 !py-2 text-sm">
                Sign up
              </Link>
            </div>
          )}

          <button
            className="rounded-full p-2 text-canopy-700 hover:bg-canopy-100 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-canopy-100 bg-cream px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink to="/" onClick={() => setMenuOpen(false)} className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/search" onClick={() => setMenuOpen(false)} className={navLinkClass}>
              Find Machines
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to={dashboardPath}
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass}
                >
                  Dashboard
                </NavLink>
                {user.role === 'owner' && (
                  <NavLink
                    to="/owner/machines"
                    onClick={() => setMenuOpen(false)}
                    className={navLinkClass}
                  >
                    My Machines
                  </NavLink>
                )}
                <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                  Profile
                </NavLink>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="text-left text-sm font-medium text-clay"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  className="btn-secondary flex-1 !py-2 text-sm"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Log in
                </button>
                <button
                  className="btn-primary flex-1 !py-2 text-sm"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/register');
                  }}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
