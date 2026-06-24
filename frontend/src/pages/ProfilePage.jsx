import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFlashcardSets } from '../services/flashcardService';
import api from '../services/api';

function ProfilePage() {
  const { user } = useAuth();
  const [reviewSummary, setReviewSummary] = useState({ totalSets: 0, totalCards: 0, totalReviews: 0 });
  const [serviceHealth, setServiceHealth] = useState({ status: 'unknown', nlp: 'unknown', database: 'unknown', metrics: null });

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
    const loadServiceHealth = async () => {
      try {
        const response = await api.get('/api/health');
        const data = response.data;
        setServiceHealth({
          status: data.status === 'ok' ? 'healthy' : 'unhealthy',
          nlp: data.nlp?.status || 'unknown',
          database: data.database?.status || 'unknown',
          metrics: data,
        });
      } catch {
        setServiceHealth({ status: 'offline', nlp: 'offline', database: 'offline', metrics: null });
      }
    };
    loadServiceHealth();
    // Refresh health status every 30 seconds
    const interval = setInterval(loadServiceHealth, 30000);
    return () => clearInterval(interval);
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Service Health</h3>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Overall Status</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white capitalize">{serviceHealth.status}</p>
            </div>
            <div className={`h-4 w-4 rounded-full ${serviceHealth.status === 'healthy' ? 'bg-emerald-500' : serviceHealth.status === 'unhealthy' ? 'bg-amber-500' : 'bg-slate-400'}`} />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">NLP Service</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white capitalize">{serviceHealth.nlp}</p>
            </div>
            <div className={`h-4 w-4 rounded-full ${serviceHealth.nlp === 'ok' ? 'bg-emerald-500' : serviceHealth.nlp === 'degraded' ? 'bg-amber-500' : 'bg-slate-400'}`} />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Database</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white capitalize">{serviceHealth.database}</p>
            </div>
            <div className={`h-4 w-4 rounded-full ${serviceHealth.database === 'ok' ? 'bg-emerald-500' : serviceHealth.database === 'degraded' ? 'bg-amber-500' : 'bg-slate-400'}`} />
          </div>
          {serviceHealth.metrics?.nlp?.memory_mb && (
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">NLP Service Memory</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{serviceHealth.metrics.nlp.memory_mb.toFixed(1)} MB</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
