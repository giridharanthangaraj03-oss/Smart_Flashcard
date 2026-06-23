import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import CreateFlashcardsPage from './pages/CreateFlashcardsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ReviewFlashcardsPage from './pages/ReviewFlashcardsPage';
import SignupPage from './pages/SignupPage';
import StudyOnboardingPage from './pages/StudyOnboardingPage';
import StudyOnboardingGuard from './components/StudyOnboardingGuard';
import StudyPlanPage from './pages/StudyPlanPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <Navbar />
            <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/study-setup"
                  element={
                    <ProtectedRoute>
                      <StudyOnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create"
                  element={
                    <ProtectedRoute>
                      <StudyOnboardingGuard>
                        <CreateFlashcardsPage />
                      </StudyOnboardingGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/study-plan"
                  element={
                    <ProtectedRoute>
                      <StudyOnboardingGuard>
                        <StudyPlanPage />
                      </StudyOnboardingGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review/:setId"
                  element={
                    <ProtectedRoute>
                      <ReviewFlashcardsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
