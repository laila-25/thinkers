import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}, ref) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[-0.01em] transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-out focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:shadow-none";
  
  const variants = {
    primary: "bg-[#0B132B] text-white shadow-[0_14px_34px_-20px_rgba(11,19,43,0.8)] hover:-translate-y-0.5 hover:bg-slate-900 focus:ring-amber-200/70",
    secondary: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-200",
    accent: "bg-[#F5C542] text-[#0B132B] shadow-[0_12px_30px_-20px_rgba(245,197,66,0.9)] hover:-translate-y-0.5 hover:bg-amber-300 focus:ring-amber-200/70",
    outline: "border border-slate-200 bg-transparent text-slate-800 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white focus:ring-slate-200",
    danger: "bg-rose-600 text-white hover:-translate-y-0.5 hover:bg-rose-700 focus:ring-rose-200",
    ghost: "text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-950 focus:ring-slate-100",
  };

  const sizes = {
    sm: "px-4 py-2.5 text-sm",
    md: "px-6 py-3 text-sm sm:text-base",
    lg: "px-8 py-4 text-base sm:text-lg",
  };

  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
