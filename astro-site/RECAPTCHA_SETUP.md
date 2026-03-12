# reCAPTCHA v2 Setup

問い合わせフォームの reCAPTCHA v2 を有効化するための設定一覧です。

## 1. Astro 側の環境変数

`.env` に以下を設定します。

```bash
PUBLIC_CONTACT_FORM_ENDPOINT=
PUBLIC_RECAPTCHA_SITE_KEY=
```

- `PUBLIC_CONTACT_FORM_ENDPOINT`
  Apps Script の Web アプリ `/exec` URL
- `PUBLIC_RECAPTCHA_SITE_KEY`
  Google reCAPTCHA v2 Checkbox のサイトキー

注意:
- `PUBLIC_` 付きの値はブラウザへ配信されます
- `PUBLIC_RECAPTCHA_SITE_KEY` は公開キーなので問題ありません
- シークレットキーは Astro 側に置かないでください

## 2. Apps Script 側の Script Properties

Apps Script の `プロジェクトの設定 > スクリプト プロパティ` に以下を設定します。

- `NOTIFY_TO`
  通知先メールアドレス
- `SHEET_ID`
  保存先スプレッドシート ID
- `SHEET_NAME`
  任意。未設定時は `contact`
- `RECAPTCHA_SECRET_KEY`
  Google reCAPTCHA v2 Checkbox のシークレットキー
- `RECAPTCHA_ALLOWED_HOSTNAMES`
  任意。フォーム表示を許可するホスト名をカンマ区切りで指定

設定例:

```text
RECAPTCHA_ALLOWED_HOSTNAMES=chairman-official.com,www.chairman-official.com,preview.example.com
```

## 3. Google reCAPTCHA 管理画面での作業

Google reCAPTCHA 管理画面で以下を実施します。

1. `reCAPTCHA v2` を選択
2. `I'm not a robot` Checkbox を選択
3. フォームを表示するドメインを登録

登録対象の例:
- 本番: `chairman-official.com`
- 本番 `www` を使うなら: `www.chairman-official.com`
- プレビュー用ドメイン
- ステージング用ドメイン

注意:
- ここに登録するのは Apps Script のドメインではなく、フォームを表示するサイトのドメインです
- プレビュー URL が変動する運用なら、固定プレビュー用ドメインを用意した方が安定します

## 4. Apps Script のデプロイ

コード更新後は Apps Script を再デプロイしてください。

手順:
1. `apps-script/contact.gs` を Apps Script に反映
2. `デプロイ > デプロイを管理`
3. 既存の Web アプリを編集して再デプロイ
4. 実行ユーザーは自分
5. アクセス権は `全員`

補足:
- Script Properties の値変更だけなら通常は再デプロイ不要です
- ただし `contact.gs` のコードを更新した場合は再デプロイが必要です

## 5. 現在の実装が参照している値

フロント:
- `PUBLIC_RECAPTCHA_SITE_KEY`
- `PUBLIC_CONTACT_FORM_ENDPOINT`

Apps Script:
- `RECAPTCHA_SECRET_KEY`
- `RECAPTCHA_ALLOWED_HOSTNAMES`
- `NOTIFY_TO`
- `SHEET_ID`
- `SHEET_NAME`

## 6. 動作確認チェックリスト

1. フォームに reCAPTCHA のチェックボックスが表示される
2. reCAPTCHA 未チェックでは送信できない
3. チェック後に送信すると成功メッセージが出る
4. スプレッドシートに保存される
5. 通知メールが届く
6. `RECAPTCHA_ALLOWED_HOSTNAMES` に入っていないドメインでは送信失敗になる

## 7. 失敗時の見どころ

- `reCAPTCHA の設定後にボット対策が有効になります。`
  `PUBLIC_RECAPTCHA_SITE_KEY` 未設定
- `reCAPTCHA の設定が未完了です。`
  Astro 側の公開キー未設定
- `recaptcha_not_configured`
  Apps Script 側の `RECAPTCHA_SECRET_KEY` 未設定
- `recaptcha_hostname_mismatch`
  ホスト名不一致。Google 側の登録ドメインまたは `RECAPTCHA_ALLOWED_HOSTNAMES` を確認
- `reCAPTCHA を読み込んでいます。`
  API スクリプト未読込。ネットワークまたは広告ブロッカーの影響を確認

## 8. セキュリティ上の注意

- `PUBLIC_RECAPTCHA_SITE_KEY` は公開して問題ありません
- `RECAPTCHA_SECRET_KEY` は Apps Script の Script Properties のみに置いてください
- `.env` にシークレットキーを書かないでください
- reCAPTCHA だけでなく、既存のレートリミットと併用する前提です
