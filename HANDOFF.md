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
| 問い合わせフォーム送信先 | Google Apps Script（`astro-site/apps-script/contact.gs` がソース。**デプロイはGoogle UIでの手動作業**。**管理アカウントは a.tanaka@chairman.jp**（2026-08-27に旧スクリプト所在不明のため作り直し。経緯は「6. 未完了・既知の課題」参照）） | エンドポイントURL: GitHub Actions Secret `CHAIRMAN_APPS_SCRIPT_ENDPOINT`。reCAPTCHAシークレットキー等の Script Properties は **Google Apps Script側にのみ存在し、このリポジトリには一切ない** |
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
| 問い合わせフォームのApps Scriptが見つからない | [docs/RUNBOOKS.md #Apps Script紛失時](docs/RUNBOOKS.md#問い合わせフォームのapps-scriptが見つからない場合作り直す) |
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
- microCMSの管理者アカウント所在（reCAPTCHAとApps Scriptはa.tanaka@chairman.jpと確認済み）
- Xserver・ドメイン・microCMS等の契約が田中さん個人アカウント紐付けになっていないか（個人カード払いは離脱時にサービス停止リスクがある）

**解決済み（2026-08-27）: Google Apps Scriptが所在不明だったため作り直した。**

経緯: 問い合わせフォームの実行基盤であるGoogle Apps Scriptについて、当初「a.tanaka@chairman.jpのはず」
という申告があったが、実際に本人が[script.google.com/home/all](https://script.google.com/home/all)
（オーナー権限フィルタ解除、共有済み、ゴミ箱まで確認）を調べても該当スクリプトが見つからなかった。
reCAPTCHA側の管理者はa.tanaka@chairman.jpと確認できた（[google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
のオーナー欄で確認）一方、Apps Script側だけどのアカウントで作られたか特定できず、**運用開始後、
誰も設定を変更・調査できない状態になっていたと考えられる**（実際に問い合わせが顧客に届いていなかった
可能性が高い。担当者からの報告あり）。gitのコミット履歴を遡っても、どのGoogleアカウントで
デプロイしたかを示す記録はリポジトリ内に見つからなかった。

対応: 旧スクリプトを探すのは断念し、a.tanaka@chairman.jpで新しいApps Scriptプロジェクト
「CHAIRMAN コーポレート問い合わせ（20260827作成）」を作成し直した。Script Propertiesは
`NOTIFY_TO=information@chairman.jp`、`RECAPTCHA_SECRET_KEY`（reCAPTCHA管理画面から取得した値）、
`RECAPTCHA_ALLOWED_HOSTNAMES=chairman-official.com`を設定（`SHEET_ID`は使わない方針のため未設定
＝スプレッドシートへの記録はされないが、メール送受信には影響しない）。新しい`/exec` URLを
GitHub Actions Secret `CHAIRMAN_APPS_SCRIPT_ENDPOINT`・[astro-site/.env.example](astro-site/.env.example)
に反映し、`public_html/contact/index.html`内の旧URL（2箇所: `action`属性と`data-endpoint`属性）を
新URLに置換して本番へ反映した（microCMS認証情報がこの環境に無く`npm run build`によるフル再ビルドが
できなかったため、コミット`92e4ad1`と同様に対象箇所のみ文字列置換で対応）。

**今後の注意**: 新しいApps Scriptの管理アカウントはa.tanaka@chairman.jpで確定している。ただし
「なぜ元のスクリプトのアカウントが分からなくなったか」自体は未解明（外部委託時の設定か、
過去の別担当者・別セッションによるものかは不明）。今後Google系サービスを新規に設定する際は、
**必ずa.tanaka@chairman.jpなど会社として追跡できるアカウントに統一し、プロジェクト名も
「無題のプロジェクト」のままにしない**（今回の新規作成分は日付入りの名前を付けている）。
実際にメール到達を確認するテスト送信は本ドキュメント更新時点でまだ実施していない。
次に触る人は[docs/RUNBOOKS.md](docs/RUNBOOKS.md)の該当手順で実送信テストを行い、
通知メール・自動返信メールの両方が届くことを確認すること。

## 7. AIエージェントと引き継ぐ場合

- 作業規約は [AGENTS.md](AGENTS.md) に集約。ビルド/テスト/lintコマンド、禁止事項、品質ゲートはそちらを正とする。
- 本番影響のある操作（`public_html/` への反映、`.htaccess` 変更、Apps Scriptの再デプロイ、secretのローテーション）は必ず事前確認を取ること。
- ドキュメントを更新する際は、本ファイルのような「入口文書」に事実を書き足さず、事実は各正本（コード・Runbook・TRIBAL-KNOWLEDGE）に置き、ここはリンクのみ更新すること。
