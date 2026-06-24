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
  const [showExplanation, setShowExplanation] = useState(false);

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

  function buildExplanation(card) {
    if (!card) return { example: '', scenario: '' };

    const dedupeWords = (text) => text.replace(/\b(\w+)(\s+\1\b)+/gi, '$1');
    const normalizeText = (text) => dedupeWords(text.replace(/\s+/g, ' ').trim());

    const answerText = normalizeText(card.answer || '');
    const questionText = normalizeText(card.question || '');
    const firstSentence = normalizeText(
      (answerText || questionText).split(/(?<=[.!?])\s+/)[0].replace(/\.$/, ''),
    );

    let example = '';
    let scenario = '';

    const definitionMatch = firstSentence.match(/^\s*([A-Za-z0-9_\- ]+)\s+(?:is|are|means|refers to|defined as)\s+(.+)/i);
    const processMatch = firstSentence.match(/^\s*([A-Za-z0-9_\- ]+)\s+is the process (?:by which|of|in which)\s+(.+)/i);
    const actionMatch = firstSentence.match(/^\s*([A-Za-z0-9_\- ]+)\s+(absorbs|produces|converts|uses|stores|creates|helps|transforms|generates|processes|implements?)\s+(.+)/i);

    const lowerFirstSentence = firstSentence.charAt(0).toLowerCase() + firstSentence.slice(1);

    if (definitionMatch) {
      const subject = normalizeText(definitionMatch[1]);
      const description = normalizeText(definitionMatch[2].replace(/\.$/, ''));
      example = `For example, ${subject} can be seen when ${description.toLowerCase()} in a classroom or workplace explanation.`;
      scenario = `A practical scenario is applying ${subject.toLowerCase()} whenever you need to describe or identify ${description.toLowerCase()}.`;
    } else if (processMatch) {
      const subject = normalizeText(processMatch[1]);
      const detail = normalizeText(processMatch[2].replace(/\.$/, ''));
      example = `For example, ${subject} is used when ${detail.toLowerCase()} in a real procedure or experiment.`;
      scenario = `A practical scenario is using ${subject.toLowerCase()} to complete that process correctly.`;
    } else if (actionMatch) {
      const subject = normalizeText(actionMatch[1]);
      const verb = actionMatch[2].toLowerCase();
      const object = normalizeText(actionMatch[3].replace(/\.$/, ''));
      example = `For example, ${subject} ${verb}s ${object.toLowerCase()} while performing a real task or demonstration.`;
      scenario = `A practical scenario is using ${subject.toLowerCase()} to ${verb} ${object.toLowerCase()} to solve an actual problem.`;
    } else if (answerText) {
      if (/\b(used to|used for|helps to|enables|allows|supports)\b/i.test(firstSentence)) {
        example = `For example, ${lowerFirstSentence} during a real decision or design discussion.`;
        scenario = `A practical scenario is choosing this concept when you need to solve a real task or meet a real requirement.`;
      } else {
        example = `For example, imagine ${lowerFirstSentence} being relevant in a real situation.`;
        scenario = `A practical scenario is applying this concept to solve a practical work or study problem.`;
      }
    } else if (questionText) {
      const questionPhrase = questionText.replace(/\?$/, '').trim();
      example = `For example, picture a real situation where someone asks: ${questionPhrase}.`;
      scenario = `A practical scenario is when this question helps you understand, explain, or use the concept in real life.`;
    }

    if (!example) {
      example = 'For example, this concept applies in a real-world context.';
    }
    if (!scenario) {
      scenario = 'A practical scenario would show how this idea is used in daily life.';
    }

    return { example: normalizeText(example), scenario: normalizeText(scenario) };
  }

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
      setShowExplanation(false);
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
                  onClick={() => setShowExplanation(true)}
                  disabled={submitting}
                  className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                >
                  Not Known
                </button>
              </>
            ) : null
          }
        />
        {showExplanation ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {(() => {
              const explanation = buildExplanation(currentCard);
              return (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Real-world example</p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{explanation.example}</p>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Practical scenario</p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{explanation.scenario}</p>
                  </div>
                </>
              );
            })()}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowExplanation(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleReview('not_known')}
                disabled={submitting}
                className="ml-auto rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default ReviewFlashcardsPage;
