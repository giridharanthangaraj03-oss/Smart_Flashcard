const MATERIAL_KEY = 'studyMaterial';
const PLAN_KEY = 'studyPlan';

export const saveStudyMaterial = (material) => {
  const payload = { ...material, updatedAt: new Date().toISOString() };
  localStorage.setItem(MATERIAL_KEY, JSON.stringify(payload));
  return payload;
};

export const loadStudyMaterial = () => {
  try {
    const raw = localStorage.getItem(MATERIAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStudyPlan = (plan) => {
  const payload = { ...plan, generatedAt: new Date().toISOString() };
  localStorage.setItem(PLAN_KEY, JSON.stringify(payload));
  return payload;
};

export const loadStudyPlan = () => {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearStudyPlanData = () => {
  localStorage.removeItem(MATERIAL_KEY);
  localStorage.removeItem(PLAN_KEY);
};
