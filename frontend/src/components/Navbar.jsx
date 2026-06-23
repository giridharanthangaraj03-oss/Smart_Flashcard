import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useDeviceType } from '../hooks/useDeviceType';
import { useLanguage } from '../context/LanguageContext';

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
  const [isLanguageSubmenuOpen, setIsLanguageSubmenuOpen] = useState(false);
  const navigate = useNavigate();

  const { t, lang, setLang } = useLanguage();

  const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'ta', label: 'Tamil' },
    { code: 'hi', label: 'Hindi' },
    { code: 'es', label: 'Spanish' },
    { code: 'de', label: 'German' },
    { code: 'te', label: 'Telugu' },
    { code: 'ml', label: 'Malayalam' },
  ];

  const menuItems = isAuthenticated
    ? [
        { to: '/dashboard', label: t('dashboard') },
        { to: '/create', label: t('createFlashcards') },
        { to: '/study-plan', label: t('studyPlan') },
        { to: '/profile', label: t('profile') },
      ]
    : [
        { to: '/login', label: t('login') },
        { to: '/signup', label: t('signup') },
      ];

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsLanguageSubmenuOpen(false);
  };
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
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">{t('smartLearningTool')}</p>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('appTitle')}</h1>
          </div>
        </Link>

          <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? t('closeMenu') : t('openMenu')}
                title={isMenuOpen ? t('closeMenu') : t('openMenu')}
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
                  <div className="border-t my-2" />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsLanguageSubmenuOpen((prev) => !prev)}
                      className="block w-full rounded-full border px-3 py-1.5 text-left text-xs font-medium transition text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      {t('language')} {isLanguageSubmenuOpen ? '▼' : '▶'}
                    </button>
                    {isLanguageSubmenuOpen && (
                      <div className="mt-1 ml-2 border-l-2 border-slate-300 dark:border-slate-700 pl-2 space-y-1">
                        {languageOptions.map((lng) => (
                          <button
                            key={lng.code}
                            type="button"
                            onClick={() => {
                              setLang(lng.code);
                              setIsLanguageSubmenuOpen(false);
                              closeMenu();
                            }}
                            className={`block w-full text-left rounded-full px-3 py-1.5 text-xs transition ${
                              lang === lng.code
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                          >
                            {lng.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {isAuthenticated && (
                    <>
                      <div className="border-t my-2" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-600 dark:bg-indigo-600 w-full"
                      >
                        {t('logout')}
                      </button>
                    </>
                  )}
                </nav>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}
              title={theme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-base text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
            >
              {theme === 'dark' ? '☀' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
