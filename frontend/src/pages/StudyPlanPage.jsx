import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCalendarMonthDays } from '../utils/generateStudyPlan';
import { loadStudyMaterial, loadStudyPlan } from '../utils/studyMaterialStorage';
import { loadLocalStudyProfile } from '../utils/studyProfileStorage';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthLabels = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const taskIcon = {
  read: '📖',
  flashcards: '🃏',
  practice: '✍️',
  review: '🔁',
  exam: '🎯',
};

function StudyPlanPage() {
  const studyProfile = loadLocalStudyProfile();
  const studyMaterial = loadStudyMaterial();
  const studyPlan = loadStudyPlan();
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const sessionsByDate = useMemo(() => {
    const map = new Map();
    (studyPlan?.sessions || []).forEach((session) => {
      map.set(session.date, session);
    });
    return map;
  }, [studyPlan]);

  const calendarDays = useMemo(
    () => getCalendarMonthDays(viewMonth.year, viewMonth.month),
    [viewMonth],
  );

  const selectedSession = selectedDate ? sessionsByDate.get(selectedDate) : null;

  const changeMonth = (offset) => {
    setViewMonth((prev) => {
      const next = new Date(prev.year, prev.month + offset, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  if (!studyPlan || !studyMaterial) {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">Study Plan</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">No study plan yet</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Upload your subject file or paste notes on the Create Flashcards page. Your study plan is created
            automatically from that material.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-block rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Go to Create Flashcards
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">Study Plan</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
          {studyPlan.subject} calendar
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Plan based on your {studyMaterial.sourceType === 'upload' ? 'uploaded file' : 'pasted notes'}
          {studyMaterial.fileName ? ` (${studyMaterial.fileName})` : ''}. Exam target:{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {new Date(studyPlan.examDate).toLocaleDateString()}
          </span>
        </p>

        {studyProfile ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {studyProfile.studyFrequency}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Goal: {studyProfile.studyGoal}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Language: {studyProfile.studyLanguage}
            </span>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            Previous
          </button>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {monthLabels[viewMonth.month]} {viewMonth.year}
          </h3>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            Next
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-20" />;
            }

            const dateKey = day.toISOString().slice(0, 10);
            const session = sessionsByDate.get(dateKey);
            const isSelected = selectedDate === dateKey;
            const isToday = dateKey === new Date().toISOString().slice(0, 10);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`min-h-20 rounded-2xl border p-2 text-left transition ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                    : session
                      ? 'border-indigo-200 bg-indigo-50/60 hover:border-indigo-400 dark:border-indigo-900/50 dark:bg-indigo-950/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isToday ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {day.getDate()}
                </span>
                {session ? (
                  <p className="mt-1 line-clamp-2 text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                    {session.isExamDay ? 'Exam day' : `Day ${session.dayNumber}`}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {selectedSession ? `Day ${selectedSession.dayNumber} plan` : 'Select a study day'}
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {selectedSession
            ? `${studyPlan.subject} • ${new Date(selectedSession.date).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}`
            : 'Click a highlighted date on the calendar to see what to study.'}
        </p>

        <div className="mt-6 space-y-4">
          {selectedSession ? (
            selectedSession.tasks.map((task, index) => (
              <div
                key={`${task.title}-${index}`}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {taskIcon[task.type] || '📌'} {task.title}
                </p>
                {task.detail ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{task.detail}</p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Study sessions are marked on the calendar. Your plan covers {studyPlan.sessions.length} days for{' '}
              <span className="font-medium text-slate-700 dark:text-slate-200">{studyPlan.subject}</span>.
            </div>
          )}
        </div>

        <Link
          to="/create"
          className="mt-6 block w-full rounded-2xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200"
        >
          Update material & regenerate plan
        </Link>
      </aside>
    </div>
  );
}

export default StudyPlanPage;
