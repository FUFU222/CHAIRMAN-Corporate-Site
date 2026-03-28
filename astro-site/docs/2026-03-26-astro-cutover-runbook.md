# CHAIRMAN Astro 切替手順書

作成日: 2026-03-26

## 目的

`/preview/` で公開中の Astro サイトを、事故率を抑えながら `https://chairman-official.com/` 本番ルートへ切り替える。

## 前提

- Astro の正本はこのブランチの `astro-site/`
- preview URL は `https://chairman-official.com/preview/`
- 本番 URL は `https://chairman-official.com/`
- 切替中は 60 分だけメンテナンス表示を出す
- メンテ中は `503 Service Unavailable` を返す
- メンテ中の本番確認は、同じ Wi-Fi に接続した PC / スマホで行う
- reCAPTCHA ドメイン設定は `chairman-official.com` で足りている
- フォーム送信先は Apps Script の `/exec` URL を使う
- 旧 `news.html` / `news-detail.html` は、新しい `新着情報` ではなく `SNSノウハウ集` 系として扱う

## 切替前ゲート

以下が揃っていない場合は本番切替を止める。

- `PUBLIC_CONTACT_FORM_ENDPOINT` が確定している
- `PUBLIC_RECAPTCHA_SITE_KEY` が確定している
- `/preview/contact/` で実送信確認済み
- `/preview/` の主要ページ表示確認済み
- `/preview/sns-marketing/` の一覧表示確認済み
- `/preview/sns-marketing/<slug>/` の詳細 1 件確認済み
- `npm run check` が成功
- `npm test` が成功
- 本番用 env で `npm run build` が成功
- `dist/` の中身を本番へ置く理解が揃っている
- 現行 `public_html` を丸ごと退避できる

## 事前準備

1. Astro 正本ブランチを最新化する
2. `astro-site/` で依存関係が揃っていることを確認する
3. `.env` またはビルド用環境変数を確認する
4. `preview` 用ではなく、本番用の `SITE_BASE=/` でビルドする
5. 現行 `public_html` のバックアップ置き場を決める
6. 切替確認に使う Wi-Fi 回線のグローバル IP を切替直前に確認する
7. `maintenance.html` と `.htaccess` のメンテ用ルールを事前に準備する

## ローカル最終確認

```bash
cd /Users/fufu/code/株式会社CHAIRMAN【コーポレートサイト】/astro-site
npm run check
npm test
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

- `check` が成功
- `test` が成功
- `build` が成功
- `astro-site/dist/` が本番用出力に更新される

## メンテナンスモードの考え方

切替中の短時間停止では、メンテページへ `301` しない。

- 一時停止は `503`
- 恒久的な URL 変更は `301`

役割が違うので、同じルールで扱わない。

### 503 メンテの要件

- 一般ユーザーには `maintenance.html` を表示する
- HTTP ステータスは `503` を返す
- `Retry-After: 3600` を返す
- 自分の Wi-Fi のグローバル IP だけ除外する
- `maintenance.html` 自体はループしないように除外する

#### 503 メンテ用 `.htaccess` サンプル

以下は、切替中だけ一時的に有効化する想定のサンプル。
`YOUR_IP_ADDRESS` は切替直前に確認したグローバル IP に置き換える。

完成版は [xserver-maintenance.htaccess.example](/Users/fufu/code/株式会社CHAIRMAN【コーポレートサイト】/astro-site/docs/xserver-maintenance.htaccess.example) を使う。

```apache
RewriteEngine On

# HTTP -> HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# Maintenance mode (temporary)
ErrorDocument 503 /maintenance.html

RewriteCond %{REQUEST_URI} !^/maintenance\.html$
RewriteCond %{REMOTE_ADDR} !^YOUR_IP_ADDRESS$
RewriteRule ^ - [R=503,L]

<IfModule mod_headers.c>
    Header always set Retry-After "3600" "expr=%{REQUEST_STATUS} == 503"
</IfModule>
```

使い方:

1. 既存 `.htaccess` を退避する
2. 上記のメンテ用ルールを `RewriteEngine On` の直後に差し込む
3. 自分の回線だけ通常表示できることを確認する
4. 切替完了後はこの `503` ルールを外す

注意:

- `ErrorDocument 503 /maintenance.html` を入れないと、素っ気ない 503 画面になる
- `REMOTE_ADDR` の値は切替直前に確認したものを使う
- モバイル回線に切り替えると IP が変わるので、確認中は Wi-Fi を維持する

### 301 転送の要件

メンテ解除後に、主要な旧 URL だけを新 URL へ `301` する。

| 旧 URL | 新 URL |
|---|---|
| `/index.html` | `/` |
| `/about-us.html` | `/about-us/` |
| `/contact.html` | `/contact/` |
| `/privacy.html` | `/privacy/` |
| `/livapon.html` | `/livapon/` |
| `/news.html` | `/sns-marketing/` |
| `/news-detail.html` | `/sns-marketing/` |

補足:

- `news-detail.html?id=...` の `id` ごとの個別転送は、今回はやらない
- 流入が少ない前提なので、最低限 `/sns-marketing/` へ寄せる
- 旧 `news` 系は新設した `/news/` ではなく、既存記事の受け皿である `/sns-marketing/` に寄せる

#### 301 転送用 `.htaccess` サンプル

以下は、メンテ解除後に残す想定のサンプル。
`503` メンテ用ルールを外したあとで有効化する。

完成版は [xserver-live.htaccess.example](/Users/fufu/code/株式会社CHAIRMAN【コーポレートサイト】/astro-site/docs/xserver-live.htaccess.example) を使う。

```apache
RewriteEngine On

# HTTP -> HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# Legacy HTML redirects
RewriteRule ^index\.html$ / [R=301,L]
RewriteRule ^about-us\.html$ /about-us/ [R=301,L]
RewriteRule ^contact\.html$ /contact/ [R=301,L]
RewriteRule ^privacy\.html$ /privacy/ [R=301,L]
RewriteRule ^livapon\.html$ /livapon/ [R=301,L]
RewriteRule ^news\.html$ /sns-marketing/ [R=301,L]
RewriteRule ^news-detail\.html$ /sns-marketing/ [R=301,L]
```

注意:

- `news-detail.html?id=...` も `news-detail.html` に一致して `/sns-marketing/` へ転送される
- 今回は 1:1 の個別記事転送をやらないので、この最低限ルールでよい
- 既存のセキュリティヘッダー設定は、この redirect ルールの後ろにそのまま残す

#### 推奨の並び順

本番 `.htaccess` は次の順で整理すると事故りにくい。

1. `RewriteEngine On`
2. HTTP -> HTTPS
3. 切替中だけ使う `503` メンテ用ルール
4. 公開後に残す `301` 転送ルール
5. セキュリティヘッダー
6. XPageSpeed など既存の補助設定

## 切替当日手順

### 1. メンテナンスモードを有効化する

1. PC とスマホを同じ Wi-Fi に接続する
2. その回線のグローバル IP を確認する
3. `.htaccess` に `503` メンテ用ルールを入れる
4. `maintenance.html` を表示しつつ、自分の IP だけ除外する
5. 一般ユーザーにはメンテ表示、自分の回線では通常表示になることを確認する

### 2. 本番投入前の退避

1. Xserver 上の現行 `public_html` を日時付きで丸ごと退避する
2. 退避先名は `public_html_backup_YYYYMMDD_HHMM` のようにする
3. 退避が完了するまで新しいファイルを上書きしない

### 3. 本番投入

1. `astro-site/dist/` の中身だけを本番 `public_html` に配置する
2. `dist` フォルダ自体を `public_html/dist/` に置かない
3. `_astro/`、各ページディレクトリ、`robots.txt`、`sitemap.xml` を含めて配置する
4. 既存 `.htaccess` の HTTPS リダイレクトや必要ヘッダーがある場合は、消さずに引き継ぐか同等内容を残す
5. 旧サイトのファイルを部分的に混在させない
6. メンテ中の `503` ルールは維持したまま、公開後に使う `301` ルールを配置する
7. `301` は有効なままでも、自分の IP から本番確認できるように整理する

### 4. 切替直後の確認

以下を本番 URL で確認する。

- `/`
- `/about-us/`
- `/contact/`
- `/news/`
- `/sns-marketing/`
- `/sns-marketing/<slug>`
- `/privacy/`
- `/livapon/`
- `/robots.txt`
- `/sitemap.xml`

加えて:

- 画像が崩れていない
- `_astro/` 配下の CSS / JS が 200 で返る
- お問い合わせフォームが送信できる
- reCAPTCHA が通る
- 送信結果が Apps Script 側に到達する
- `microCMS` の一覧が表示される
- `microCMS` の詳細 1 件が正常に表示される
- 旧 `.html` URL が意図どおり `301` される

### 5. 公開判定

1. UI と外部接続確認が終わったら、`503` メンテ用ルールを外す
2. `301` 転送ルールは残したまま公開する
3. 公開後に一般回線から主要ページを再確認する

## ロールバック手順

問題が出たら、ファイル単位ではなくディレクトリ単位で戻す。

1. `503` メンテは維持したまま、本番 `public_html` の新しい内容を退避または削除する
2. `public_html_backup_YYYYMMDD_HHMM` を `public_html` として戻す
3. 旧サイト用 `.htaccess` を戻す
4. `/` と `/contact.html` と `/news.html` を確認する
5. 旧サイトが復旧したら `503` を外す
6. 原因調査へ戻る

## 補足

- `preview` はサブディレクトリなので、reCAPTCHA のドメイン設定変更は不要
- 今回は流入の少ない `news-detail.html?id=...` を個別記事へ 1:1 転送しない
- `NEWS` の microCMS 移行は今回の切替スコープに含めない
- 将来的には `新着情報` の更新主体が非エンジニアになり得るため、`NEWS` の microCMS 移行は別フェーズで検討する
- もっとも危ないのは「一部だけ上書きして旧ファイルと新ファイルを混在させる」こと
