import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { BookOpen } from 'lucide-react';
import Button from '../components/Button';
import useAuth from '../context/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async data => {
    setServerError('');

    try {
      await login(data);
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, messages]) => {
          setError(field, { message: messages[0] });
        });
        return;
      }

      setServerError('Unable to sign in. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col justify-center overflow-hidden py-16 sm:px-6 lg:px-8">
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3"><div className="w-96 h-96 bg-primary/10 rounded-full blur-3xl" /></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3"><div className="w-96 h-96 bg-secondary/10 rounded-full blur-3xl" /></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6"><div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/30"><BookOpen className="h-8 w-8 text-white" /></div></div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 mb-2">Welcome back</h2>
        <p className="text-center text-sm text-slate-600">Or <Link to="/register" className="font-medium text-primary hover:text-indigo-500">create a new account</Link></p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="panel px-4 py-8 sm:rounded-[2rem] sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-2">
                <input id="email" type="email" autoComplete="email" {...register('email', { required: 'Email is required' })} className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white/50" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-2">
                <input id="password" type="password" autoComplete="current-password" {...register('password', { required: 'Password is required' })} className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white/50" />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-slate-900"><input type="checkbox" {...register('remember')} className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" /><span className="ml-2">Remember me</span></label>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
