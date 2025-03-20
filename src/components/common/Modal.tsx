import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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
  // モーダルが開いている時はスクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // スクロールバーの幅分のずれを防ぐためのパディングを追加
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[9999] p-4 overflow-y-auto">
      <div 
        className="min-h-full flex items-center justify-center"
      >
        <div className="bg-white rounded-2xl w-full max-w-md shadow-lg z-[10000] relative">
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
      </div>
    </div>,
    document.body
  );
}
