import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  degrees,
  examDateOptions,
  getCoursesForProfile,
  getInstitutionNamePlaceholder,
  getInstitutionNameStepTitle,
  institutionTypes,
  schoolStandards,
  studyFrequencies,
  studyGoals,
  studyLanguages,
} from '../data/studyOptions';
import { useAuth } from '../hooks/useAuth';
import { saveStudyProfile } from '../services/studyProfileService';
import { saveLocalStudyProfile } from '../utils/studyProfileStorage';
import { syncAndCheckOnboarding } from '../utils/syncStudyProfile';

const initialForm = {
  displayName: '',
  institutionType: '',
  institutionName: '',
  standard: '',
  degree: '',
  studyGoal: '',
  studyGoalOther: '',
  studyFrequency: '',
  focusSubject: '',
  examDateOption: '',
  examDate: '',
  studyLanguage: '',
  studyLanguageOther: '',
};

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950';

function StudyOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const isEditMode = searchParams.get('edit') === 'true';

  const buildFormFromProfile = (profile) => {
    if (!profile) return initialForm;

    const normalizedStudyGoal = studyGoals.includes(profile.studyGoal) ? profile.studyGoal : 'Others';
    const normalizedStudyLanguage = studyLanguages.includes(profile.studyLanguage)
      ? profile.studyLanguage
      : 'Other';

    return {
      displayName: profile.displayName || '',
      institutionType: profile.institutionType || '',
      institutionName: profile.institutionName || '',
      standard: profile.standard || '',
      degree: profile.degree || '',
      studyGoal: normalizedStudyGoal || '',
      studyGoalOther: normalizedStudyGoal === 'Others' ? profile.studyGoal || '' : '',
      studyFrequency: profile.studyFrequency || '',
      focusSubject: profile.focusSubject || '',
      examDateOption: profile.examDateOption || '',
      examDate: profile.examDate || '',
      studyLanguage: normalizedStudyLanguage || '',
      studyLanguageOther: normalizedStudyLanguage === 'Other' ? profile.studyLanguage || '' : '',
    };
  };

  useEffect(() => {
    const redirectIfComplete = async () => {
      const { complete, profile } = await syncAndCheckOnboarding();

      if (complete && !isEditMode) {
        navigate('/create', { replace: true });
        return;
      }

      if (profile) {
        setForm(buildFormFromProfile(profile));
      }

      setCheckingExisting(false);
    };

    void redirectIfComplete();
  }, [isEditMode, navigate]);

  const displayName = form.displayName || user?.name || '';

  const courses = useMemo(
    () => getCoursesForProfile(form.institutionType, form.standard, form.degree),
    [form.institutionType, form.standard, form.degree],
  );

  const steps = useMemo(() => {
    const list = [
      {
        title: 'Your name',
        description: 'Tell us what we should call you during your study journey.',
        fields: ['displayName'],
      },
      {
        title: 'Where do you study?',
        description: 'Choose school, college, or university.',
        fields: ['institutionType'],
      },
    ];

    if (form.institutionType) {
      list.push({
        title: getInstitutionNameStepTitle(form.institutionType),
        description: `Enter the name of your ${form.institutionType.toLowerCase()}.`,
        fields: ['institutionName'],
      });
    }

    if (form.institutionType === 'School') {
      list.push({
        title: 'Which standard are you in?',
        description: 'Select your current class or grade.',
        fields: ['standard'],
      });
    }

    if (form.institutionType === 'College' || form.institutionType === 'University') {
      list.push({
        title: 'Which degree are you pursuing?',
        description: 'This helps us suggest the right courses for you.',
        fields: ['degree'],
      });
    }

    list.push(
      {
        title: 'Your courses',
        description: 'Pick the course list that matches your study path.',
        fields: ['focusSubject'],
      },
      {
        title: 'What do you want to achieve?',
        description: 'What is your main goal with this study material?',
        fields: ['studyGoal', 'studyGoalOther'],
      },
      {
        title: 'How often do you want to study?',
        description: 'Choose a study rhythm that fits your schedule.',
        fields: ['studyFrequency'],
      },
      {
        title: 'Which subject will you focus on first?',
        description: 'Select the subject you want to start with.',
        fields: ['focusSubject'],
      },
      {
        title: 'Upcoming exam or study end date',
        description: 'Tell us when you want to be ready.',
        fields: ['examDateOption', 'examDate'],
      },
      {
        title: 'Study language',
        description: 'Which language do you want to study in?',
        fields: ['studyLanguage', 'studyLanguageOther'],
      },
    );

    return list;
  }, [form.institutionType]);

  const totalSteps = steps.length;
  const currentStep = steps[step];

  const updateField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'institutionType') {
        next.standard = '';
        next.degree = '';
        next.institutionName = '';
        next.focusSubject = '';
      }
      if (name === 'standard' || name === 'degree') {
        next.focusSubject = '';
      }
      if (name === 'studyGoal' && value !== 'Others') {
        next.studyGoalOther = '';
      }
      if (name === 'studyLanguage' && value !== 'Other') {
        next.studyLanguageOther = '';
      }
      if (name === 'examDateOption' && value !== 'custom') {
        next.examDate = '';
      }
      return next;
    });
  };

  const validateStep = () => {
    if (currentStep.fields?.includes('institutionName') && !form.institutionName.trim()) {
      return `Please enter your ${form.institutionType.toLowerCase()} name.`;
    }

    switch (currentStep.title) {
      case 'Your name':
        if (!displayName.trim()) return 'Please enter your name.';
        break;
      case 'Where do you study?':
        if (!form.institutionType) return 'Please select school, college, or university.';
        break;
      case 'Which standard are you in?':
        if (!form.standard) return 'Please select your standard.';
        break;
      case 'Which degree are you pursuing?':
        if (!form.degree) return 'Please select your degree.';
        break;
      case 'Your courses':
        if (!courses.length) return 'Please complete the previous education details first.';
        break;
      case 'What do you want to achieve?':
        if (!form.studyGoal) return 'Please select your study goal.';
        if (form.studyGoal === 'Others' && !form.studyGoalOther.trim()) {
          return 'Please describe your study goal.';
        }
        break;
      case 'How often do you want to study?':
        if (!form.studyFrequency) return 'Please select how often you want to study.';
        break;
      case 'Which subject will you focus on first?':
        if (!form.focusSubject) return 'Please select a subject to focus on first.';
        break;
      case 'Upcoming exam or study end date':
        if (!form.examDateOption) return 'Please select an exam timeline.';
        if (form.examDateOption === 'custom' && !form.examDate) {
          return 'Please choose the exact date.';
        }
        break;
      case 'Study language':
        if (!form.studyLanguage) return 'Please select a study language.';
        if (form.studyLanguage === 'Other' && !form.studyLanguageOther.trim()) {
          return 'Please enter your preferred language.';
        }
        break;
      default:
        break;
    }
    return '';
  };

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const goBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }

    const payload = {
      displayName: displayName.trim(),
      institutionType: form.institutionType,
      institutionName: form.institutionName.trim(),
      standard: form.institutionType === 'School' ? form.standard : '',
      degree: form.institutionType !== 'School' ? form.degree : '',
      studyGoal: form.studyGoal === 'Others' ? form.studyGoalOther.trim() : form.studyGoal,
      studyFrequency: form.studyFrequency,
      focusSubject: form.focusSubject,
      examDateOption: form.examDateOption,
      examDate: form.examDateOption === 'custom' ? form.examDate : '',
      studyLanguage: form.studyLanguage === 'Other' ? form.studyLanguageOther.trim() : form.studyLanguage,
      onboardingCompleted: true,
    };

    setLoading(true);
    setError('');

    try {
      saveLocalStudyProfile(payload);
      await saveStudyProfile(payload);
      navigate(isEditMode ? '/dashboard' : '/create', { replace: true });
    } catch {
      saveLocalStudyProfile(payload);
      navigate(isEditMode ? '/dashboard' : '/create', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep.fields?.includes('institutionName')) {
      return (
        <input
          type="text"
          value={form.institutionName}
          onChange={(e) => updateField('institutionName', e.target.value)}
          placeholder={getInstitutionNamePlaceholder(form.institutionType)}
          className={inputClass}
        />
      );
    }

    switch (currentStep.title) {
      case 'Your name':
        return (
          <input
            type="text"
            value={displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
            placeholder="Enter your name"
            className={inputClass}
          />
        );

      case 'Where do you study?':
        return (
          <div className="grid gap-3 sm:grid-cols-3">
            {institutionTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('institutionType', type)}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                  form.institutionType === type
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        );

      case 'Which standard are you in?':
        return (
          <select value={form.standard} onChange={(e) => updateField('standard', e.target.value)} className={inputClass}>
            <option value="">Select standard</option>
            {schoolStandards.map((standard) => (
              <option key={standard} value={standard}>
                {standard}
              </option>
            ))}
          </select>
        );

      case 'Which degree are you pursuing?':
        return (
          <select value={form.degree} onChange={(e) => updateField('degree', e.target.value)} className={inputClass}>
            <option value="">Select degree</option>
            {degrees.map((degree) => (
              <option key={degree} value={degree}>
                {degree}
              </option>
            ))}
          </select>
        );

      case 'Your courses':
        return (
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <span
                key={course}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                {course}
              </span>
            ))}
          </div>
        );

      case 'What do you want to achieve?':
        return (
          <div className="space-y-3">
            {studyGoals.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => updateField('studyGoal', goal)}
                className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  form.studyGoal === goal
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {goal}
              </button>
            ))}
            {form.studyGoal === 'Others' ? (
              <input
                type="text"
                value={form.studyGoalOther}
                onChange={(e) => updateField('studyGoalOther', e.target.value)}
                placeholder="Describe your goal"
                className={inputClass}
              />
            ) : null}
          </div>
        );

      case 'How often do you want to study?':
        return (
          <div className="space-y-3">
            {studyFrequencies.map((frequency) => (
              <button
                key={frequency}
                type="button"
                onClick={() => updateField('studyFrequency', frequency)}
                className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  form.studyFrequency === frequency
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {frequency}
              </button>
            ))}
          </div>
        );

      case 'Which subject will you focus on first?':
        return (
          <select
            value={form.focusSubject}
            onChange={(e) => updateField('focusSubject', e.target.value)}
            className={inputClass}
          >
            <option value="">Select subject</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        );

      case 'Upcoming exam or study end date':
        return (
          <div className="space-y-3">
            {examDateOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('examDateOption', option.value)}
                className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  form.examDateOption === option.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
            {form.examDateOption === 'custom' ? (
              <input
                type="date"
                value={form.examDate}
                onChange={(e) => updateField('examDate', e.target.value)}
                className={inputClass}
              />
            ) : null}
          </div>
        );

      case 'Study language':
        return (
          <div className="space-y-3">
            <select
              value={form.studyLanguage}
              onChange={(e) => updateField('studyLanguage', e.target.value)}
              className={inputClass}
            >
              <option value="">Select language</option>
              {studyLanguages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            {form.studyLanguage === 'Other' ? (
              <input
                type="text"
                value={form.studyLanguageOther}
                onChange={(e) => updateField('studyLanguageOther', e.target.value)}
                placeholder="Enter your language"
                className={inputClass}
              />
            ) : null}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {checkingExisting ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
            Loading your study profile...
          </div>
        </div>
      ) : (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">
          {isEditMode ? 'Edit Study Preferences' : 'Study Setup'}
        </p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{currentStep.title}</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{currentStep.description}</p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Step {step + 1} of {totalSteps}
        </p>

        <div className="mt-8 space-y-4">{renderStepContent()}</div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Back
            </button>
          ) : null}

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Saving...' : isEditMode ? 'Save Preferences' : 'Continue to Create Flashcards'}
            </button>
          )}
        </div>
      </section>
      )}
    </div>
  );
}

export default StudyOnboardingPage;
