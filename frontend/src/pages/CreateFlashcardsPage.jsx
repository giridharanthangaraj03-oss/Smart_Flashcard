import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { generateFlashcardSet } from '../services/flashcardService';
import { saveStudyProfile } from '../services/studyProfileService';
import { generateStudyPlan } from '../utils/generateStudyPlan';
import { saveStudyMaterial, saveStudyPlan } from '../utils/studyMaterialStorage';
import { getErrorMessage } from '../utils/getErrorMessage';
import { loadLocalStudyProfile, saveLocalStudyProfile } from '../utils/studyProfileStorage';

const studyNotesPlaceholder =
  'Enter your study notes here. you can write or paste the content in text format.';

const acceptedFileTypes = '.txt,.pdf,.doc,.docx,application/pdf';
const MIN_STUDY_NOTES_LENGTH = 3;
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950';

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(new Error('Failed to read the uploaded file'));
    reader.readAsText(file);
  });
}

function buildProfileState(savedProfile) {
  return {
    institutionType: savedProfile?.institutionType || '',
    standard: savedProfile?.standard || '',
    degree: savedProfile?.degree || '',
    focusSubject: savedProfile?.focusSubject || '',
    studyLanguage: savedProfile?.studyLanguage || '',
    studyLanguageOther: '',
  };
}

function CreateFlashcardsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const savedProfile = loadLocalStudyProfile();
  const [inputMode, setInputMode] = useState('upload');
  const [profile, setProfile] = useState(() => buildProfileState(savedProfile));
  const [form, setForm] = useState({
    setName: savedProfile?.focusSubject || '',
    studyNotes: '',
  });
  const [maxCards, setMaxCards] = useState(5);
  const [subjectFile, setSubjectFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState([]);
  const [generatedSetId, setGeneratedSetId] = useState('');
  const [error, setError] = useState('');
  const [planMessage, setPlanMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const subjectLabel = profile.focusSubject || 'your subject';
  const hasPasteMaterial = inputMode === 'paste' && form.studyNotes.trim().length >= MIN_STUDY_NOTES_LENGTH;

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const persistProfile = async () => {
    const payload = {
      displayName: savedProfile?.displayName || '',
      institutionType: profile.institutionType,
      standard: profile.institutionType === 'School' ? profile.standard : '',
      degree: profile.institutionType !== 'School' ? profile.degree : '',
      studyGoal: savedProfile?.studyGoal || '',
      studyFrequency: savedProfile?.studyFrequency || '',
      focusSubject: profile.focusSubject,
      examDateOption: savedProfile?.examDateOption || '',
      examDate: savedProfile?.examDate || '',
      studyLanguage:
        profile.studyLanguage === 'Other' ? profile.studyLanguageOther.trim() : profile.studyLanguage,
      onboardingCompleted: true,
    };

    saveLocalStudyProfile({ ...savedProfile, ...payload });
    try {
      await saveStudyProfile(payload);
    } catch {
      // Keep local copy even if API save fails.
    }
    return payload;
  };

  const switchToPaste = () => {
    setError('');
    setPlanMessage('');
    setInputMode('paste');
  };

  const switchToUpload = () => {
    setError('');
    setPlanMessage('');
    setInputMode('upload');
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setPlanMessage('');

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum upload size is ${MAX_FILE_SIZE_MB} MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSubjectFile(file);
    setFileName(file.name);
    setInputMode('upload');

    if (!form.setName) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setForm((prev) => ({ ...prev, setName: baseName }));
    }

    let materialText = '';

    if (file.name.toLowerCase().endsWith('.txt')) {
      try {
        materialText = await readTextFile(file);
        setForm((prev) => ({ ...prev, studyNotes: materialText }));
      } catch {
        setError('Could not preview this text file, but it can still be uploaded for generation.');
      }
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
      materialText = `PDF uploaded: ${file.name}. Text will be extracted on the server before flashcard generation.`;
      setForm((prev) => ({ ...prev, studyNotes: materialText }));
    } else {
      materialText = `Content will be extracted from uploaded file: ${file.name}`;
      setForm((prev) => ({ ...prev, studyNotes: materialText }));
    }

    const setName = form.setName || file.name.replace(/\.[^/.]+$/, '');
    autoCreateStudyPlan({
      subject: profile.focusSubject || setName || 'General Studies',
      setName: setName || profile.focusSubject || 'Flashcard Set',
      materialText: materialText || `Content will be extracted from uploaded file: ${file.name}`,
      sourceType: 'upload',
      fileName: file.name,
      contentLength: materialText.length,
    });
  };

  useEffect(() => {
    if (inputMode !== 'paste') return undefined;

    const notes = form.studyNotes.trim();
    if (notes.length < MIN_STUDY_NOTES_LENGTH) return undefined;

    const timer = setTimeout(() => {
      autoCreateStudyPlan({
        subject: profile.focusSubject || form.setName.trim() || 'General Studies',
        setName: form.setName.trim() || profile.focusSubject || 'Flashcard Set',
        materialText: notes,
        sourceType: 'paste',
        fileName: '',
        contentLength: notes.length,
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [form.studyNotes, form.setName, inputMode, profile.focusSubject]);

  const clearSelectedFile = () => {
    setSubjectFile(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (inputMode === 'upload') {
      setForm((prev) => ({ ...prev, studyNotes: '' }));
    }
  };

  const buildMaterialPayload = () => {
    const sourceType = inputMode === 'upload' && subjectFile ? 'upload' : 'paste';
    const materialText =
      sourceType === 'upload'
        ? form.studyNotes || `Content will be extracted from uploaded file: ${fileName}`
        : form.studyNotes;

    return {
      subject: profile.focusSubject || form.setName.trim() || 'General Studies',
      setName: form.setName.trim() || profile.focusSubject || 'Flashcard Set',
      materialText,
      sourceType,
      fileName: fileName || '',
      contentLength: materialText.length,
    };
  };

  const buildStudyProfileForPlan = (savedPayload) => ({
    ...savedProfile,
    ...savedPayload,
    focusSubject: profile.focusSubject,
    studyLanguage:
      profile.studyLanguage === 'Other' ? profile.studyLanguageOther.trim() : profile.studyLanguage,
  });

  const saveStudyPlanFromMaterial = (material, savedPayload) => {
    const plan = generateStudyPlan({
      studyProfile: buildStudyProfileForPlan(savedPayload),
      subject: material.subject,
      materialText: material.materialText,
      sourceType: material.sourceType,
      fileName: material.fileName,
    });
    saveStudyPlan(plan);
    return plan;
  };

  const getSavedPayloadForPlan = () => ({
    displayName: savedProfile?.displayName || '',
    institutionType: profile.institutionType,
    standard: profile.institutionType === 'School' ? profile.standard : '',
    degree: profile.institutionType !== 'School' ? profile.degree : '',
    studyGoal: savedProfile?.studyGoal || '',
    studyFrequency: savedProfile?.studyFrequency || '',
    focusSubject: profile.focusSubject,
    examDateOption: savedProfile?.examDateOption || '',
    examDate: savedProfile?.examDate || '',
    studyLanguage:
      profile.studyLanguage === 'Other' ? profile.studyLanguageOther.trim() : profile.studyLanguage,
    onboardingCompleted: true,
  });

  const autoCreateStudyPlan = (material) => {
    const savedPayload = getSavedPayloadForPlan();
    saveStudyMaterial(material);
    const plan = saveStudyPlanFromMaterial(material, savedPayload);
    setPlanMessage(`Study plan auto-created for ${plan.subject} with ${plan.sessions.length} scheduled days.`);
    return plan;
  };

  const validateMaterial = () => {
    if (inputMode === 'upload' && !subjectFile) {
      setError('Please upload a subject file (.txt, .pdf, or .docx), or switch to paste notes.');
      return false;
    }

    if (inputMode === 'paste' && form.studyNotes.trim().length < MIN_STUDY_NOTES_LENGTH) {
      setError(`Study notes must be at least ${MIN_STUDY_NOTES_LENGTH} characters.`);
      return false;
    }

    if (!profile.focusSubject) {
      setError('Please select your course or subject.');
      return false;
    }

    if (!profile.studyLanguage) {
      setError('Please select your study language.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setPlanMessage('');

    if (!validateMaterial()) return;

    await persistProfile();
    const material = buildMaterialPayload();
    autoCreateStudyPlan(material);

    setLoading(true);

    try {
      const response = await generateFlashcardSet({
        setName: material.setName,
        studyNotes: inputMode === 'paste' ? form.studyNotes : '',
        subjectFile: inputMode === 'upload' ? subjectFile : null,
        maxCards,
      });
      setPreview(
        (response.data.flashcards || []).map((card) => ({
          question: typeof card.question === 'string' ? card.question : String(card.question ?? ''),
          answer: typeof card.answer === 'string' ? card.answer : String(card.answer ?? ''),
        })),
      );
      setGeneratedSetId(response.data._id);
      if (response.meta?.generatedCount < response.meta?.requestedCount) {
        setPlanMessage(
          `Generated ${response.meta.generatedCount} of ${response.meta.requestedCount} requested flashcards. Add more study material to reach the full count.`,
        );
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to generate flashcards'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">Create Set</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Generate AI flashcards from notes</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Upload a file or paste notes to auto-create your study plan and generate advanced-level flashcards.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Set Name</span>
            <input
              type="text"
              name="setName"
              value={form.setName}
              onChange={handleChange}
              placeholder="Chapter 3 - Cell Division"
              className={inputClass}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Number of Flashcards
            </span>
            <input
              type="number"
              min={1}
              max={15}
              value={maxCards}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isNaN(value)) return;
                setMaxCards(Math.min(15, Math.max(1, value)));
              }}
              className={inputClass}
              required
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Enter how many questions you want generated (1 to 15).
            </p>
          </label>

          {inputMode === 'upload' ? (
            <div className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Upload Subject Material
              </span>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-950">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFileTypes}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  Click to upload your subject file
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">TXT, PDF, DOCX up to 50 MB</p>
                {fileName ? (
                  <p className="mt-4 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Selected: {fileName}
                  </p>
                ) : null}
              </label>
              {fileName ? (
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-500"
                >
                  Remove file
                </button>
              ) : (
                <button
                  type="button"
                  onClick={switchToPaste}
                  className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
                >
                  Don&apos;t have a file? Paste your notes instead
                </button>
              )}
            </div>
          ) : (
            <div className="block">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Study Notes</span>
                <button
                  type="button"
                  onClick={switchToUpload}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
                >
                  Back to upload file
                </button>
              </div>
              <textarea
                name="studyNotes"
                rows="14"
                value={form.studyNotes}
                onChange={handleChange}
                placeholder={studyNotesPlaceholder}
                className={inputClass}
                required
              />
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          {planMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
              {planMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Generating flashcards...' : 'Generate Flashcards'}
            </button>
            <Link
              to="/study-plan"
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200"
            >
              View Study Plan
            </Link>
          </div>
        </form>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Preview</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {preview.length
            ? `${preview.length} flashcard${preview.length > 1 ? 's' : ''} generated from your material.`
            : 'Flashcards are generated only from your uploaded file or pasted study notes.'}
        </p>
        <div className="mt-6 space-y-4">
          {preview.length ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Generated Questions
                </p>
                <ul className="mt-3 space-y-3">
                  {preview.map((card, index) => (
                    <li
                      key={`${card.question}-${index}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <span className="mr-2 font-semibold text-indigo-600 dark:text-indigo-300">{index + 1}.</span>
                      {card.question}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/review/${generatedSetId}`)}
                className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Start Review
              </button>
              <Link
                to="/study-plan"
                className="block w-full rounded-2xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200"
              >
                View Study Plan
              </Link>
            </>
          ) : inputMode === 'upload' && fileName ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Ready to generate flashcards from{' '}
              <span className="font-medium text-slate-700 dark:text-slate-200">{fileName}</span> for{' '}
              <span className="font-medium text-slate-700 dark:text-slate-200">{subjectLabel}</span>.
            </div>
          ) : hasPasteMaterial ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Notes ready. Flashcards will be created from your pasted content for{' '}
              <span className="font-medium text-slate-700 dark:text-slate-200">{subjectLabel}</span>.
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Upload a file or paste study notes to generate flashcards.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default CreateFlashcardsPage;
