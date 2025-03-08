import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>利用規約 | CAT LINK</title>
        <meta
          name="description"
          content="CAT LINKの利用規約です。サービスをご利用いただく前に、こちらの規約をご確認ください。"
        />
        <meta
          name="keywords"
          content="CAT LINK, 利用規約, 猫, ペット, プロフィール, 写真"
        />
        <meta property="og:title" content="利用規約 | CAT LINK" />
        <meta property="og:url" content="https://cat-link.com/terms" />
        <meta
          property="og:description"
          content="CAT LINKの利用規約です。サービスをご利用いただく前に、こちらの規約をご確認ください。"
        />
        <link rel="canonical" href="https://cat-link.com/terms" />
      </Helmet>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Link to="/" className="text-pink-500 hover:text-pink-600 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">利用規約</h1>
        </div>

        <div className="prose max-w-none">
          <h2>1. はじめに</h2>
          <p>
            この利用規約（以下「本規約」）は、CAT
            LINK（以下「本サービス」）の利用条件を定めるものです。
            登録ユーザーの皆様には、本規約に従って本サービスをご利用いただきます。
          </p>

          <h2>2. 利用登録</h2>
          <p>
            本サービスの利用を希望する方は、本規約に同意の上、所定の方法により利用登録を行うものとします。
            当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録を拒否することがあります。
          </p>
          <ul>
            <li>虚偽の事項を届け出た場合</li>
            <li>本規約に違反したことがある者からの申請である場合</li>
            <li>その他、当社が利用登録を相当でないと判断した場合</li>
          </ul>

          <h2>3. 禁止事項</h2>
          <p>
            ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
          </p>
          <ul>
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>他のユーザーに迷惑をかけるような行為</li>
            <li>他のユーザーの情報を不正に収集する行為</li>
            <li>本サービスの運営を妨害するおそれのある行為</li>
          </ul>

          <h2>4. 本サービスの提供の停止等</h2>
          <p>
            当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
          </p>
          <ul>
            <li>
              本サービスにかかるコンピュータシステムの保守点検または更新を行う場合
            </li>
            <li>
              地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
            </li>
            <li>その他、当社が本サービスの提供が困難と判断した場合</li>
          </ul>

          <h2>5. 免責事項</h2>
          <p>
            当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
          </p>

          <h2>6. サービス内容の変更等</h2>
          <p>
            当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>

          <h2>7. 利用規約の変更</h2>
          <p>
            当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
            なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
          </p>
        </div>
      </div>
    </div>
  );
}
