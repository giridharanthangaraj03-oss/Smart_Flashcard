import { useEffect, useState } from 'react';

function FlashcardFlip({
  question,
  answer,
  label = 'Flashcard',
  className = '',
  minHeight = 'min-h-[240px]',
  onFlipChange,
  answerActions = null,
}) {
  const [flipped, setFlipped] = useState(false);

  const toggleFlip = () => {
    setFlipped((prev) => {
      const next = !prev;
      if (onFlipChange) {
        onFlipChange(next);
      }
      return next;
    });
  };

  useEffect(() => {
    setFlipped(false);
    if (onFlipChange) {
      onFlipChange(false);
    }
  }, [question, answer, onFlipChange]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggleFlip}
        onKeyDown={handleKeyDown}
        className={`flashcard-scene w-full text-left ${minHeight}`}
        aria-label={flipped ? 'Show question' : 'Show answer'}
      >
        <div className={`flashcard-inner h-full ${flipped ? 'is-flipped' : ''}`}>
          <div
            className={`flashcard-face flashcard-front flex h-full flex-col justify-between rounded-3xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50 p-6 shadow-lg dark:border-indigo-900/40 dark:from-slate-900 dark:to-indigo-950/40 ${minHeight}`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">{label}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Question</p>
              <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">{question}</p>
            </div>
            <p className="mt-6 text-center text-xs font-medium text-indigo-600 dark:text-indigo-300">
              Tap to reveal answer
            </p>
          </div>

          <div
            className={`flashcard-face flashcard-back flex h-full flex-col justify-between rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900 ${minHeight}`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
                Answer
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-800 dark:text-emerald-50">{answer}</p>
            </div>
            {answerActions ? (
              <div
                className="mt-6 flex flex-wrap justify-center gap-3"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {answerActions}
              </div>
            ) : (
              <p className="mt-6 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Tap to see question
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardFlip;
