function AuthForm({
  title,
  subtitle,
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel,
  error,
  loading,
  footer,
  passwordRequirements,
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">Welcome</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {field.label}
            </span>
            {field.type === 'textarea' ? (
              <textarea
                name={field.name}
                value={values[field.name]}
                onChange={onChange}
                rows={field.rows || 4}
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950"
                required={field.required !== false}
              />
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={values[field.name]}
                onChange={onChange}
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950"
                required={field.required !== false}
              />
            )}
            {field.name === 'password' && passwordRequirements?.length ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                {passwordRequirements.map((rule) => (
                  <li
                    key={rule.id}
                    className={rule.met ? 'text-emerald-600 dark:text-emerald-400' : ''}
                  >
                    {rule.met ? '✓' : '•'} {rule.label}
                  </li>
                ))}
              </ul>
            ) : field.hint ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{field.hint}</p>
            ) : null}
          </label>
        ))}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Please wait...' : submitLabel}
        </button>
      </form>

      {footer ? <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div> : null}
    </div>
  );
}

export default AuthForm;
