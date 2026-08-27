# Repository Instructions

株式会社CHAIRMANコーポレートサイト（`https://chairman-official.com/`）。
プロジェクト全体像・運用手順は [HANDOFF.md](HANDOFF.md) を先に読むこと。

## 構成

- `astro-site/` — サイトのソース（Astro + TypeScript、`output: "static"`）。開発・変更対象はここ。
- `public_html/` — 本番に配備される静的ファイル一式。**手で編集しない。** `astro-site/` をビルドした
  結果をコピーしてコミットする場所（詳細: [docs/RUNBOOKS.md](docs/RUNBOOKS.md)）。
- `tools/`, `design-system/` — 現在は生きていない／実装と乖離した資料。詳細は
  [docs/TRIBAL-KNOWLEDGE.md](docs/TRIBAL-KNOWLEDGE.md) を参照してから触ること。
- `docs/` — Runbook・暗黙知（このリポジトリのルート）。`astro-site/docs/` は移行当時の歴史的記録。

## ローカル開発

```bash
cd astro-site
npm install
npm run dev      # 開発サーバー
npm run build    # 本番相当ビルド（dist/ を生成）
npm run check    # 型チェック（astro check）
npm test         # node --test
```

`npm run check` は既知の型エラーを1件常に返す（`src/lib/article-enhancements.ts:72`）。新規のエラーが
増えていないかで判断すること。詳細は [docs/TRIBAL-KNOWLEDGE.md](docs/TRIBAL-KNOWLEDGE.md)。

## 本番反映（重要）

本番デプロイはCIがビルドしない。`astro-site/` の変更を本番に出すには、ローカルでビルドした
`dist/` の中身を手動で `public_html/` にコピー・コミット・pushする必要がある。この手順を踏まずに
`astro-site/` だけ変更してpushしても本番には何も反映されない。詳細手順は
[docs/RUNBOOKS.md](docs/RUNBOOKS.md)。

## 触ってはいけない・注意が必要な領域

- `tools/sync-layout.js` と `tools/partials/` — Astro移行前の対象ファイルを探すため、実行すると
  即座に失敗する。現状は死んでいるツール。
- `astro-site/apps-script/contact.gs` — git上のソースを編集しても、Google Apps Script側で手動の
  コピペ＋再デプロイをしない限り本番の挙動は変わらない。
- `public_html/.htaccess` — HTTPS強制・セキュリティヘッダー・キャッシュ制御・XPageSpeed設定を含む。
  `### BEGIN XPageSpeed ###` ブロックは編集しない。変更前に差分を必ず確認する。
- `design-system/` — 初期デザイン方針案であり、実際の出荷デザインと一致しない
  （[docs/TRIBAL-KNOWLEDGE.md](docs/TRIBAL-KNOWLEDGE.md) 参照）。スタイル判断の根拠にしない。
- secret（`XSERVER_*`, `MICROCMS_API_KEY`, reCAPTCHAシークレットキー等）をツール出力・ログ・
  コミットに平文で残さない。env dumpが必要な場合は値をマスクする。

## 品質ゲート

- マージ前に `npm run check` と `npm test` を実行し、既知の1件以外のエラーが増えていないか確認する。
- 本番影響のある変更（`public_html/` への反映、`.htaccess`変更、Apps Scriptの再デプロイ、secretの
  ローテーション）は事前にユーザーへ確認する。
- コミットメッセージは日本語・絵文字なし。本番ビルド反映コミットは
  `chore: 本番公開用ビルドを更新（〜）` の慣例に合わせる。

## Playwright / ブラウザ自動化

- Do not use Playwright or any browser automation for routine UI/CSS checks by default. It interferes with the user's local desktop session.
- For layout and styling work, prefer code inspection, local builds, and the user's own visual confirmation.
- Only use Playwright when the user explicitly asks for browser automation or when no other reasonable verification path exists.
- If Playwright becomes truly necessary, announce that intent before launching it.
