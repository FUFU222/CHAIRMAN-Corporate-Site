# Runbooks

定型的に発生する作業の手順書。トリガー・事前確認・手順・検証方法・失敗時のロールバックを記載する。
入口は [../HANDOFF.md](../HANDOFF.md)。

## 前提: このサイトの本番反映の仕組み

**本番デプロイはCIが自動ビルドしない。** `.github/workflows/prod-deploy.yml` は `public_html/` の中身を
コミットされたまま Xserver へFTPSで転送するだけ。したがって以下の作業はすべて共通して次の流れになる。

1. `astro-site/` のソースを変更する
2. ローカルで本番用環境変数を指定して `npm run build` する
3. 生成された `astro-site/dist/` の中身を `public_html/` へコピーする（`dist` フォルダごと置かない。中身だけ）
4. `git status` で意図した差分だけになっているか確認する
5. コミット（コミットメッセージは `chore: 本番公開用ビルドを更新（〜）` の慣例に合わせる）
6. `main` へpush → `prod-deploy.yml` が自動でFTPS配備 → デプロイ後に本番トップページへの疎通確認(`curl`)まで自動実行される

preview環境（`codex/site-refresh-preview` ブランチ → `/preview/` 配下）はCIが自動ビルドする点で本番と非対称。
詳細は [../docs/TRIBAL-KNOWLEDGE.md](TRIBAL-KNOWLEDGE.md) の「本番運用」を参照。

---

## 新着情報（お知らせ）を追加する

**トリガー**: 新しいお知らせ・プレスリリースを公開したい。

**事前確認**:
- 掲載する画像がある場合は `astro-site/src/assets/images/news/<slug>/` 相当に配置する
- 記事本文・日付・カテゴリが確定している

**手順**:
1. `astro-site/src/data/mockNews.ts` に記事オブジェクトを追加する（既存の記事を参考にする。`buildExcerpt` で抜粋は自動生成される）
2. `cd astro-site && npm run build`
3. `dist/` の中身を `public_html/` にコピー（`news/` 配下と、`_astro/` のハッシュ付きアセット、`sitemap.xml` が更新対象になる）
4. `git status --short` で差分を確認し、意図しないファイルが混ざっていないか見る
5. コミット、`main` へpush

**検証方法**:
- Actions タブで `Deploy to Xserver (Production)` が成功していること
- `https://chairman-official.com/news/` に新しい記事が表示されること
- 記事詳細ページ（`https://chairman-official.com/news/<slug>/`）が正しく表示されること
- ブラウザのハードリロード（`Cmd+Shift+R` / `Ctrl+Shift+R`）で確認する（`_astro/` はハッシュ付きだが、HTMLは `no-cache` 設定のため通常は反映されるはず）

**失敗時のロールバック**: [#本番ロールバック](#本番ロールバック) を参照。

---

## SNSノウハウ集（microCMS）記事を反映する

**トリガー**: microCMS側で記事を公開・更新した後、本番サイトへ反映したい。

**事前確認**:
- microCMS管理画面で記事のステータスが公開になっている
- ローカルに `astro-site/.env` があり `MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY` / `MICROCMS_ENDPOINT=blog` が設定されている

**手順**:
1. `cd astro-site`
2. 本番用環境変数を指定してビルド（[../astro-site/XSERVER_DEPLOY_RUNBOOK.md](../astro-site/XSERVER_DEPLOY_RUNBOOK.md) §4-2 のコマンド例を流用。ただし同文書は歴史的記録なので、コマンドの型だけ参照しURL等は現状に合わせる）
3. `dist/sns-marketing/` の中身を `public_html/sns-marketing/` へ反映
4. コミット・push

**注意**:
- `MICROCMS_*` が未設定のままビルドすると `/sns-marketing/` が空になる（エラーにはならない）。CIのpreviewビルドは `MICROCMS_STRICT=true` でfail-fastするが、本番ローカルビルドにはそのガードがないため、ビルド後に必ず `dist/sns-marketing/` が空でないか目視確認すること。

**検証方法**:
- `https://chairman-official.com/sns-marketing/` に一覧が表示される
- 対象記事の詳細ページが表示される

---

## 本番デプロイ（通常フロー）

**トリガー**: 上記いずれかの変更を `main` にpushした（またはpushしようとしている）。

**手順**:
1. push前に `cd astro-site && npm run check && npm test` を実行し、既知のもの以外のエラーが増えていないか確認する（`npm run check` は既知の1件のエラーが常時出る。[../docs/TRIBAL-KNOWLEDGE.md](TRIBAL-KNOWLEDGE.md) 参照）
2. `main` へpush
3. GitHub Actions `Deploy to Xserver (Production)` を確認する（`public_html/**` の変更がある場合のみ自動発火）

**検証方法**:
- ワークフロー内の `Verify production is live` ステップが成功していること（本番トップページへの `curl` チェックが組み込まれている）
- 主要ページを手動で開いて確認する

---

## 本番デプロイ失敗時の対応

**トリガー**: `Deploy to Xserver (Production)` が失敗し、GitHub Issueが自動作成される（タイトル: `本番デプロイ失敗: run #N`）。

**手順**:
1. Issue本文のリンクからActionsのログを開き、失敗箇所を特定する（FTPS接続失敗が典型）
2. 原因が一時的なもの（Xserver側の一時的な接続不良等）であれば、Actions画面から同じrunを再実行するか、`workflow_dispatch` で手動再実行する
3. 再実行で成功したら、本番URLを手動で開いて反映を確認する
4. **Issueを閉じる**（過去に成功後も閉じ忘れた例がある。Issue #19が該当）

**失敗が解消しない場合**:
- Xserverの契約状態・FTPS認証情報（`XSERVER_HOST`/`XSERVER_USERNAME`/`XSERVER_PASSWORD`のSecrets）を確認する
- 認証情報のローテーションが必要な場合は GitHub リポジトリの Settings > Secrets and variables > Actions で更新する

---

## 問い合わせフォーム（Apps Script）を更新する

**トリガー**: `astro-site/apps-script/contact.gs` のロジックを変更する必要がある（通知先変更、レートリミット調整など）。

**重要**: このスクリプトは**GitHubにpushしても本番には反映されない**。Google Apps Script側の手動作業が別途必要。

**手順**:
1. `astro-site/apps-script/contact.gs` を編集し、通常通りコミット・push（これはあくまでソースの記録目的）
2. [Google Apps Script](https://script.google.com/) の該当プロジェクトを開き、コードを貼り替える
3. `デプロイ > デプロイを管理` から既存のWebアプリを編集し、再デプロイする（実行ユーザー: 自分、アクセス権: 全員）
4. Script Propertiesの値変更のみの場合は再デプロイ不要（詳細: [../astro-site/RECAPTCHA_SETUP.md](../astro-site/RECAPTCHA_SETUP.md)）

**検証方法**:
- 本番の問い合わせフォームから実際に送信し、通知メール・スプレッドシートへの記録を確認する
- reCAPTCHA未チェックで送信できないことを確認する

**Script Propertiesの値（`RECAPTCHA_SECRET_KEY` 等）はこのリポジトリのどこにも存在しない。** 紛失した場合はGoogle reCAPTCHA管理画面・Apps Script管理画面側で再取得する必要がある。

---

## 本番ロールバック

**トリガー**: デプロイ後に表示崩れ・機能停止など、切り戻しが必要な問題が発生した。

**手順**（ファイル単位ではなくコミット単位で戻す）:
1. `git log -- public_html` で直前の正常な状態のコミットを特定する
2. そのコミット時点の `public_html/` の内容を復元する（`git checkout <正常なコミット> -- public_html/` など。事前に現在の状態を別ブランチに退避してから行う）
3. コミットして `main` へpush、自動デプロイを待つ
4. 本番URLで復旧を確認する

**大規模な入れ替え（全面差し替え）のロールバック**は、より厳密な手順が必要になる場合がある。参考: [../astro-site/docs/2026-03-26-astro-cutover-runbook.md](../astro-site/docs/2026-03-26-astro-cutover-runbook.md) の「ロールバック手順」節（Astro本番切替という一度きりのイベント向けに書かれた歴史的記録だが、`public_html`をディレクトリ単位で退避・復元する考え方自体は再利用できる）。
