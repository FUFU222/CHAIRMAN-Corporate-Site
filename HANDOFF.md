# HANDOFF

このリポジトリを初めて触る人（人間・AIエージェント問わず）向けの入口文書。
事実の一次情報は各ファイルに置き、ここはそこへの導線と、コードから読み取れない情報の置き場所だけを担う。

## 1. これは何か

株式会社CHAIRMANのコーポレートサイト（`https://chairman-official.com/`）のリポジトリ。

- 本番サイトの実体は静的ファイル一式。ソースは Astro（`astro-site/`）で、ビルド結果を `public_html/` に**手動でコピー＆コミット**したものを Xserver へ配備している（自動ビルドではない。詳細は [docs/TRIBAL-KNOWLEDGE.md](docs/TRIBAL-KNOWLEDGE.md) の「本番運用」）。
- 旧・素のHTMLサイトから2026年前半にAstro移行済み。移行手順書（`astro-site/XSERVER_DEPLOY_RUNBOOK.md` 等）は移行完了後の現在では**歴史的記録**であり、正本ではない。詳細は各文書冒頭の注記を参照。
- 新着情報は `astro-site/src/data/mockNews.ts` へのローカル直書き、SNSノウハウ集は microCMS 連携。問い合わせフォームは Astro 静的ページ + Google Apps Script。

## 2. 読み順

### 初日（環境を立ち上げる）
1. この文書
2. [astro-site/README.md](astro-site/README.md) — ローカルセットアップ
3. [AGENTS.md](AGENTS.md) — 開発時の規約・禁止事項

### 初週（変更をデプロイして本番反映まで回す）
1. [docs/RUNBOOKS.md](docs/RUNBOOKS.md) — 定型イベントの手順書一覧
2. [docs/TRIBAL-KNOWLEDGE.md](docs/TRIBAL-KNOWLEDGE.md) — 本番運用の罠

### 背景を深く知りたいとき
- [astro-site/docs/2026-03-26-astro-cutover-runbook.md](astro-site/docs/2026-03-26-astro-cutover-runbook.md)（歴史的記録：Astro本番切替時の手順）
- [astro-site/XSERVER_DEPLOY_RUNBOOK.md](astro-site/XSERVER_DEPLOY_RUNBOOK.md)（歴史的記録：切替前に書かれたRunbook）
- [design-system/chairman-corporate-refresh/](design-system/chairman-corporate-refresh/)（歴史的記録：初期デザイン方針案。**実際の出荷デザインとは一致しない**。理由は TRIBAL-KNOWLEDGE 参照）

## 3. インフラ地図とsecretの所在

| 項目 | 実体 | secretの所在 |
|---|---|---|
| 本番ホスティング | Xserver（FTPS配備） | GitHub Actions Secrets: `XSERVER_HOST` / `XSERVER_USERNAME` / `XSERVER_PASSWORD`（`.github/workflows/prod-deploy.yml` が参照） |
| ドメイン | `chairman-official.com` | レジストラ・支払い方法は未確認（本文書末尾「要確認」参照） |
| SNSノウハウ集CMS | microCMS | GitHub Actions Secrets: `MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY`。ローカルは `astro-site/.env`（gitignore対象、値は各自取得） |
| 問い合わせフォーム送信先 | Google Apps Script（`astro-site/apps-script/contact.gs` がソース。**デプロイはGoogle UIでの手動作業**。**実行アカウントは a.tanaka@chairman.jp**、個人アカウント依存。詳細は「6. 未完了・既知の課題」参照） | エンドポイントURL: GitHub Actions Secret `CHAIRMAN_APPS_SCRIPT_ENDPOINT`。reCAPTCHAシークレットキー等の Script Properties は **Google Apps Script側にのみ存在し、このリポジトリには一切ない** |
| Bot対策 | Google reCAPTCHA v2 | サイトキー: `CHAIRMAN_RECAPTCHA_SITE_KEY`（公開情報扱い）。シークレットキーはApps Script側のみ |
| アクセス解析 | Google Analytics | `PUBLIC_GA_ID`（`.github/workflows/preview-deploy.yml` 内に値が直書きされている＝非秘匿情報） |
| CI/CD | GitHub Actions | Secrets一覧は GitHub リポジトリの Settings > Secrets and variables > Actions で確認 |
| 障害通知 | GitHub Issue自動起票 | `prod-deploy.yml` のデプロイ失敗時に自動作成。運用は [docs/RUNBOOKS.md](docs/RUNBOOKS.md) 参照 |

上表の `MICROCMS_*` / `CHAIRMAN_APPS_SCRIPT_ENDPOINT` / `CHAIRMAN_RECAPTCHA_SITE_KEY` / `PUBLIC_GA_ID` は
いずれも `preview-deploy.yml` が参照する値であり、`prod-deploy.yml` はこれらを一切参照しない
（本番はCIでビルドしないため。[docs/TRIBAL-KNOWLEDGE.md](docs/TRIBAL-KNOWLEDGE.md) 参照）。

`config_private/microcms.php.example` とリポジトリ直下の `.env` はどのコードからも参照されておらず、旧実装の残骸の可能性が高い（未使用と断定はしていない。[docs/TRIBAL-KNOWLEDGE.md](docs/TRIBAL-KNOWLEDGE.md) 参照）。

## 4. 定型イベント → 手順書マップ

| 定型イベント | 手順書 |
|---|---|
| 新着情報を1件追加する | [docs/RUNBOOKS.md #新着情報を追加する](docs/RUNBOOKS.md#新着情報お知らせを追加する) |
| SNSノウハウ集の記事を反映する | [docs/RUNBOOKS.md #SNSノウハウ集](docs/RUNBOOKS.md#snsノウハウ集microcms記事を反映する) |
| 通常の本番デプロイ | [docs/RUNBOOKS.md #本番デプロイ](docs/RUNBOOKS.md#本番デプロイ通常フロー) |
| 本番デプロイが失敗した | [docs/RUNBOOKS.md #デプロイ失敗時対応](docs/RUNBOOKS.md#本番デプロイ失敗時の対応) |
| 問い合わせフォーム（Apps Script）を更新する | [docs/RUNBOOKS.md #Apps Script更新](docs/RUNBOOKS.md#問い合わせフォームapps-scriptを更新する) |
| 本番で表示崩れ等が起きてロールバックしたい | [docs/RUNBOOKS.md #ロールバック](docs/RUNBOOKS.md#本番ロールバック) |

## 5. 関係者

- 現担当: 田中章（a.tanaka@chairman.jp） / 代表: 田中 透
- 外部委託・制作会社: 記録なし（不明。契約があるなら要確認）
- ドメイン・Xserver・microCMS・Google系サービスの契約者: 未確認（下記「要確認」参照）

## 6. 未完了・既知の課題

正直に列挙する。ここにある = 「知らずに触ると事故る」候補。

- **`tools/sync-layout.js` と `tools/partials/` は死んでいる**: Astro移行前の `about-us.html` 等（拡張子付きの単一HTML）を対象にしたスクリプトだが、移行後の `public_html/` にはそのファイルが存在しない（ディレクトリ形式のURLに変わった）。実行すると即座にエラーで落ちる。削除するかは未判断。
- **`npm run check` が1件のTypeScriptエラーを継続的に抱えている**（`astro-site/src/lib/article-enhancements.ts:72`、暗黙any）。ビルド自体は通るため見過ごされている。CIでは `check`/`test` を実行していないため誰も気づかない構造になっている。
- **GitHub Issue #19「本番デプロイ失敗: run #6」がopenのまま放置**（2026-07-16）。実際には直後の再実行で成功しており実害はないが、issueが閉じられていない。
- **未マージのfeatureブランチが多数残存**（`fix-cache-control`, `mobile-menu-visual-refresh`, `publish-livapon-release` 等）。本番反映がブランチのマージではなく「ローカルbuild結果を直接 `public_html/` にコミット」で行われることが多いため、ブランチの内容が既に別の形で本番へ反映済みなのか、未反映のまま放置されているのか、ブランチ単位では判別できない。着手前に対象ブランチの差分と本番の現状を必ず突き合わせること。
- **`f749815`（本番切替）が一度 `31d036a` でrevertされ、後日改めて切替されている**。revertの理由はコミットメッセージに残っておらず不明。
- **ルート直下の `.env` と `config_private/microcms.php.example` の用途が特定できていない**（コード内に参照なし）。誤って削除すると何かが壊れるリスクもゼロではないため、正体を確認してから整理すること。
- **design-system/ が実装と乖離**: 初期デザイン方針案（ピンクアクセント、Libre Bodoni、Government/Public Serviceカテゴリ）のまま更新されておらず、実際の出荷デザイン（ダークレッド `#8d0820`、Google Fontsを使わないシステムフォント運用、編集的コーポレートトーン）と一致しない。今後のスタイル判断の参照先にしないこと。

### 要確認（契約・支払い関連 — コードからは分からない）

以下はPhase 5相当の情報で、リポジトリ内に見当たらない。分かり次第この節を更新すること。

- Xserverの契約者・支払い方法・契約更新期限
- `chairman-official.com` ドメインのレジストラ・支払い方法・更新期限（自動更新設定の有無）
- microCMS / reCAPTCHA の管理者アカウント所在
- Xserver・ドメイン・microCMS等の契約が田中さん個人アカウント紐付けになっていないか（個人カード払いは離脱時にサービス停止リスクがある）

**Google Apps Script（問い合わせフォームの実行基盤）の管理アカウントが特定できていない（2026-08-27時点、要再調査）**:
当初「a.tanaka@chairman.jpのはず」という申告があったが、そのアカウントで
[script.google.com/home/all](https://script.google.com/home/all) を確認したところ該当スクリプトが
見当たらなかった。つまり**現時点でこのApps Scriptを編集・調査できる人が誰もいない可能性がある**。
これは離脱リスクという将来の話ではなく、**今すでに管理不能になっているかもしれない**という現在の問題。

分かっている事実（コードで裏取り済み）:
- 本番で使われているデプロイURLは
  `https://script.google.com/macros/s/AKfycbzqNH2O1z-piHM2Nzk3NomDc51pehOxdnfm0U9WW616sINKEtqUd9KcVvj5XtH-tjxt/exec`
  （[public_html/contact/index.html](public_html/contact/index.html)に埋め込み済みの値と
  [astro-site/.env.example](astro-site/.env.example)の値が一致することで確認）
- このURLへのGETリクエストは200を返し、`astro-site/apps-script/contact.gs:43`の`doGet()`が返す
  "CHAIRMAN contact endpoint is running." という文言がそのまま返ってくる。**デプロイ自体は生きている**
- gitのコミット履歴（`git log --follow -- astro-site/apps-script/contact.gs`）を遡っても、
  どのGoogleアカウントでデプロイしたかを示す記録はリポジトリ内に無い
  （git commit authorはtnkakr_0817@icloud.comだが、これはGitHubの識別情報でありGoogleアカウントとは無関係）

次に試すべきこと（未実施）:
- reCAPTCHA管理画面（[google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)）に
  心当たりのある各Googleアカウントでログインし、サイトキー
  `6LdiwYcsAAAAAFFwCOlutzJiA2OshOrT-hBR0NIp`（`chairman-official.com`向け）の管理者を探す。
  Apps Scriptとreqcaptchaは同じ人が同時期に設定した可能性が高く、Apps Script本体より
  reCAPTCHA管理画面の方が心当たりのあるアカウントを絞り込みやすい
- Google Driveの「ゴミ箱」「自分と共有」も確認する（標準的なスタンドアロンApps Scriptなら
  デプロイしたアカウントのDriveに必ず存在するはずで、home/allに出ないのはゴミ箱・アーカイブ・
  別アカウントのいずれか）
- 見つからない場合、`NOTIFY_TO`・`RECAPTCHA_SECRET_KEY`等のScript Propertiesを誰も変更できない
  状態が既に発生している。復旧させるには、Apps Scriptを新規に作り直し
  （ソースは[astro-site/apps-script/contact.gs](astro-site/apps-script/contact.gs)にある）、
  新しい`/exec` URLを`CHAIRMAN_APPS_SCRIPT_ENDPOINT`（GitHub Secrets）と
  `astro-site/.env.example`に反映し直し、`npm run build`し直して`public_html/`へ反映する必要がある

## 7. AIエージェントと引き継ぐ場合

- 作業規約は [AGENTS.md](AGENTS.md) に集約。ビルド/テスト/lintコマンド、禁止事項、品質ゲートはそちらを正とする。
- 本番影響のある操作（`public_html/` への反映、`.htaccess` 変更、Apps Scriptの再デプロイ、secretのローテーション）は必ず事前確認を取ること。
- ドキュメントを更新する際は、本ファイルのような「入口文書」に事実を書き足さず、事実は各正本（コード・Runbook・TRIBAL-KNOWLEDGE）に置き、ここはリンクのみ更新すること。
