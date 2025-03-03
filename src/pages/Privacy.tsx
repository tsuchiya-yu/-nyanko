import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>プライバシーポリシー | CAT LINK</title>
        <meta name="description" content="CAT LINKのプライバシーポリシーです。個人情報の取り扱いについて説明しています。" />
        <meta name="keywords" content="CAT LINK, プライバシーポリシー, 個人情報保護, 猫, ペット, プロフィール" />
        <meta property="og:title" content="プライバシーポリシー | CAT LINK" />
        <meta property="og:url" content="https://cat-link.com/privacy" />
        <meta property="og:description" content="CAT LINKのプライバシーポリシーです。個人情報の取り扱いについて説明しています。" />
        <link rel="canonical" href="https://cat-link.com/privacy" />
      </Helmet>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Link to="/" className="text-pink-500 hover:text-pink-600 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">プライバシーポリシー</h1>
        </div>
        
        <div className="prose max-w-none">
          <h2>1. 個人情報の収集について</h2>
          <p>
            当サービスは、以下の個人情報を収集する場合があります：
          </p>
          <ul>
            <li>氏名</li>
            <li>メールアドレス</li>
            <li>プロフィール情報</li>
            <li>その他当サービスの利用に必要な情報</li>
          </ul>

          <h2>2. 個人情報の利用目的</h2>
          <p>
            収集した個人情報は、以下の目的で利用します：
          </p>
          <ul>
            <li>当サービスの提供・運営のため</li>
            <li>ユーザーからのお問い合わせに対応するため</li>
            <li>利用規約に違反する行為に対応するため</li>
            <li>当サービスの改善のため</li>
          </ul>

          <h2>3. 個人情報の第三者提供</h2>
          <p>
            当サービスは、以下の場合を除き、収集した個人情報を第三者に提供することはありません：
          </p>
          <ul>
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
          </ul>

          <h2>4. 個人情報の管理</h2>
          <p>
            当サービスは、個人情報の漏洩、滅失、き損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
          </p>

          <h2>5. 個人情報の開示・訂正・削除</h2>
          <p>
            ユーザーは、当サービスに対して個人情報の開示、訂正、削除を請求することができます。
          </p>

          <h2>6. Cookieの使用について</h2>
          <p>
            当サービスは、ユーザーの利便性を向上させるため、Cookieを使用する場合があります。
            ユーザーは、ブラウザの設定によりCookieの使用を制限することができます。
          </p>

          <h2>7. プライバシーポリシーの変更</h2>
          <p>
            当サービスは、必要に応じて、本プライバシーポリシーを変更することがあります。
            変更後のプライバシーポリシーは、本ページで公開された時点から効力を生じるものとします。
          </p>

          <h2>8. お問い合わせ</h2>
          <p>
            本プライバシーポリシーに関するお問い合わせは、当サービスの問い合わせフォームよりご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
}