import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { syncAndCheckOnboarding } from '../utils/syncStudyProfile';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

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
        title={t('loginTitle')}
        subtitle={t('loginSubtitle')}
        fields={[
          { name: 'email', label: t('email'), type: 'email', placeholder: 'student@example.com' },
          { name: 'password', label: t('password'), type: 'password', placeholder: 'Minimum 8 characters' },
        ]}
        values={values}
        onChange={onChange}
        onSubmit={onSubmit}
        submitLabel={t('login')}
        error={error}
        loading={loading}
        footer={
          <>
            {t('createAccountQuestion')}{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400">
              {t('createAccountAction')}
            </Link>
          </>
        }
      />
    </div>
  );
}

export default LoginPage;
