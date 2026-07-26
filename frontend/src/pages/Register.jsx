import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { BookOpen } from 'lucide-react';
import Button from '../components/Button';
import useAuth from '../context/useAuth';
import dashboardPath from '../utils/dashboardPath';
import { useTranslation } from 'react-i18next';
import PageBackground from '../components/PageBackground';

export default function Register() {
  const { t } = useTranslation();
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password');

  const onSubmit = async data => {
    setServerError('');

    try {
      const user = await createAccount(data);
      navigate(dashboardPath(user), { replace: true });
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, messages]) => setError(field, { message: messages[0] }));
        return;
      }

      setServerError(t('auth.registerFailed'));
    }
  };

  const inputClass = 'appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white/50';

  return (
    <PageBackground variant="auth" className="min-h-[calc(100vh-6rem)]">
    <div className="relative flex min-h-[calc(100vh-6rem)] flex-col justify-center overflow-hidden bg-transparent py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute right-[9%] top-[14%] h-32 w-44 rotate-12 rounded-[2.25rem] border border-amber-300/25 bg-white/20 shadow-2xl backdrop-blur-sm" aria-hidden="true"/>
      <div className="pointer-events-none absolute bottom-[12%] left-[7%] h-40 w-40 -rotate-6 rounded-full border-[22px] border-blue-300/10" aria-hidden="true"/>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-6 flex justify-center"><div className="rounded-2xl border border-amber-300 bg-[#F5C542] p-3 shadow-[0_12px_28px_-16px_rgba(183,121,31,0.65)]"><BookOpen className="h-8 w-8 text-slate-950" /></div></div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 mb-2">{t('auth.create')}</h2>
        <p className="text-center text-sm text-slate-600">{t('auth.registered')} <Link to="/login" className="font-medium text-primary">{t('auth.signIn')}</Link></p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="panel px-5 py-8 sm:rounded-[2rem] sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
            <div><label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('auth.name')}</label><input id="name" autoComplete="name" {...register('name', { required: t('auth.requiredName') })} className={`${inputClass} mt-2`} />{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}</div>
            <div><label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('auth.email')}</label><input id="email" type="email" autoComplete="email" {...register('email', { required: t('auth.requiredEmail') })} className={`${inputClass} mt-2`} />{errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}</div>
            <div><label htmlFor="password" className="block text-sm font-medium text-slate-700">{t('auth.password')}</label><input id="password" type="password" autoComplete="new-password" {...register('password', { required: t('auth.requiredPassword'), minLength: { value: 8, message: t('auth.passwordLength') } })} className={`${inputClass} mt-2`} />{errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}</div>
            <div><label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700">{t('auth.confirmPassword')}</label><input id="password_confirmation" type="password" autoComplete="new-password" {...register('password_confirmation', { required: t('auth.requiredConfirmation'), validate: value => value === password || t('auth.passwordMatch') })} className={`${inputClass} mt-2`} />{errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>}</div>
            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>{isSubmitting ? t('actions.saving') : t('auth.create')}</Button>
          </form>
        </div>
      </div>
    </div>
    </PageBackground>
  );
}
