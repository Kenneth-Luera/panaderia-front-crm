import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-primary-500" />;
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size={32} />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <p className="text-sm text-error-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-neutral-400">{message}</p>
    </div>
  );
}
