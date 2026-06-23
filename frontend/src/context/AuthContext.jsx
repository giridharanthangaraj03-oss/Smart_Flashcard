import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProfile, login, signup } from '../services/authService';
import { clearLocalStudyProfile, isStudyOnboardingComplete, saveLocalStudyProfile } from '../utils/studyProfileStorage';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getProfile();
        setUser(response.user);
        if (isStudyOnboardingComplete(response.user?.studyProfile)) {
          saveLocalStudyProfile(response.user.studyProfile);
        }
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const handleAuthSuccess = useCallback((response) => {
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const loginUser = useCallback(async (payload) => {
    const response = await login(payload);
    handleAuthSuccess(response);
    return response;
  }, [handleAuthSuccess]);

  const signupUser = useCallback(async (payload) => {
    const response = await signup(payload);
    handleAuthSuccess(response);
    return response;
  }, [handleAuthSuccess]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    clearLocalStudyProfile();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      loginUser,
      signupUser,
      logout,
      setUser,
    }),
    [user, token, loading, loginUser, signupUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
