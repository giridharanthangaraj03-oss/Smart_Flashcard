import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/getErrorMessage';
import { getPasswordError, PASSWORD_REQUIREMENTS } from '../utils/passwordValidation';

function SignupPage() {
  const navigate = useNavigate();
  const { signupUser } = useAuth();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const passwordRequirements = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.map((rule) => ({
        ...rule,
        met: rule.test(values.password),
      })),
    [values.password],
  );

  const onChange = (event) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const passwordError = getPasswordError(values.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signupUser(values);
      navigate('/study-setup', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <AuthForm
        title={t('signupTitle')}
        subtitle={t('signupSubtitle')}
        fields={[
          { name: 'name', label: t('name'), type: 'text', placeholder: 'Your full name' },
          { name: 'email', label: t('email'), type: 'email', placeholder: 'student@example.com' },
          {
            name: 'password',
            label: t('password'),
            type: 'password',
            placeholder: 'Create a strong password',
          },
          {
            name: 'confirmPassword',
            label: t('confirmPassword'),
            type: 'password',
            placeholder: 'Re-enter password',
          },
        ]}
        values={values}
        onChange={onChange}
        onSubmit={onSubmit}
        submitLabel={t('createAccountSubmit')}
        error={error}
        loading={loading}
        passwordRequirements={passwordRequirements}
        footer={
          <>
            {t('alreadyHaveAccountQuestion')}{' '}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400">
              {t('loginAction')}
            </Link>
          </>
        }
      />
    </div>
  );
}

export default SignupPage;
