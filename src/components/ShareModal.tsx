import { X, Check, Copy, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  catName: string;
}

export default function ShareModal({ isOpen, onClose, catName }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const currentUrl = window.location.href;
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('URLのコピーに失敗しました:', err);
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(`${catName}の猫プロフィール | CAT LINK`);
    let shareUrl = '';

    switch (platform) {
      case 'Instagram':
        // Instagramはディープリンクが制限されているので、
        // まずクリップボードにURLをコピーしてからInstagramアプリを開く
        navigator.clipboard.writeText(currentUrl);
        alert('URLをコピーしました。Instagramアプリを開いて貼り付けてください。');
        // モバイルの場合はInstagramアプリを開く試み
        shareUrl = 'instagram://';
        break;
      case 'Twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'LINE':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
        break;
      default:
        // Web Share APIをサポートしているブラウザ向け
        if (typeof navigator !== 'undefined' && navigator.share) {
          navigator
            .share({
              title: `${catName}の猫プロフィール | CAT LINK`,
              url: currentUrl,
            })
            .catch(err => console.error('Error sharing:', err));
          return;
        }
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const handleRegister = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      // ユーザープロフィールページに遷移
      navigate(`/profile/${user.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      style={{ marginTop: '0' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-[-10px] top-[-30px] text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{catName} | CAT LINK</h3>
          <div className="mb-4">
            <div className="flex justify-center mb-4">
              <div className="border border-gray-300 rounded-md p-4 inline-block">
                <QRCodeSVG
                  value={currentUrl}
                  size={160}
                  bgColor={'#ffffff'}
                  fgColor={'#000000'}
                  level={'L'}
                  includeMargin={true}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{currentUrl}</p>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors rounded-md"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" /> コピーしました
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> このページのURLをコピーする
                </>
              )}
            </button>
          </div>
          <p className="text-lg text-gray-600 mb-4">このページをシェアする</p>
          <div id="share-buttons" className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => handleShare('Twitter')}
              className="p-2 bg-blue-400 text-white rounded-full hover:opacity-90 transition-opacity"
              aria-label="Xでシェア"
            >
              <Twitter className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleShare('LINE')}
              className="p-2 bg-green-500 text-white rounded-full hover:opacity-90 transition-opacity"
              aria-label="LINEでシェア"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">自分の猫ちゃんのページをつくる</p>
          <button
            onClick={handleRegister}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            登録する
          </button>
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (user) {
            navigate(`/profile/${user.id}`);
          }
        }}
      />
    </div>
  );
}
