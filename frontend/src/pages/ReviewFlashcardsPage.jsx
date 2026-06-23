import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFlashcardSet } from '../services/flashcardService';
import { updateReview } from '../services/reviewService';
import FlashcardFlip from '../components/FlashcardFlip';

function ReviewCompleteScreen({ setName, sessionStats }) {
  const reviewed = sessionStats.known + sessionStats.notKnown;
  const scorePercent = reviewed > 0 ? Math.round((sessionStats.known / reviewed) * 100) : 0;

  const message =
    scorePercent >= 80
      ? 'Excellent work! You know most of this set.'
      : scorePercent >= 50
        ? 'Good effort. Review the not known cards again soon.'
        : 'Keep practicing. Focus on the cards you marked as not known.';

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">Session Complete</p>
      <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Your Review Score</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">{setName}</p>

      <div className="mx-auto mt-8 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/30">
        <div>
          <p className="text-4xl font-bold">{scorePercent}%</p>
          <p className="text-sm text-indigo-100">Score</p>
        </div>
      </div>

      <p className="mt-6 text-base text-slate-600 dark:text-slate-300">{message}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Reviewed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{reviewed}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-600 dark:text-emerald-300">Known</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{sessionStats.known}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/30">
          <p className="text-sm text-rose-600 dark:text-rose-300">Not Known</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{sessionStats.notKnown}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/dashboard"
          className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Back to Dashboard
        </Link>
        <Link
          to="/create"
          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
        >
          Create New Set
        </Link>
      </div>
    </div>
  );
}

function ReviewFlashcardsPage() {
  const { setId } = useParams();
  const [setData, setSetData] = useState(null);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ known: 0, notKnown: 0, total: 0 });
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  useEffect(() => {
    const fetchSet = async () => {
      try {
        setLoading(true);
        const response = await getFlashcardSet(setId);
        const reviewQueue = response.reviewQueue || [];
        setSetData(response.data);
        setQueue(reviewQueue);
        setSessionStats({ known: 0, notKnown: 0, total: reviewQueue.length });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load review set');
      } finally {
        setLoading(false);
      }
    };

    fetchSet();
  }, [setId]);

  const currentCard = useMemo(() => queue[index] || null, [queue, index]);
  const reviewedCount = sessionStats.known + sessionStats.notKnown;
  const progressPercent = sessionStats.total > 0 ? Math.round((reviewedCount / sessionStats.total) * 100) : 0;

  const handleReview = async (result) => {
    if (!currentCard) return;
    try {
      setSubmitting(true);
      await updateReview(currentCard._id, { result, setId });
      setSessionStats((prev) => ({
        ...prev,
        known: result === 'known' ? prev.known + 1 : prev.known,
        notKnown: result === 'not_known' ? prev.notKnown + 1 : prev.notKnown,
      }));
      setQueue((prev) => prev.filter((_, cardIndex) => cardIndex !== index));
      setIndex(0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">Loading review deck...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>;
  }

  if (!currentCard) {
    return <ReviewCompleteScreen setName={setData?.setName} sessionStats={sessionStats} />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">Review Session</p>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{setData?.setName}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Card {reviewedCount + 1} of {sessionStats.total} • Known {sessionStats.known} • Not Known {sessionStats.notKnown}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <section className="mx-auto max-w-2xl">
        <FlashcardFlip
          key={currentCard._id}
          label={`Card ${reviewedCount + 1} of ${sessionStats.total}`}
          question={currentCard.question}
          answer={currentCard.answer}
          minHeight="min-h-[320px]"
          onFlipChange={setIsAnswerVisible}
          answerActions={
            isAnswerVisible ? (
              <>
                <button
                  type="button"
                  onClick={() => handleReview('known')}
                  disabled={submitting}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  Known
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('not_known')}
                  disabled={submitting}
                  className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                >
                  Not Known
                </button>
              </>
            ) : null
          }
        />
      </section>
    </div>
  );
}

export default ReviewFlashcardsPage;
