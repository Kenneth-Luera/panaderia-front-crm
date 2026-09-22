import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-error-50 flex items-center justify-center">
          <AlertTriangle className="text-error-500" size={28} />
        </div>
        <p className="text-sm text-neutral-600">{message}</p>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-error-500 text-white text-sm font-medium shadow-sm transition-all duration-200 hover:bg-error-600 active:scale-95"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
}
