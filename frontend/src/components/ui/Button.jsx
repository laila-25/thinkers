import { forwardRef } from 'react';

const variants = {
  primary: 'border border-[#E8B928] bg-[#F5C542] text-slate-950 shadow-[0_12px_28px_-16px_rgba(183,121,31,.65)] hover:-translate-y-0.5 hover:bg-[#FFD75A] hover:shadow-[0_16px_34px_-18px_rgba(183,121,31,.7)] focus-visible:ring-amber-200/70',
  secondary: 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  outline: 'border border-slate-300 bg-transparent text-slate-800 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 focus-visible:ring-amber-200/60 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
  danger: 'border border-rose-600 bg-rose-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-rose-700 focus-visible:ring-rose-200 dark:focus-visible:ring-rose-900',
  ghost: 'border border-transparent text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  accent: 'bg-[#F5C542] text-[#0B132B] shadow-[0_12px_30px_-20px_rgba(245,197,66,.9)] hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:ring-amber-200/70',
  darkOutline: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 focus-visible:ring-[#F5C542]/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
};

const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-5 py-3 text-sm sm:text-base', lg: 'px-7 py-3.5 text-base sm:text-lg', icon: 'h-10 w-10 p-0' };

const Button = forwardRef(function Button({ children, variant = 'primary', size = 'md', className = '', type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-[-.01em] transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} {...props}>{children}</button>;
});

export default Button;
