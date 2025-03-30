import { X } from 'lucide-react';
import { BlockPicker } from 'react-color';
import { createPortal } from 'react-dom';

// スタイルを追加
import './colorPickerStyles.css';

// ColorPickerModalコンポーネント
export interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: string;
  onChange: (color: string) => void;
  title: string;
  colors: string[];
}

export function ColorPickerModal({ isOpen, onClose, color, onChange, title, colors }: ColorPickerModalProps) {
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
        <div className="color-picker-container">
          <BlockPicker
            color={color}
            onChange={colorObj => {
              onChange(colorObj.hex);
            }}
            colors={colors}
            triangle="hide"
            width="220px"
            className="block-picker"
          />
        </div>
        <div className="flex justify-end mt-4">
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

// 背景色用のカラーパレット
export const backgroundColors = [
  '#F9F9F9', '#FFF4E6', '#FCE8E6', '#EAF6F6',
  '#F0F4FF', '#F3EBF6', '#FFF5F0', '#FDF8E1',
  '#E8F5E9', '#FFFDE7', '#F3F9FD', '#F8F0FA',
  '#F0FAF8', '#FAF4F4'
];

// 文字色用のカラーパレット
export const textColors = [
  '#3B3B3B', '#1E3A5F', '#4E2A84', '#B33A3A',
  '#0F574E', '#805300', '#8A4F00', '#993955',
  '#004D40', '#5D1451', '#3A3A78', '#2F4858',
  '#9C2B20', '#3D550C'
];

// デフォルト値
export const defaultBackgroundColor = '#F9F9F9';
export const defaultTextColor = '#333333'; 