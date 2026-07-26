import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { BookOpen } from 'lucide-react';
import Button from '../components/Button';
import useAuth from '../context/useAuth';
import dashboardPath from '../utils/dashboardPath';
import { useTranslation } from 'react-i18next';
import PageBackground from '../components/PageBackground';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async data => {
    setServerError('');

    try {
      const user = await login(data);
      navigate(location.state?.from?.pathname ?? dashboardPath(user), { replace: true });
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, messages]) => {
          setError(field, { message: messages[0] });
        });
        return;
      }

      if (!error.response) {
        setServerError(t('auth.server'));
      } else if (error.response.status === 419) {
        setServerError(t('auth.expired'));
      } else if (error.response.status === 429) {
        setServerError(t('auth.attempts'));
      } else if (error.response.status >= 500) {
        setServerError(t('auth.server'));
      } else {
        setServerError(error.response.data?.message || t('auth.failed'));
      }
    }
  };

  return (
    <PageBackground variant="auth" className="min-h-[calc(100vh-6rem)]">
    <div className="relative flex min-h-[calc(100vh-6rem)] flex-col justify-center overflow-hidden bg-transparent py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[8%] top-[18%] h-28 w-40 -rotate-12 rounded-[2rem] border border-amber-300/25 bg-white/20 shadow-2xl backdrop-blur-sm" aria-hidden="true"/>
      <div className="pointer-events-none absolute bottom-[14%] right-[8%] h-36 w-36 rotate-12 rounded-full border-[20px] border-sky-300/10" aria-hidden="true"/>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="mb-6 flex justify-center"><div className="rounded-2xl border border-amber-300 bg-[#F5C542] p-3 shadow-[0_12px_28px_-16px_rgba(183,121,31,0.65)]"><BookOpen className="h-8 w-8 text-slate-950" /></div></div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 mb-2">{t('auth.welcome')}</h2>
        <p className="text-center text-sm text-slate-600"><Link to="/register" className="font-medium text-primary hover:text-indigo-500">{t('auth.createLink')}</Link></p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="panel px-5 py-8 sm:rounded-[2rem] sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('auth.email')}</label>
              <div className="mt-2">
                <input id="email" type="email" autoComplete="email" {...register('email', { required: t('auth.requiredEmail') })} className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white/50" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">{t('auth.password')}</label>
              <div className="mt-2">
                <input id="password" type="password" autoComplete="current-password" {...register('password', { required: t('auth.requiredPassword') })} className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white/50" />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-slate-900"><input type="checkbox" {...register('remember')} className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" /><span className="ms-2">{t('auth.remember')}</span></label>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>{isSubmitting ? t('auth.signingIn') : t('auth.signIn')}</Button>
          </form>
        </div>
      </div>
    </div>
    </PageBackground>
  );
}
