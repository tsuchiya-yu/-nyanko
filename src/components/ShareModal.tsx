import { X, Check, Copy, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md relative"
        onClick={e => e.stopPropagation()}
      >
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
              <div className="border border-gray-300 rounded-md inline-block">
                <QRCodeSVG
                  value={currentUrl}
                  size={200}
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
          <hr className="mb-4"></hr>
          <p className="text-lg text-gray-600 mb-4">SNSでページをシェアする</p>
          <div id="share-buttons" className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => handleShare('Twitter')}
              className="p-2 bg-black text-white rounded-full hover:opacity-90 transition-opacity"
              aria-label="Xでシェア"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('LINE')}
              className="p-2 bg-green-500 text-white rounded-full hover:opacity-90 transition-opacity"
              aria-label="LINEでシェア"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.428.596-.075.021-.15.031-.226.031-.195 0-.375-.094-.483-.25l-2.479-3.344v2.969c0 .345-.282.629-.631.629-.345 0-.63-.284-.63-.629V8.108c0-.27.174-.51.428-.596.075-.021.15-.031.226-.031.195 0 .375.094.483.25l2.479 3.344V8.108c0-.345.284-.63.63-.63.346 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.63.629-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"></path>
              </svg>
            </button>
          </div>
          <hr className="mb-4"></hr>
          <p className="text-sm text-gray-600 mb-2">うちの子のページをつくる</p>
          <button
            onClick={handleRegister}
            className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-500 transition-colors"
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
    </div>,
    document.body
  );
}
