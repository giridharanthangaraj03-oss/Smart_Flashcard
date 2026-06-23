import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useDeviceType } from '../hooks/useDeviceType';

const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-xs font-medium transition ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`;

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { deviceType } = useDeviceType();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/create', label: 'Create Flashcards' },
        { to: '/study-plan', label: 'Study Plan' },
        { to: '/profile', label: 'Profile' },
      ]
    : [
        { to: '/login', label: 'Login' },
        { to: '/signup', label: 'Signup' },
      ];

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
            SLT
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">SMART LEARNING TOOL</p>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">....Smart Flashcards....</h1>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              title={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                <nav className="flex flex-col gap-2">
                  {menuItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={navLinkClass}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-600 dark:bg-indigo-600"
                    >
                      Logout
                    </button>
                  )}
                </nav>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to light mode'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-base text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
