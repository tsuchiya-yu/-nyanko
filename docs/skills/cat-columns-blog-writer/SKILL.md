---
name: cat-columns-blog-writer
description: CAT LINK の columns.content 向けに、元ネタ本文だけを入力として既存記事準拠の HTML 記事本文を生成する。
---

# cat-columns-blog-writer

CAT LINK の `columns.content` に保存する HTML 記事本文を生成するためのスキル。
入力はユーザーが渡す元ネタ本文 (`source_content`) のみとし、既存記事の構成・文体・CTA・出典ブロックを再現する。

## 目的

- `columns.content` にそのまま保存できる HTML を生成する
- 既存記事の構成パターンを安定して再現する
- 導入、本文、まとめ、CTA、出典の欠落を防ぐ

## 入力

必須入力は `source_content` のみ。

- 形式はプレーンテキスト、要約、メモ、記事本文のいずれでもよい
- タイトル、URL、出典情報は未提供でもよい
- 情報量が少ない場合でも、内容から主題を抽出して記事構成へ再編する

## 出力

- `columns.content` にそのまま保存できる HTML 文字列
- ルート要素、本文、CTA、出典ブロックを含む完成済みコンテンツ

## 必須 HTML 構造

出力は、次の HTML 構造を満たすこと。

```html
<div class="mx-auto py-4 bg-white rounded-lg">
  <p class="text-gray-700 leading-relaxed mb-6">導入文</p>

  <h2 class="text-2xl font-semibold text-gray-700 mb-4 border-l-4 border-pink-300 pl-2">
    大見出し
  </h2>
  <p class="text-gray-700 leading-relaxed mb-4">本文</p>
  <p class="text-gray-700 leading-relaxed mb-6">本文</p>

  <h2 class="text-2xl font-semibold text-gray-700 mb-4 border-l-4 border-pink-300 pl-2">
    大見出し
  </h2>
  <h3 class="text-xl font-semibold text-gray-700 mb-3">小見出し</h3>
  <p class="text-gray-700 leading-relaxed mb-4">本文</p>
  <ul class="list-disc pl-6 text-gray-700 mb-6 space-y-3">
    <li><span class="font-semibold">項目名</span>：説明</li>
  </ul>

  <h2 class="text-2xl font-semibold text-gray-700 mb-4 border-l-4 border-pink-300 pl-2">まとめ</h2>
  <p class="text-gray-700 leading-relaxed mb-6">まとめ本文</p>

  <div class="mt-6 bg-gray-100 p-5 rounded-lg shadow-sm border border-gray-200">
    <h3 class="text-xl font-semibold text-gray-700 mb-3">
      愛猫のプロフィールページを作りませんか？🐾
    </h3>
    <p class="text-gray-700 leading-relaxed mb-4">
      CAT
      LINKでは、あなたの愛猫専用のプロフィールページを簡単に作成できます。かわいい写真や日常の記録をまとめて、猫仲間との交流も楽しみましょう！
    </p>
    <a
      href="https://cat-link.catnote.tokyo/"
      class="inline-block px-5 py-2 bg-gray-800 text-white rounded hover:bg-gray-600 transition-colors"
    >
      CAT LINKでプロフィールを作成する
    </a>
  </div>

  <p class="text-gray-500 text-sm mt-4">
    出典：<a href="..." class="underline text-gray-500" target="_blank">出典名</a>
  </p>
</div>
```

### HTML ルール

- ルート要素は必ず `div.mx-auto.py-4.bg-white.rounded-lg`
- 導入文は先頭の `p.text-gray-700.leading-relaxed.mb-6`
- 大見出しは `h2.text-2xl.font-semibold.text-gray-700.mb-4.border-l-4.border-pink-300.pl-2`
- 小見出しは `h3.text-xl.font-semibold.text-gray-700.mb-3`
- 本文段落は `p.text-gray-700.leading-relaxed`
- 箇条書きは `ul.list-disc.pl-6.text-gray-700.mb-6.space-y-3`
- CTA ブロックは固定クラス構成で末尾に必ず配置する
- 出典ブロックは `p.text-gray-500.text-sm.mt-4` で末尾に必ず配置する

## 記事構成ルール

記事は原則として次の順序で組み立てる。

1. 導入
2. 本文セクション1
3. 本文セクション2
4. 本文セクション3
5. まとめ
6. CTA
7. 出典

詳細ルール:

- 導入文は必須
- `h2` は原則 3〜4 個
- 最後の `h2` は原則「まとめ」系見出し
- 各 `h2` 直下は 1〜2 段落
- `h3` は詳細化が必要な場合のみ使う
- `ul` は症状、対策、注意点など列挙が自然な場合のみ使う
- 元ネタにまとめがなくても、読者向けの要点整理を補う

## 構成推定ルール

`source_content` の内容を読み、次のいずれかに寄せて構成する。

- 論点整理型:
  - 時事、論争、制度、対立意見が中心の内容
  - 各立場や論点を分けて整理する
- 啓発・解説型:
  - 病気、猫種、飼育知識、注意喚起が中心の内容
  - 仕組み、症状、対策、注意点を段階的に整理する

判断ルール:

- 対立する立場や議論の紹介が中心なら論点整理型
- 病気やケア方法の説明が中心なら啓発・解説型
- 明確な見出しがなくても、内容を再整理して `h2` を補う
- 箇条書きが不自然なら無理に使わない

## 文体ルール

- です・ます調で統一する
- 一般の猫オーナー向けに平易に書く
- 専門用語は使ってよいが、前後で簡潔に補足する
- 不必要に刺激的な表現は避ける
- 未確認情報は断定しない
- 医療・健康系では診断や治療を断定しない
- 必要に応じて獣医師への相談や受診を促す

## CTA ルール

CTA は固定ブロックとして扱い、次の文言を標準形とする。

- 見出し: `愛猫のプロフィールページを作りませんか？🐾`
- 本文: `CAT LINKでは、あなたの愛猫専用のプロフィールページを簡単に作成できます。かわいい写真や日常の記録をまとめて、猫仲間との交流も楽しみましょう！`
- ボタン: `CAT LINKでプロフィールを作成する`

CTA は本文の最後に 1 回だけ配置し、本文中に追加の宣伝文を差し込まない。

## 出典ルール

- 出典ブロックは必須
- 記事末尾に配置する
- リンクには `target="_blank"` を付与する
- `source_content` に URL や媒体名が含まれる場合は、それを使って出典名を整える
- 出典情報が不足している場合でも、出典ブロック自体は省略しない

出典情報不足時のフォールバック:

- URL が特定できない場合は、`href="#"` を使う
- 表示文言は `出典情報未提供（入力本文ベースで構成）` とする
- プレースホルダであることが明確に伝わる文言にする

## 禁止事項

- HTML クラス構成を崩すこと
- 元ネタ本文の長文コピペ
- 未確認情報の断定
- 過度に不安をあおる表現
- CTA なしで終了すること
- 出典ブロックなしで終了すること

## 生成手順

1. `source_content` から主題と主要論点を抽出する
2. 論点整理型か啓発・解説型かを判定する
3. 導入文を 1 段落で作る
4. `h2` を 3〜4 個立てる
5. 各 `h2` 直下に 1〜2 段落の本文を配置する
6. 列挙が自然なら `h3` と `ul` を追加する
7. 「まとめ」系の `h2` と締めの段落を追加する
8. 固定 CTA を追加する
9. 出典ブロックを追加する
10. HTML タグの閉じ漏れとクラスのゆれを確認する

## 品質チェック

生成後に次を確認する。

- 導入、本文、まとめ、CTA、出典が揃っている
- `h2` 数が 3〜4 個に収まっている
- 文体が「です・ます」で統一されている
- 段落が長すぎない
- 既存 `columns.content` の見た目を崩さないクラス構成になっている
- 出典情報不足時も出典ブロックが残っている

## 入力例

```text
イギリスで猫カフェの増加を受けて、動物福祉の観点から営業のあり方が議論になっている。保護猫譲渡につながるという肯定的な意見もある一方で、ストレスや健康リスクを懸念する声も強い。
```

## 期待される出力の考え方

- 導入で「猫カフェをめぐる議論」を提示する
- 本文では「懸念」「運営側の反論」「現実的な改善策」に分けて整理する
- 最後は読者にとっての意味を簡潔にまとめる
- 固定 CTA と出典ブロックを付ける
