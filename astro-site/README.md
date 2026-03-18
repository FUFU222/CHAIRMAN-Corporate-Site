# CHAIRMAN Astro Prototype

Astro + TypeScript + static output で構築した CHAIRMAN コーポレートサイト試作です。

## セットアップ

```bash
cd astro-site
npm install
npm run dev
```

`.env.example` を `.env` にコピーし、必要に応じて以下を設定します。

```bash
MICROCMS_SERVICE_DOMAIN=
MICROCMS_API_KEY=
MICROCMS_ENDPOINT=blog
PUBLIC_CONTACT_FORM_ENDPOINT=
PUBLIC_RECAPTCHA_SITE_KEY=
PUBLIC_GA_ID=
```

`MICROCMS_*` が未設定でも、`src/data/mockNews.ts` のモックデータで起動します。

reCAPTCHA v2 の設定は [RECAPTCHA_SETUP.md](./RECAPTCHA_SETUP.md) を参照してください。

Xserver 本番公開の手順は [XSERVER_DEPLOY_RUNBOOK.md](./XSERVER_DEPLOY_RUNBOOK.md) を参照してください。

## Apps Script 連携

1. `apps-script/contact.gs` を Google Apps Script プロジェクトへ貼り付ける
2. Script Properties に以下を設定する
   - `NOTIFY_TO`: 通知先メールアドレス
   - `SHEET_ID`: 保存先スプレッドシートID
   - `SHEET_NAME`: 任意。未設定時は `contact`
   - `RECAPTCHA_SECRET_KEY`: reCAPTCHA v2 のシークレットキー
   - `RECAPTCHA_ALLOWED_HOSTNAMES`: 任意。許可するホスト名をカンマ区切りで指定
3. `デプロイ > 新しいデプロイ > ウェブアプリ`
4. 実行ユーザー: 自分
5. アクセス権: `全員`
6. 発行された `/exec` URL を `PUBLIC_CONTACT_FORM_ENDPOINT` に設定
7. `PUBLIC_RECAPTCHA_SITE_KEY` に reCAPTCHA v2 のサイトキーを設定

このフォームは `fetch` ではなく通常の `POST` で送るので、Apps Script 側の CORS 設定は不要です。
reCAPTCHA の管理画面では、実際にフォームを表示するドメインを許可リストへ登録してください。

## ビルド

```bash
npm run build
```

`dist/` をそのまま Xserver の `public_html` へ配備できます。
