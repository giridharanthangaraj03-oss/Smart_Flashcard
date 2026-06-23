import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
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
        title="Create your study account"
        subtitle="Turn long notes into smart flashcards and review them with spaced repetition."
        fields={[
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Your full name' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'student@example.com' },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            placeholder: 'Create a strong password',
          },
          {
            name: 'confirmPassword',
            label: 'Confirm Password',
            type: 'password',
            placeholder: 'Re-enter password',
          },
        ]}
        values={values}
        onChange={onChange}
        onSubmit={onSubmit}
        submitLabel="Create account"
        error={error}
        loading={loading}
        passwordRequirements={passwordRequirements}
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400">
              Login
            </Link>
          </>
        }
      />
    </div>
  );
}

export default SignupPage;
