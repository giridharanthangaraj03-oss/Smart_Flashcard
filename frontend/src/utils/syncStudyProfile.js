import { getStudyProfile } from '../services/studyProfileService';
import { isStudyOnboardingComplete, loadLocalStudyProfile, saveLocalStudyProfile } from './studyProfileStorage';

export async function syncAndCheckOnboarding() {
  const localProfile = loadLocalStudyProfile();
  if (isStudyOnboardingComplete(localProfile)) {
    return { complete: true, profile: localProfile };
  }

  try {
    const response = await getStudyProfile();
    const profile = response.data;
    if (profile) {
      saveLocalStudyProfile(profile);
      return { complete: isStudyOnboardingComplete(profile), profile };
    }
  } catch {
    // Fall through to incomplete state.
  }

  return { complete: false, profile: localProfile };
}
