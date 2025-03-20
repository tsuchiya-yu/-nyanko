import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeButtonPosition?: 'top-right';
}

/**
 * 共通モーダルコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose} title="設定">
 *   <div>モーダルの内容</div>
 * </Modal>
 * ```
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeButtonPosition = 'top-right',
}: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[9999]">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-md mx-4 shadow-lg z-[10000]">
        {closeButtonPosition === 'top-right' && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        <div className="p-6">
          {title && <h2 className="text-xl font-semibold text-gray-800 mb-6">{title}</h2>}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
