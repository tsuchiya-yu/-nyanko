# コードレビュー言語：日本語必須 / CODE REVIEW LANGUAGE: JAPANESE REQUIRED

**重要：このリポジトリのすべてのコードレビューは必ず日本語で行ってください。英語でのレビューは受け付けません。**
**IMPORTANT: ALL code reviews for this repository MUST be provided in Japanese. Reviews in English are NOT acceptable.**

# コードレビュー指針

## 言語設定 / Language Settings
- すべてのコードレビューコメントは必ず日本語で提供すること。これは最優先事項です。
- All code review comments MUST be provided in Japanese. This is the highest priority requirement.
- 技術用語は必要に応じて英語のまま使用しても構いませんが、説明文は必ず日本語で記述してください。
- Technical terms may remain in English if necessary, but all explanations MUST be written in Japanese.

## コーディング規則

### 全般
- DRY（Don't Repeat Yourself）原則を守る
- KISS（Keep It Simple, Stupid）原則を守る
- 関数やメソッドは単一責任の原則に従う
- 適切なエラーハンドリングを実装する
- 不要なコメントアウトコードは残さない

### 命名規則
- 変数名、関数名は意図が明確に伝わる名前にする
- 略語の使用は広く知られているものに限定する
- Reactコンポーネントはパスカルケース（PascalCase）で命名
- 変数や関数はキャメルケース（camelCase）で命名
- 定数は大文字のスネークケース（SNAKE_CASE）で命名

### TypeScript/JavaScript
- 適切な型定義を使用する
- any型の使用は最小限にする
- nullよりもundefinedを優先する
- オプショナルチェイニングと空値合体演算子を活用する
- 非同期処理には適切にasync/awaitを使用する
- コールバック地獄を避ける

### React
- 関数コンポーネントとHooksを優先する
- useMemoとuseCallbackを適切に使用してパフォーマンスを最適化する
- コンポーネントは小さく保ち、単一の責任を持たせる
- Propsには適切な型定義を行う

### テスト
- ユニットテストはコードの主要な機能をカバーする
- テストは読みやすく、目的が明確であること
- テストデータは実際のユースケースを反映すること

### パフォーマンス
- 不必要な再レンダリングを避ける
- 巨大なリストにはバーチャライゼーションを検討する
- 画像は適切に最適化する

### セキュリティ
- ユーザー入力は適切にバリデーションする
- 機密情報を直接コードに埋め込まない
- XSS攻撃に対する防御策を講じる

## レビュー重点項目
- 機能要件が満たされているか
- コードの読みやすさと保守性
- パフォーマンスへの影響
- セキュリティリスク
- テストの充実度 