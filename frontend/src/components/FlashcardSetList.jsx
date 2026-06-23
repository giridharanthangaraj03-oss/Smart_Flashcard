import { Link } from 'react-router-dom';

function FlashcardSetList({ sets, onDelete, onExport, deletingId }) {
  if (!sets.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        No flashcard sets yet. Generate your first set from study notes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sets.map((set) => (
        <div
          key={set._id}
          className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{set.setName}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Created {new Date(set.createdAt).toLocaleDateString()} • {set.flashcards.length} cards
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/review/${set._id}`}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Review
            </Link>
            <button
              type="button"
              onClick={() => onExport(set)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => onDelete(set._id)}
              disabled={deletingId === set._id}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
            >
              {deletingId === set._id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FlashcardSetList;
