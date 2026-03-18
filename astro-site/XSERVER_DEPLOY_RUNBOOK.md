# CHAIRMAN Astro 本番公開 Runbook for Xserver

この文書は、Astro で構築した CHAIRMAN サイトを Xserver 上で安全に公開するための作業手順書です。

対象読者:
- このプロジェクトを初めて触るジュニアエンジニア
- Xserver での静的サイト公開に不慣れな担当者

この手順書の目的:
- Astro の公開イメージを正しく理解する
- どこが事故ポイントかを先に把握する
- 手順どおり進めれば本番切替できる状態にする
- 問題が起きた時に巻き戻せるようにする

## 1. まず理解すること

### 1-1. Astro は本番サーバーで動くのか

結論:
- 今回の構成では、Astro は本番サーバーで動きません
- Astro が動くのは開発中とビルド中だけです

このプロジェクトの設定は [astro.config.mjs](./astro.config.mjs) で `output: "static"` です。

これは何を意味するか:
- 開発中: `npm run dev` で Astro が Node.js 上で動く
- ビルド時: `npm run build` で Astro が HTML/CSS/JS/画像を生成する
- 本番時: Xserver は生成済みのファイルを配信するだけ

つまり、本番に置かれるのは Astro そのものではなく、`dist/` の中身です。

### 1-2. 本番に置かれるもの

ビルド後に `astro-site/dist/` に生成されるもの:
- `index.html`
- `about-us/index.html`
- `news/index.html`
- `news/<slug>/index.html`
- `contact/index.html`
- `_astro/` 配下の CSS / JS
- 画像
- `robots.txt`
- `sitemap.xml`

Xserver はこれらを「普通の静的ファイル」として配信します。

### 1-3. 今回の移行で一番危ないポイント

一番危ないのは Astro ではなく、旧サイトからの切替です。

理由:
- 旧本番は `.html` ベースの URL
- 新 Astro はディレクトリ URL

例:
- 旧: `/about-us.html`
- 新: `/about-us/`

この差があるので、「ファイルを少し足す」感覚でやると事故ります。

今回の移行は、
- 旧 HTML サイトを改修する作業

ではなく、

- 新しい静的サイト一式に入れ替える作業

として扱ってください。

## 2. このプロジェクトの本番構成

### 2-1. データソースの正本

現時点の正本は次の通りです。

`新着情報`:
- ローカル直書き
- 正本ファイル: [src/data/mockNews.ts](./src/data/mockNews.ts)
- 取得ロジック: [src/lib/news.ts](./src/lib/news.ts)

`SNSノウハウ集`:
- microCMS
- 取得ロジック: [src/lib/microcms.ts](./src/lib/microcms.ts)

`お問い合わせフォーム`:
- フロントは Astro 静的ページ
- 送信先は Apps Script
- reCAPTCHA v2 あり
- 関連: [src/pages/contact.astro](./src/pages/contact.astro), [src/components/ContactForm.astro](./src/components/ContactForm.astro), [RECAPTCHA_SETUP.md](./RECAPTCHA_SETUP.md)

重要:
- 新着情報用の microCMS API はまだありません
- したがって、本番ビルドで `MICROCMS_*` が未設定でも新着情報は出ます
- ただし `SNSノウハウ集` は空になります

### 2-2. 旧本番ファイルと新 Astro 出力の違い

旧本番:
- `public_html/index.html`
- `public_html/about-us.html`
- `public_html/news.html`
- `public_html/news-detail.html`
- `public_html/contact.html`

新 Astro 出力:
- `dist/index.html`
- `dist/about-us/index.html`
- `dist/news/index.html`
- `dist/news/japan-expo-canada-partnership/index.html`
- `dist/contact/index.html`
- `dist/sns-marketing/index.html`

つまり URL は変わります。

## 3. デプロイ前のルール

以下のルールを守ってください。

### 3-1. 絶対にやってはいけないこと

- `dist` の一部だけを本番に上書きする
- HTML だけ差し替えて `_astro/` を残す
- preview 用ビルドを本番ルートに置く
- 旧 `public_html` をバックアップなしで消す
- `git status` が汚れた状態で本番ビルドを進める
- `dist` フォルダ自体をアップロードして `/dist/` 配下で公開してしまう

重要:
- 本番に置くのは `dist` フォルダそのものではなく、`dist` の中身です

### 3-2. 作業を止める条件

以下のどれかに当てはまったら、本番反映を止めてください。

- `npm run build` が通らない
- `git status` に意図しない差分がある
- 本番用の env 値が揃っていない
- `SNSノウハウ集` を出したいのに `MICROCMS_*` が未設定
- Apps Script の送信先 URL が不明
- reCAPTCHA の本番キーが不明

## 4. 必須確認項目

### 4-1. 本番ビルドに必要な環境変数

最低限必要な値:

- `SITE_URL=https://chairman-official.com`
- `SITE_BASE=/`
- `PUBLIC_CONTACT_FORM_ENDPOINT=<Apps Script の /exec URL>`
- `PUBLIC_RECAPTCHA_SITE_KEY=<本番の site key>`

`SNSノウハウ集` を本番で表示するなら必要:

- `MICROCMS_SERVICE_DOMAIN`
- `MICROCMS_API_KEY`
- `MICROCMS_ENDPOINT=blog`

補足:
- `PUBLIC_CONTACT_FORM_ENDPOINT` と `PUBLIC_RECAPTCHA_SITE_KEY` は [README.md](./README.md) と [RECAPTCHA_SETUP.md](./RECAPTCHA_SETUP.md) を参照
- `MICROCMS_*` がない場合、`/sns-marketing/` は空になります

### 4-2. 本番前に必ず実行する確認

ローカルで以下を実行:

```bash
cd /Users/fufu/code/株式会社CHAIRMAN【コーポレートサイト】
git status --short
```

期待値:
- 本番に載せる変更だけがある
- 参照中の画像やコードが untracked のまま残っていない

次に build:

```bash
cd /Users/fufu/code/株式会社CHAIRMAN【コーポレートサイト】/astro-site
SITE_URL="https://chairman-official.com" \
SITE_BASE="/" \
MICROCMS_SERVICE_DOMAIN="<service-domain>" \
MICROCMS_API_KEY="<api-key>" \
MICROCMS_ENDPOINT="blog" \
PUBLIC_CONTACT_FORM_ENDPOINT="<apps-script-exec-url>" \
PUBLIC_RECAPTCHA_SITE_KEY="<recaptcha-site-key>" \
npm run build
```

期待値:
- `build complete` で終わる
- `dist/` が更新される

### 4-3. build 後に確認するべき出力

```bash
find dist -maxdepth 3 \( -name 'index.html' -o -name 'sitemap.xml' -o -name 'robots.txt' \) | sort
```

期待する主な出力:
- `dist/index.html`
- `dist/about-us/index.html`
- `dist/news/index.html`
- `dist/news/japan-expo-canada-partnership/index.html`
- `dist/contact/index.html`
- `dist/sns-marketing/index.html`
- `dist/sitemap.xml`
- `dist/robots.txt`

## 5. 旧 URL と新 URL の対応表

本番切替前に、旧 URL と新 URL の対応を確定してください。

推奨マッピング:

| 旧 URL | 新 URL |
|---|---|
| `/index.html` | `/` |
| `/about-us.html` | `/about-us/` |
| `/contact.html` | `/contact/` |
| `/livapon.html` | `/livapon/` |
| `/news.html` | `/news/` |
| `/privacy.html` | `/privacy/` |
| `/news-detail.html` | `/news/` または個別記事 URL |

注意:
- `news-detail.html` は旧実装で汎用の詳細テンプレートです
- 旧 detail が特定の 1 記事だけを実質指していたなら、その記事 slug に 301 してもよいです
- 判断できない場合は、いったん `/news/` へ 301 の方が安全です

## 6. 推奨デプロイ方式

本番直上書きは推奨しません。

推奨方式:
1. サブディレクトリで Astro 版を公開して確認
2. 問題なければ本番ルートへ切替

### 6-1. サブディレクトリ検証の考え方

例:
- 検証 URL: `https://chairman-official.com/astro-preview/`

この場合、build 時の `SITE_BASE` は `/astro-preview/` にする必要があります。

コマンド例:

```bash
cd /Users/fufu/code/株式会社CHAIRMAN【コーポレートサイト】/astro-site
rm -rf dist
SITE_URL="https://chairman-official.com" \
SITE_BASE="/astro-preview/" \
MICROCMS_SERVICE_DOMAIN="<service-domain>" \
MICROCMS_API_KEY="<api-key>" \
MICROCMS_ENDPOINT="blog" \
PUBLIC_CONTACT_FORM_ENDPOINT="<apps-script-exec-url>" \
PUBLIC_RECAPTCHA_SITE_KEY="<recaptcha-site-key>" \
npm run build
```

重要:
- サブディレクトリ検証用 build と本番ルート用 build は別物です
- サブディレクトリ用 build をそのまま本番ルートに置いてはいけません

## 7. Xserver へ検証版を上げる手順

この章は「まず検証用ディレクトリで確認する」手順です。

### 7-1. 検証用アップロード先を決める

例:
- Xserver 上の公開先: `public_html/astro-preview/`
- URL: `https://chairman-official.com/astro-preview/`

### 7-2. アップロード対象

アップロードするのは `dist` の中身です。

例:
- `dist/index.html`
- `dist/_astro/`
- `dist/about-us/`
- `dist/news/`
- `dist/contact/`

やってはいけない例:
- `public_html/astro-preview/dist/index.html`

正しい例:
- `public_html/astro-preview/index.html`
- `public_html/astro-preview/_astro/...`

### 7-3. 検証版で確認するページ

最低限確認する URL:

- `/astro-preview/`
- `/astro-preview/about-us/`
- `/astro-preview/news/`
- `/astro-preview/news/japan-expo-canada-partnership/`
- `/astro-preview/sns-marketing/`
- `/astro-preview/contact/`

### 7-4. 検証版で確認する項目

表示:
- 画像が崩れていない
- ヘッダー/フッターが正しく出る
- スマホ・タブレット・デスクトップで大きな崩れがない

リンク:
- グローバルメニュー
- フッターリンク
- `/news/` から記事詳細
- トップから `/news/`
- `/sns-marketing/` の詳細遷移

データ:
- `新着情報` が出る
- `SNSノウハウ集` が出る
- `SNSノウハウ集` が空なら `MICROCMS_*` を疑う

フォーム:
- reCAPTCHA が表示される
- 送信エラーにならない
- Apps Script に届く

SEO/メタ:
- `robots.txt`
- `sitemap.xml`
- OGP 画像
- canonical

## 8. 本番切替の作業手順

この章が本番反映の本番手順です。

### 8-1. 本番切替前の前提

以下をすべて満たしてから進んでください。

- 検証版で OK が出ている
- 本番用 env で build し直した `dist/` がある
- 旧 `public_html` のバックアップ方法が決まっている
- 旧 URL から新 URL のリダイレクト先が決まっている

### 8-2. 本番用 build を作る

本番ルート用に再 build:

```bash
cd /Users/fufu/code/株式会社CHAIRMAN【コーポレートサイト】/astro-site
rm -rf dist
SITE_URL="https://chairman-official.com" \
SITE_BASE="/" \
MICROCMS_SERVICE_DOMAIN="<service-domain>" \
MICROCMS_API_KEY="<api-key>" \
MICROCMS_ENDPOINT="blog" \
PUBLIC_CONTACT_FORM_ENDPOINT="<apps-script-exec-url>" \
PUBLIC_RECAPTCHA_SITE_KEY="<recaptcha-site-key>" \
npm run build
```

### 8-3. 現行本番をバックアップする

最優先:
- `public_html` ディレクトリそのものではなく、中身を必ず退避する

方法はどちらでもよいです。

方法A:
- ローカル PC に `public_html` 一式をダウンロードして保管

方法B:
- Xserver 上で別ディレクトリにコピーして保管

バックアップ対象:
- HTML
- 画像
- `assets`
- `images`
- `script`
- `robots.txt`
- `sitemap.xml`
- `.htaccess`

### 8-4. 旧 `public_html` を空にする時の注意

注意:
- `public_html` ディレクトリ自体を消さない
- 中身だけを置き換える

残す/引き継ぐ候補:
- `.htaccess`

ただし `.htaccess` は新 URL リダイレクトを入れるため、内容を見直したうえで引き継いでください。

### 8-5. Astro 版をアップロードする

`dist` の中身を `public_html/` 直下にアップロードします。

最終的にこうなっていれば正しいです。

```text
public_html/
  index.html
  _astro/
  about-us/
  news/
  contact/
  livapon/
  privacy/
  sns-marketing/
  images/
  assets/
  robots.txt
  sitemap.xml
  .htaccess
```

### 8-6. 切替直後に確認する URL

切替直後に、必ず手動で開いてください。

- `https://chairman-official.com/`
- `https://chairman-official.com/about-us/`
- `https://chairman-official.com/news/`
- `https://chairman-official.com/news/japan-expo-canada-partnership/`
- `https://chairman-official.com/contact/`
- `https://chairman-official.com/sns-marketing/`
- `https://chairman-official.com/robots.txt`
- `https://chairman-official.com/sitemap.xml`

### 8-7. ハードリロード確認

ブラウザキャッシュを避けるため:
- macOS Chrome: `Cmd + Shift + R`
- Windows Chrome: `Ctrl + Shift + R`

理由:
- `_astro/` 配下の CSS / JS はハッシュ付きで入れ替わる
- 古い HTML や古い CSS を見て誤判定しやすい

## 9. `.htaccess` の扱い

現行 `.htaccess` には重要な設定があります。

含まれているもの:
- HTTP -> HTTPS リダイレクト
- セキュリティヘッダー
- CSP

これらは基本的に維持してください。

参照元:
- [../public_html/.htaccess](../public_html/.htaccess)

### 9-1. 追加したいリダイレクト例

本番切替時は、現行 `.htaccess` の `RewriteEngine On` を活かしつつ、旧 `.html` から新 URL への 301 を追加してください。

例:

```apacheconf
RewriteEngine On

RewriteRule ^index\.html$ / [R=301,L]
RewriteRule ^about-us\.html$ /about-us/ [R=301,L]
RewriteRule ^contact\.html$ /contact/ [R=301,L]
RewriteRule ^livapon\.html$ /livapon/ [R=301,L]
RewriteRule ^news\.html$ /news/ [R=301,L]
RewriteRule ^privacy\.html$ /privacy/ [R=301,L]
RewriteRule ^news-detail\.html$ /news/ [R=301,L]
```

注意:
- 既存の HTTPS リダイレクトやセキュリティヘッダーは消さない
- `.htaccess` を丸ごと置き換える前に差分確認する

## 10. ロールバック手順

本番公開後に問題が出たら、以下の手順で戻します。

### 10-1. ロールバック条件

以下のどれかが起きたらロールバックを検討:

- トップが表示されない
- `_astro/` の 404 が大量に出る
- 主要ページで崩れがある
- お問い合わせが送れない
- `SNSノウハウ集` が意図せず空
- リダイレクトでループする

### 10-2. ロールバック手順

1. 現在の `public_html` の中身を退避する
2. バックアップしておいた旧 `public_html` を戻す
3. 旧 `.htaccess` を戻す
4. トップ、主要導線、問い合わせを再確認する

重要:
- 巻き戻しの成否はバックアップの品質で決まります
- バックアップが曖昧なら本番切替しないでください

## 11. ジュニア向けの判断基準

### 11-1. この状態なら進んでよい

- 検証版で全ページ OK
- 本番用 env が埋まっている
- `npm run build` 成功
- バックアップ取得済み
- 旧 URL リダイレクトを準備済み

### 11-2. この状態なら止まる

- `dist/` をどこに置くか曖昧
- `.htaccess` をどう扱うか曖昧
- `news-detail.html` のリダイレクト先が未決定
- `MICROCMS_*` の有無が分からない
- Apps Script の `/exec` URL が分からない
- reCAPTCHA の site key が分からない

## 12. 最後のまとめ

このプロジェクトの本番公開は、次の一文で説明できます。

> Astro を Xserver で動かすのではなく、Astro が生成した静的ファイル一式を Xserver に配置して公開する

したがって、成功の鍵は Astro の知識よりも次の3つです。

- 正しい env で build すること
- `dist` を 1 セットとして扱うこと
- 旧サイトからの切替とロールバックを先に設計すること

この手順書どおりに進めれば、`なんとなく上書きして事故る` リスクは大きく下げられます。
