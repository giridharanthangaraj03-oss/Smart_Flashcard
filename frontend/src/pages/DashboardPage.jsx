import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FlashcardSetList from '../components/FlashcardSetList';
import ProgressChart from '../components/ProgressChart';
import StatsCards from '../components/StatsCards';
import { deleteFlashcardSet, getFlashcardSets } from '../services/flashcardService';
import { getHealth } from '../services/statusService';
import { exportFlashcardSetToPdf } from '../utils/exportPdf';
import { loadLocalStudyProfile } from '../utils/studyProfileStorage';

function buildReviewTrend(sets) {
  const counts = new Map();

  sets.forEach((set) => {
    (set.reviewHistory || []).forEach((entry) => {
      const date = new Date(entry.reviewedAt).toLocaleDateString();
      counts.set(date, (counts.get(date) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);
}

function formatNlpMode(mode) {
  if (!mode || typeof mode !== 'string') {
    return 'Unknown';
  }

  const normalized = mode.trim().toLowerCase();
  if (normalized === 'lightweight' || normalized === 'lightweigth') {
    return 'Lightweight';
  }
  if (normalized === 'full') {
    return 'Full';
  }
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function DashboardPage() {
  const studyProfile = loadLocalStudyProfile();
  const [sets, setSets] = useState([]);
  const [stats, setStats] = useState({ totalSets: 0, totalCards: 0, knownCards: 0, notKnownCards: 0 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState({ database: { status: 'unknown' }, nlpService: { status: 'unknown', mode: 'unknown', models_loaded: false } });
  const [healthError, setHealthError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const fetchSets = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await getFlashcardSets(params);
      setSets(response.data);
      setStats(response.stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadSets = async () => {
      await fetchSets({ search, sort });
    };

    void loadSets();
  }, [fetchSets, search, sort]);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await getHealth();
        setHealth(response);
        // Only show error if there's an actual error, not just degraded status
        setHealthError('');
      } catch (err) {
        // Only show error if it's a connection error, not a degraded service
        const isConnectionError = !err.response || err.response.status === 0 || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK';
        const errorMessage = isConnectionError 
          ? 'Cannot connect to backend service. Please check if the server is running.'
          : err.response?.data?.message || err.message || 'Health check failed';
        setHealthError(isConnectionError ? errorMessage : '');
        setHealth({ database: { status: 'unavailable' }, nlpService: { status: 'unavailable', mode: 'unknown', models_loaded: false } });
      }
    };

    void loadHealth();
  }, []);

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteFlashcardSet(id);
      await fetchSets({ search, sort });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setDeletingId('');
    }
  };

  const reviewTrend = useMemo(() => buildReviewTrend(sets), [sets]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 p-6 text-white shadow-xl shadow-indigo-950/20">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-100">Dashboard</p>
        <h2 className="mt-3 text-3xl font-bold">Track sets, progress, and daily review momentum</h2>
        <p className="mt-2 max-w-3xl text-indigo-50/90">
          Review due cards first, monitor mastery, and keep your study material organized in one place.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">Service Health</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Backend and NLP status</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${health.database?.status === 'connected' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'}`}>
              DB: {health.database?.status || 'unknown'}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${health.nlpService?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : health.nlpService?.status === 'degraded' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'}`}>
              NLP: {health.nlpService?.status || 'unknown'}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Health check</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {healthError ? 'Unavailable' : 'Active'}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">NLP mode</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {formatNlpMode(health.nlpService?.mode)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Models loaded</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {health.nlpService?.models_loaded ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {healthError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
            {healthError}
          </div>
        ) : null}
      </section>

      {studyProfile ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">Study Preferences</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {studyProfile.displayName || 'Your setup'}
              </h3>
            </div>
            <Link
              to="/study-setup?edit=true"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
            >
              Edit Details
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Institution</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {studyProfile.institutionName
                  ? `${studyProfile.institutionName} (${studyProfile.institutionType})`
                  : studyProfile.institutionType || 'Not set'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Course / Subject</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {studyProfile.focusSubject || 'Not set'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Study Goal</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {studyProfile.studyGoal || 'Not set'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Language</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {studyProfile.studyLanguage || 'Not set'}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <StatsCards stats={stats} />

      <ProgressChart stats={stats} history={reviewTrend} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Flashcard Sets</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search your saved sets, sort them, review them, or export them to PDF.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by set name"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading flashcard sets...
            </div>
          ) : (
            <FlashcardSetList
              sets={sets}
              deletingId={deletingId}
              onDelete={handleDelete}
              onExport={exportFlashcardSetToPdf}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
