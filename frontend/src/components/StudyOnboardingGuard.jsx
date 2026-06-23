import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { syncAndCheckOnboarding } from '../utils/syncStudyProfile';

function StudyOnboardingGuard({ children }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const { complete } = await syncAndCheckOnboarding();
      setAllowed(complete);
      setReady(true);
    };

    void checkProfile();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          Checking your study profile...
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/study-setup" replace state={{ from: location }} />;
  }

  return children;
}

export default StudyOnboardingGuard;
