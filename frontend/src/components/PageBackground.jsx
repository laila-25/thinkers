const variants = {
  landing: {
    base: 'bg-[linear-gradient(145deg,#fffdf7_0%,#f4f7fb_48%,#fff8e4_100%)] dark:bg-[linear-gradient(145deg,#091426_0%,#101d31_52%,#151c2d_100%)]',
    glowA: 'bg-amber-300/28 dark:bg-amber-400/11', glowB: 'bg-sky-300/18 dark:bg-sky-500/8', pattern: 'page-pattern-course',
  },
  ai: {
    base: 'bg-[linear-gradient(145deg,#071426_0%,#0d2037_48%,#111b31_100%)] dark:bg-[linear-gradient(145deg,#060f1d_0%,#0a192d_48%,#11152a_100%)]',
    glowA: 'bg-blue-400/15 dark:bg-blue-500/12', glowB: 'bg-amber-300/14 dark:bg-amber-400/10', pattern: 'page-pattern-ai',
  },
  course: {
    base: 'bg-[linear-gradient(145deg,#fffdf7_0%,#fbf8ef_48%,#f5f7fb_100%)] dark:bg-[linear-gradient(145deg,#101827_0%,#151e30_50%,#111b2d_100%)]',
    glowA: 'bg-amber-300/25 dark:bg-amber-400/10', glowB: 'bg-orange-200/20 dark:bg-blue-500/8', pattern: 'page-pattern-course',
  },
  player: {
    base: 'bg-[linear-gradient(150deg,#101827_0%,#17243a_46%,#121c2f_100%)] dark:bg-[linear-gradient(150deg,#07111f_0%,#0c1829_48%,#091426_100%)]',
    glowA: 'bg-blue-400/10 dark:bg-blue-500/8', glowB: 'bg-amber-300/10 dark:bg-amber-400/7', pattern: 'page-pattern-player',
  },
  student: {
    base: 'bg-[linear-gradient(145deg,#fffdf7_0%,#f6f9fc_48%,#fff9e9_100%)] dark:bg-[linear-gradient(145deg,#0d1728_0%,#101d31_52%,#142036_100%)]',
    glowA: 'bg-amber-300/25 dark:bg-amber-400/10', glowB: 'bg-sky-300/20 dark:bg-sky-500/10', pattern: 'page-pattern-student',
  },
  instructor: {
    base: 'bg-[linear-gradient(145deg,#f6f8fc_0%,#fffdf7_50%,#eef3f8_100%)] dark:bg-[linear-gradient(145deg,#0b1526_0%,#111d30_50%,#0d1b2f_100%)]',
    glowA: 'bg-blue-300/16 dark:bg-blue-500/9', glowB: 'bg-amber-300/18 dark:bg-amber-400/9', pattern: 'page-pattern-instructor',
  },
  admin: {
    base: 'bg-[linear-gradient(145deg,#eef2f8_0%,#f8fafc_52%,#f4f0e5_100%)] dark:bg-[linear-gradient(145deg,#081322_0%,#0d192b_55%,#111d31_100%)]',
    glowA: 'bg-blue-300/14 dark:bg-blue-500/9', glowB: 'bg-amber-300/18 dark:bg-amber-400/8', pattern: 'page-pattern-admin',
  },
  auth: {
    base: 'bg-[linear-gradient(145deg,#fffdf8_0%,#faf8f2_45%,#f3f6fb_100%)] dark:bg-[linear-gradient(145deg,#0c1627_0%,#111b2e_48%,#151d2d_100%)]',
    glowA: 'bg-amber-300/25 dark:bg-amber-400/10', glowB: 'bg-slate-300/20 dark:bg-blue-500/10', pattern: 'page-pattern-auth',
  },
  certificate: {
    base: 'bg-[linear-gradient(145deg,#fffdf5_0%,#fbf5df_48%,#f5f7fb_100%)] dark:bg-[linear-gradient(145deg,#111827_0%,#1b2130_48%,#101a2d_100%)]',
    glowA: 'bg-amber-300/30 dark:bg-amber-400/12', glowB: 'bg-yellow-200/18 dark:bg-blue-500/7', pattern: 'page-pattern-certificate',
  },
};

export default function PageBackground({ variant = 'student', children, className = '' }) {
  const style = variants[variant] || variants.student;

  return <div className={`page-background relative isolate min-h-full overflow-hidden ${style.base} ${className}`} data-background={variant}>
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className={`page-background-pattern ${style.pattern} absolute inset-0 opacity-[0.36] dark:opacity-[0.18]`}/>
      <div className={`page-background-orb page-background-orb-a absolute -right-24 -top-28 h-80 w-80 rounded-full blur-3xl sm:h-[30rem] sm:w-[30rem] ${style.glowA}`}/>
      <div className={`page-background-orb page-background-orb-b absolute -bottom-36 -left-28 h-96 w-96 rounded-full blur-3xl sm:h-[34rem] sm:w-[34rem] ${style.glowB}`}/>
      <div className="absolute left-[12%] top-[22%] h-2 w-2 rounded-full bg-amber-400/35 shadow-[0_0_24px_rgba(245,197,66,.45)]"/>
      <div className="absolute bottom-[24%] right-[14%] h-1.5 w-1.5 rounded-full bg-slate-400/25 dark:bg-slate-300/20"/>
    </div>
    <div className="relative z-10 min-h-[inherit]">{children}</div>
  </div>;
}
