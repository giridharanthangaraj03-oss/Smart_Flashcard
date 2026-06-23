const STORAGE_KEY = 'studyProfile';

export const loadLocalStudyProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveLocalStudyProfile = (profile) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const isStudyOnboardingComplete = (profile) =>
  Boolean(profile?.onboardingCompleted && profile?.displayName);

export const clearLocalStudyProfile = () => {
  localStorage.removeItem(STORAGE_KEY);
};
