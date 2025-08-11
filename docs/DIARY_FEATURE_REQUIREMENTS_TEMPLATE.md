# CAT LINK - ペット日記機能 要件定義書（v1.9）

## 1. 概要

### 1.1 目的
飼い主が日々の猫の体調や行動を記録できる「ペット日記」機能をCAT LINKに追加する。  
これにより、猫の体調変化にいち早く気づけるようにし、飼い主にとって価値ある健康管理ツールを目指す。

### 1.2 機能の全体像
- 猫ごと・日単位でイベントを記録（例：ごはん、トイレ、通院など）
- 1日1件の自由記述メモ（ひとこと日記）も記録可能
- タイムライン＆カレンダーで閲覧・管理
- 記録の公開範囲設定（非公開 / ログインユーザー限定 / 全体公開）

---

## 2. 機能要件

### 2.1 記録機能

#### ✅ 登録できるイベント（MVP）
- ごはん
- 水
- トイレ
- 遊び
- 通院
- 体重
- メモ（1日1件）

#### 📝 各イベントの構造
- event_type（必須）: 種別ID
- occurred_at（必須）: 発生日時
- value（任意）: 数値（例: 体重 = 4.2）
- unit（任意）: 単位（例: kg, g, ml など）
- memo（任意）: 自由記述（最大255文字）
- image_url（任意）: 画像1枚まで
- tags（任意）: 複数タグ指定可（tag_id[]）

#### 🐾 イベント種別ごとのunit候補

| イベント     | 単位候補               |
|------------|---------------------|
| ごはん     | g, kcal             |
| 水         | ml（固定）           |
| トイレ     | 固定なし             |
| 遊び       | 分（追加）            |
| 通院       | 固定なし             |
| 体重       | kg, g              |
| メモ       | なし（memoのみ）      |

### 2.2 メモ（1日1件）制約

- UI: 同日にすでに「メモ」が存在する場合、イベント選択肢から除外（非活性化）
- API: 保存時にサーバー側で重複チェックを行い、重複があればバリデーションエラーを返す

### 2.3 タグ

- タグはユーザー単位で管理（user_id + name）
- 記録作成時に新規タグを追加可能
- 入力時に補完候補を表示
- API側で以下の処理を行う:
  1. 受け取ったtag名ごとに該当ユーザーのtagsテーブルを検索
  2. なければINSERT
  3. IDを全て取得し、taggingsテーブルに登録（トランザクションで処理）

### 2.4 公開範囲（cats.diary_public_level）

- 値: `private`, `public_to_link_users`, `public_to_all`
- デフォルト: `private`
- 飼い主マイページ上の猫カードから日記ページへリンク（公開されていれば他者も閲覧可能）

---

## 3. UI設計（ワイヤー略）

### 3.1 飼い主マイページ

- 猫ごとのカードに「日記を見る」リンクを追加

### 3.2 日記カレンダー画面

- 初期表示は「今日の日付」の記録一覧
- 左上: 猫選択ドロップダウン
- 上部: カレンダー（記録がある日にドット表示）
- 右上: 公開範囲変更リンク
- 中央: 日付ごとの記録タイムライン
- 右下: ＋ボタン（記録追加）

### 3.3 記録登録・編集画面

- モーダルまたは画面遷移で表示
- 選択中のイベントに応じて `value + unit` 入力欄の表示切替
- 入力補助:
  - 過去3件の同一イベント履歴を表示
  - 「コピー」ボタンで内容をフォームに反映可能

---

## 4. テーブル設計（v1.9）

### ✅ cats テーブル（変更）

```sql
ALTER TABLE cats
ADD COLUMN diary_public_level TEXT DEFAULT 'private' NOT NULL
CHECK (diary_public_level IN ('private', 'public_to_link_users', 'public_to_all'));
```

### ✅ pet_logs テーブル（新規）

```sql
CREATE TABLE pet_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id UUID NOT NULL REFERENCES cats(id),
  event_type_id UUID NOT NULL REFERENCES event_types(id),
  occurred_at TIMESTAMP NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  memo TEXT,
  image_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### ✅ event_types テーブル（変更）

```sql
ALTER TABLE event_types
ADD COLUMN display_order INTEGER,
ADD COLUMN has_value_and_unit BOOLEAN DEFAULT FALSE;
```

### ✅ tags テーブル（新規）

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

※ ユーザー単位での一意制約（user_id + name）は設けない

### ✅ taggings テーブル（新規）

```sql
CREATE TABLE taggings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_log_id UUID NOT NULL REFERENCES pet_logs(id),
  tag_id UUID NOT NULL REFERENCES tags(id),
  created_at TIMESTAMP DEFAULT now()
);
```

---

## 5. バリデーションルール（フロント／バックエンド共通）

| 項目         | ルール例                              |
|--------------|--------------------------------------|
| memo         | 最大255文字                           |
| tags.name    | 最大50文字                            |
| details.value| 数値、最小0（マイナス不可）            |
| image        | 最大1枚、最大5MB                      |
| event_type   | 必須                                 |
| occurred_at  | 必須                                 |

---

## 6. エラーハンドリングとローディング

- API通信エラー時は `react-hot-toast` でトースト表示
- 入力値エラーはフォーム入力欄を赤枠にして補足メッセージ表示
- 保存ボタン押下時はスピナー表示、二重送信防止
- ログ取得時はスケルトンスクリーンを表示

---

## 7. 画像アップロードのフロー

- Supabase Storage を使用
- フロントエンドから直接アップロードする（既存実装を踏襲）
- 公開URLを取得後、image_urlとしてAPIに送信

---

## 8. 補足メモ

- `pet_logs` に `user_id` は不要。cat_id → cats → user_id 経由で参照可能。
- 「メモ」イベントは日付単位で1件制約あり。UIとAPI両面で制御。
- tagsはAPIパラメータで `tag_id[]` として送信。
- タグ作成・編集・削除は別APIで対応可能（要実装）

---

## 9. 今後の展望（参考）

- カスタムイベント追加機能（event_typesへのPOST）
- アナリティクス（グラフ表示など）