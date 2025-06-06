import { X } from 'lucide-react';
import { BlockPicker } from 'react-color';
import { createPortal } from 'react-dom';

import styles from './colorPickerStyles.module.css';
import { backgroundColors, textColors } from '../utils/constants';

// CSSモジュールとしてスタイルをインポート

// ColorPickerModalコンポーネント
export interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: string;
  onChange: (color: string) => void;
  title: string;
  colors: string[];
  originalColor?: string; // 元の色（リセット用）
}

export function ColorPickerModal({
  isOpen,
  onClose,
  color,
  onChange,
  title,
  colors,
  originalColor,
}: ColorPickerModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded-md shadow-lg relative w-64">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className={styles.colorPickerContainer}>
          <BlockPicker
            color={color}
            onChange={colorObj => {
              onChange(colorObj.hex);
            }}
            colors={colors}
            triangle="hide"
            width="220px"
            className={styles.blockPicker}
          />
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          {originalColor && (
            <button
              onClick={() => {
                onChange(originalColor);
                onClose();
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none text-sm"
            >
              リセット
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-500 focus:outline-none"
          >
            設定する
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
