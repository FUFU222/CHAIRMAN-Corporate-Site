# Tribal Knowledge

コードやコミットログには残っているが、入口文書からは辿りにくい情報をテーマ別にまとめる。
時系列ではなくテーマ別に整理し、「今どうなっているか」を1箇所で引けるようにする。
入口は [../HANDOFF.md](../HANDOFF.md)。

各項目は根拠（ファイルパス・コミットハッシュ）付きで記載する。根拠のない伝聞は載せない。

## 開発環境の罠

- **`tools/sync-layout.js` と `tools/partials/*.html` は死んでいる。**
  対象ファイルとして `index.html`, `about-us.html`, `contact.html`, `news.html`, `news-detail.html`,
  `privacy.html`, `livapon.html` を `public_html/` 直下からハードコードで探すが、Astro移行後の
  `public_html/` はディレクトリ形式（`about-us/index.html` 等）に変わっており、これらのファイル名は
  存在しない。実行すると `fs.readFileSync` が ENOENT で即失敗する。移行前（旧・素のHTMLサイト時代）
  のヘッダー/フッター同期ツールがそのまま取り残されている。

- **`npm run check`（`astro check`）は既知の型エラーを1件常に返す。**
  `astro-site/src/lib/article-enhancements.ts:72` の `.map((value) => ...)` で `value` が暗黙の `any`
  になっている（`ts(7006)`）。ビルド（`npm run build`）自体はこのエラーで止まらない。CIには
  `check`/`test` を実行するワークフローが存在しない（`preview-deploy.yml` は `npm run build` のみ、
  `prod-deploy.yml` は `public_html/` を転送するだけ）ため、この型エラーは自動検知されない構造になっている。

- **リポジトリ直下の `.env` と `config_private/microcms.php.example` の用途が特定できていない。**
  `MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY` / `API_KEY` を含むが、`astro-site/`, `tools/` 配下の
  どのコードからも `config_private` や `microcms.php` への参照が見つからない（grep調査済み）。
  astro-site用の設定は別途 `astro-site/.env` にあるため、これは別系統（旧実装時代のPHPベースの
  microCMS連携の残骸である可能性が高い）。用途が判明するまで削除しないこと。`.env` 自体は
  `.gitignore` の `*.env` パターンでgit管理外（漏洩リスクは低い）。

## 本番運用

- **本番デプロイはCIがビルドしない、preview環境とは非対称な構成になっている。**
  `prod-deploy.yml` は `public_html/**` の変更をトリガーに、コミットされているファイルをそのまま
  FTPSで転送するだけ。Astroのビルドはローカルで実行し、`dist/` の中身を手動で `public_html/` に
  コピーしてコミットする運用（コミットメッセージ「本番公開用ビルドを更新（〜）」が目印。例:
  `347c620`, `92e4ad1`）。一方 `preview-deploy.yml` は `codex/site-refresh-preview` ブランチへの
  push を受けてCI上で `npm run build` を実行し、`/preview/` へ配備する。この非対称性を知らずに
  「astro-siteをpushすれば本番も勝手にビルドされる」と誤解すると、本番に何も反映されない。

- **Google Apps Script（問い合わせフォームの送信先）はpushしただけでは本番に反映されない。**
  ソースは `astro-site/apps-script/contact.gs` としてgit管理されているが、実行環境はGoogle Apps
  Script側にあり、コード更新後は手動でコピペ＋再デプロイが必要（手順:
  [../astro-site/RECAPTCHA_SETUP.md](../astro-site/RECAPTCHA_SETUP.md) §4）。

- **reCAPTCHAのシークレットキーはこのリポジトリのどこにも存在しない。**
  `PUBLIC_RECAPTCHA_SITE_KEY`（公開キー）はGitHub Secrets等に置かれているが、検証用の
  `RECAPTCHA_SECRET_KEY` はApps ScriptのScript Propertiesにのみ設定されている。紛失時はGoogle側の
  管理画面から再取得する必要がある。

## 外部連携の全体像

- **新着情報**: microCMSではなく `astro-site/src/data/mockNews.ts` へのローカル直書き
  （`astro-site/src/lib/news.ts` が読む）。microCMS用のAPIは現時点で存在しない
  （[../astro-site/XSERVER_DEPLOY_RUNBOOK.md](../astro-site/XSERVER_DEPLOY_RUNBOOK.md) §2-1 に明記）。
- **SNSノウハウ集**: microCMS連携（`astro-site/src/lib/microcms.ts`）。
- **問い合わせフォーム**: Astro静的ページ → Google Apps Script（`/exec` URL）→ スプレッドシート保存
  ＋ メール通知。reCAPTCHA v2でボット対策。
- **アクセス解析**: Google Analytics（`PUBLIC_GA_ID`。`preview-deploy.yml` 内に直書きされている値
  `G-C1YTY7SVWF` は非秘匿情報として扱われている）。

## 意思決定の経緯と保留中の論点

- **本番切替は一度revertされている。** コミット `f749815`「feat: prepare astro production cutover」が
  直後に `31d036a`「Revert "feat: prepare astro production cutover"」で取り消され、後日改めて
  `77f2327`「feat: prepare preview-approved astro cutover」で切替が行われている
  （最終的に `642846c`「chore: disable maintenance mode after astro cutover」でメンテモード解除）。
  **revertの理由はコミットメッセージ・PR説明のどちらにも残っておらず不明。**
  何らかの不具合か確認不足で一度差し戻された可能性があるが、当時の判断根拠は追えない。

- **新着情報のmicroCMS移行は意図的に保留中。**
  将来的に更新主体が非エンジニアになった場合に検討する方針が
  [../astro-site/docs/2026-03-26-astro-cutover-runbook.md](../astro-site/docs/2026-03-26-astro-cutover-runbook.md)
  の補足に明記されている。現時点で着手する計画はない。

- **`news-detail.html?id=...` の個別記事への1:1リダイレクトは意図的に見送られた。**
  流入が少ない前提で `/sns-marketing/` への一律リダイレクトにまとめている（`public_html/.htaccess` 参照）。

- **未マージのfeatureブランチが多数残存している**（例: `fix-cache-control`, `fix-article-body-text`,
  `mobile-menu-visual-refresh`, `publish-livapon-release`, `unpublish-livapon-articles` 等）。
  本番反映が「ブランチをマージする」のではなく「ローカルでbuildした差分を直接`public_html`へ
  コミットする」フローで行われることが多いため、これらのブランチの内容が既に別の形で本番へ
  反映済みなのか、着手したが放置されたのかがブランチ単体では判別できない。着手前に必ず対象
  ブランチと現在の `main` の差分・本番の現状を突き合わせること。ブランチの削除は本ドキュメントの
  範囲では行っていない（判断材料の提示のみ）。

- **GitHub Issue #19「本番デプロイ失敗: run #6」（2026-07-16作成）がopenのまま。**
  Actions実行履歴を確認したところ、該当コミットは後続の実行で成功しており実害はないが、
  自動作成されたIssueを閉じる運用が徹底されていない。

## design-system/ の位置づけ（実装と乖離あり）

`design-system/chairman-corporate-refresh/MASTER.md` は初期のデザイン方針案で、以下の点が
実際に出荷されたデザインと一致しない。

| 項目 | MASTER.md の記載 | 実際（本番CSS・`apps-script/contact.gs`のブランドカラー定数から確認） |
|---|---|---|
| アクセントカラー | ピンク `#EC4899` | ダークレッド `#8d0820` |
| 見出しフォント | Libre Bodoni | Noto Serif JP系（`about-us`のCSSで確認） |
| カテゴリ想定 | Government/Public Service | 編集的コーポレートサイト |

`pages/home.md` のオーバーライドにも「Japanese headings use Zen Kaku Gothic New」という記載があるが、
実際の見出しは明朝体（`Hiragino Mincho ProN, Yu Mincho, "Noto Serif JP", serif`）が使われている。

**今後のスタイル判断は `design-system/` ではなく、実際のCSS（`astro-site/src/styles/`）と本番サイトの
表示を正とすること。** `design-system/` は初期構想の記録として残すに留める。
