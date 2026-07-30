# 30秒体験 GA4計測仕様

## 目的

未登録でのプロフィール作成開始から、プレビュー、認証、公開、プロフィールカード共有までのファネルを計測する。

「30秒」は、作成画面が操作可能になってから、写真と名前を満たしたプロフィールプレビューが初めて表示されるまでとする。

## イベント

| イベント名                       | 発火条件                                         | 重複防止                | パラメータ                             |
| -------------------------------- | ------------------------------------------------ | ----------------------- | -------------------------------------- |
| `quick_profile_create_start`     | 作成画面が操作可能になった                       | セッション内で最初の1回 | なし                                   |
| `quick_profile_photo_selected`   | 有効な写真を初めて選択した                       | セッション内で最初の1回 | なし                                   |
| `quick_profile_preview_ready`    | 写真と名前を満たしたプレビューが初めて表示された | セッション内で最初の1回 | `elapsed_time_ms`, `within_30_seconds` |
| `quick_profile_auth_open`        | プレビューから認証を開始した                     | セッション内で最初の1回 | `auth_method`                          |
| `quick_profile_auth_complete`    | 認証が完了した                                   | セッション内で最初の1回 | `auth_method`                          |
| `quick_profile_publish_complete` | 猫プロフィールの保存と公開が完了した             | セッション内で最初の1回 | なし                                   |
| `profile_card_download`          | 標準プロフィールカードの保存を実行した           | 利用者の操作ごと        | `card_format`                          |
| `profile_card_share`             | カードの共有を実行した                           | 利用者の操作ごと        | `card_format`, `share_destination`     |

## 許可値

- `auth_method`: `register`, `login`
- `card_format`: `standard_3_4`
- `share_destination`: `native`, `x`, `line`, `instagram`, `copy_link`, `other`
- `within_30_seconds`: `true`, `false`
- `elapsed_time_ms`: 0以上の整数

猫の名前、飼い主の名前、メールアドレス、プロフィールURL、自由入力文、画像URLは送信しない。

## 実装方法

`src/lib/quickProfileAnalytics.ts` のシングルトンを各画面から利用する。

```ts
quickProfileAnalytics.start();
quickProfileAnalytics.trackPhotoSelected();
quickProfileAnalytics.trackPreviewReady();
quickProfileAnalytics.trackAuthOpen('register');
quickProfileAnalytics.trackAuthComplete('register');
quickProfileAnalytics.trackPublishComplete();
quickProfileAnalytics.trackCardDownload();
quickProfileAnalytics.trackCardShare('native');
```

ファネルの開始時刻と送信済みイベント名だけを `sessionStorage` に保持する。プロフィール入力値は保存しない。公開完了後に再び `start()` を呼ぶと新しい計測セッションを開始する。

GA4またはWeb Storageが利用できない場合も、プロフィールの作成・公開・共有処理は継続する。

## 後続ISSUEでの組み込み

- #110: `create_start`, `photo_selected`, `preview_ready`
- #111: `auth_open`, `auth_complete`, `publish_complete`
- #113: `profile_card_download`, `profile_card_share`
- #114: トップページCTAから作成画面へ遷移した場合も、作成画面側で `create_start` を発火する

## GA4管理画面

イベントの収集自体にカスタム定義は不要。探索レポートでパラメータを使用する場合は、GA4管理画面で以下を登録する。

- カスタム指標: `elapsed_time_ms`（イベントスコープ、測定単位はミリ秒）
- カスタムディメンション: `within_30_seconds`, `auth_method`, `card_format`, `share_destination`（イベントスコープ）

公開完了を主要コンバージョンとして扱う場合は、`quick_profile_publish_complete`をキーイベントに設定する。
