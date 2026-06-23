import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { syncAndCheckOnboarding } from '../utils/syncStudyProfile';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(values);
      const { complete } = await syncAndCheckOnboarding();
      const from = location.state?.from?.pathname;
      const target = complete ? from || '/dashboard' : '/study-setup';
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <AuthForm
        title="Login to your study dashboard"
        subtitle="Access your generated flashcards, reviews, and progress analytics."
        fields={[
          { name: 'email', label: 'Email', type: 'email', placeholder: 'student@example.com' },
          { name: 'password', label: 'Password', type: 'password', placeholder: 'Minimum 8 characters' },
        ]}
        values={values}
        onChange={onChange}
        onSubmit={onSubmit}
        submitLabel="Login"
        error={error}
        loading={loading}
        footer={
          <>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400">
              Create one
            </Link>
          </>
        }
      />
    </div>
  );
}

export default LoginPage;
