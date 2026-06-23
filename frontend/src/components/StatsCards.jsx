function StatsCards({ stats }) {
  const items = [
    { label: 'Total Sets', value: stats?.totalSets ?? 0, accent: 'from-indigo-500 to-violet-500' },
    { label: 'Total Flashcards', value: stats?.totalCards ?? 0, accent: 'from-cyan-500 to-sky-500' },
    { label: 'Known Cards', value: stats?.knownCards ?? 0, accent: 'from-emerald-500 to-green-500' },
    { label: 'Not Known Cards', value: stats?.notKnownCards ?? 0, accent: 'from-rose-500 to-orange-500' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className={`mb-4 h-2 rounded-full bg-gradient-to-r ${item.accent}`} />
          <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
