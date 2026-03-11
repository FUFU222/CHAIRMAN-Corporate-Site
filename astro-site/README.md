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
PUBLIC_GA_ID=
```

`MICROCMS_*` が未設定でも、`src/data/mockNews.ts` のモックデータで起動します。

## Apps Script 連携

1. `apps-script/contact.gs` を Google Apps Script プロジェクトへ貼り付ける
2. Script Properties に以下を設定する
   - `NOTIFY_TO`: 通知先メールアドレス
   - `SHEET_ID`: 保存先スプレッドシートID
   - `SHEET_NAME`: 任意。未設定時は `contact`
3. `デプロイ > 新しいデプロイ > ウェブアプリ`
4. 実行ユーザー: 自分
5. アクセス権: `全員`
6. 発行された `/exec` URL を `PUBLIC_CONTACT_FORM_ENDPOINT` に設定

このフォームは `fetch` ではなく通常の `POST` で送るので、Apps Script 側の CORS 設定は不要です。

## ビルド

```bash
npm run build
```

`dist/` をそのまま Xserver の `public_html` へ配備できます。
