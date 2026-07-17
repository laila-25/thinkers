import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { BookOpen } from 'lucide-react';
import Button from '../components/Button';
import useAuth from '../context/useAuth';

export default function Register() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password');

  const onSubmit = async data => {
    setServerError('');

    try {
      await createAccount(data);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, messages]) => setError(field, { message: messages[0] }));
        return;
      }

      setServerError('Unable to create your account. Please try again.');
    }
  };

  const inputClass = 'appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white/50';

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col justify-center overflow-hidden py-16 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6"><div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/30"><BookOpen className="h-8 w-8 text-white" /></div></div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 mb-2">Create your account</h2>
        <p className="text-center text-sm text-slate-600">Already registered? <Link to="/login" className="font-medium text-primary">Sign in</Link></p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="panel px-4 py-8 sm:rounded-[2rem] sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
            <div><label htmlFor="name" className="block text-sm font-medium text-slate-700">Full name</label><input id="name" autoComplete="name" {...register('name', { required: 'Name is required' })} className={`${inputClass} mt-2`} />{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}</div>
            <div><label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label><input id="email" type="email" autoComplete="email" {...register('email', { required: 'Email is required' })} className={`${inputClass} mt-2`} />{errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}</div>
            <div><label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label><input id="password" type="password" autoComplete="new-password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })} className={`${inputClass} mt-2`} />{errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}</div>
            <div><label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700">Confirm password</label><input id="password_confirmation" type="password" autoComplete="new-password" {...register('password_confirmation', { required: 'Please confirm your password', validate: value => value === password || 'Passwords do not match' })} className={`${inputClass} mt-2`} />{errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>}</div>
            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
