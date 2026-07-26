import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  if (online) return null;
  return <div className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-center gap-2 bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white" role="status" aria-live="assertive"><WifiOff className="h-4 w-4" aria-hidden="true"/>{t('errors.offline')}</div>;
}
