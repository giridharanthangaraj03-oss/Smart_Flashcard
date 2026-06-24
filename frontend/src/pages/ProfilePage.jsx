import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFlashcardSets } from '../services/flashcardService';
import { getHealth } from '../services/statusService';

function formatNlpMode(mode) {
  if (!mode || typeof mode !== 'string') return 'Unknown';
  const normalized = mode.trim().toLowerCase();
  if (normalized === 'lightweight' || normalized === 'lightweigth') return 'Lightweight';
  if (normalized === 'full') return 'Full';
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function ProfilePage() {
  const { user } = useAuth();
  const [reviewSummary, setReviewSummary] = useState({ totalSets: 0, totalCards: 0, totalReviews: 0 });
  const [health, setHealth] = useState({ database: { status: 'unknown' }, nlpService: { status: 'unknown', mode: 'unknown', models_loaded: false } });
  const [healthError, setHealthError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await getFlashcardSets();
        const totalReviews = response.data.reduce(
          (acc, set) => acc + (set.reviewHistory?.length || 0),
          0,
        );
        setReviewSummary({
          totalSets: response.stats.totalSets,
          totalCards: response.stats.totalCards,
          totalReviews,
        });
      } catch {
        setReviewSummary({ totalSets: 0, totalCards: 0, totalReviews: 0 });
      }
    };
    loadSummary();
  }, []);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await getHealth();
        setHealth(response);
        setHealthError('');
      } catch (err) {
        const isConnectionError = !err.response || err.response.status === 0 || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK';
        const errorMessage = isConnectionError ? 'Cannot connect to backend service. Please check if the server is running.' : err.response?.data?.message || err.message || 'Health check failed';
        setHealthError(isConnectionError ? errorMessage : '');
        setHealth({ database: { status: 'unavailable' }, nlpService: { status: 'unavailable', mode: 'unknown', models_loaded: false } });
      }
    };

    void loadHealth();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">Profile</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{user?.email}</p>
        <div className="mt-8 grid gap-4">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">Member since</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">Preferred review mode</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">Weighted spaced repetition</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">Service Health</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Backend and NLP status</h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Database</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{health.database?.status || 'unknown'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">NLP mode</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatNlpMode(health.nlpService?.mode)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Models loaded</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{health.nlpService?.models_loaded ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {healthError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
            {healthError}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Study Summary</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
            <p className="text-sm text-indigo-600 dark:text-indigo-300">Sets</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{reviewSummary.totalSets}</p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-950/30">
            <p className="text-sm text-cyan-600 dark:text-cyan-300">Cards</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{reviewSummary.totalCards}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <p className="text-sm text-emerald-600 dark:text-emerald-300">Reviews</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{reviewSummary.totalReviews}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
