import { AlertTriangle } from 'lucide-react';
import { Badge, Button, EmptyState as SharedEmptyState, LoadingState, Modal, ToastProvider } from '../../components/ui';

export { ToastProvider };

export function PageSkeleton({ cards = 4 }) {
  return <LoadingState cards={cards} label="Loading administration data"/>;
}

export function EmptyState({ title = 'Nothing to show', description = 'No records match the current filters.' }) {
  return <SharedEmptyState title={title} description={description}/>;
}

export function ErrorState({ retry }) {
  return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-5 w-5"/>Unable to load this page</div><Button onClick={retry} variant="danger" size="sm" className="mt-4">Try again</Button></div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  return <Modal open={open} title={title} description={description} onClose={onClose} footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>{confirmLabel}</Button></>}/>;
}

export function StatusBadge({ value }) {
  const tones = {
    published: 'success', approved: 'success', active: 'success', verified: 'success',
    pending: 'warning', pending_review: 'warning', rejected: 'danger', unverified: 'danger',
    archived: 'neutral', inactive: 'neutral', draft: 'info', admin: 'info', instructor: 'warning', student: 'neutral',
  };
  return <Badge tone={tones[value] || 'neutral'}>{String(value || 'none').replaceAll('_', ' ')}</Badge>;
}
