# Vercelの構成と接続確認

## 2026年10月18日の状態

| 項目 | 設定・結果 |
| --- | --- |
| プロジェクト | `cat-pedigrees`。VercelのNekoyaチーム内に新規作成 |
| 確認用URL | https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app |
| 環境・状態 | Preview・READY |
| 閲覧時の保護 | Vercelログインが必要な確認用プレビュー。既定の保護設定を維持 |
| 動作確認した実装コミット | `9c1755d41b851def8fa9807f75704bcd8e9ed999`。項目名を欄内へ表示し、文字に合わせて欄高を調整 |
| 現在の配置 | `dpl_2MZh8P1uw6tzCYW5wktmjZLAtjk9`。上記コミットから自動作成されたPreview |
| フレームワーク・実行環境 | Next.js 16.4.2・Node.js 24・東京（hnd1） |
| ビルド時間 | 接続確認を含むビルド完了ログで34秒 |
| 接続DB | 既存のSupabase `pedigrees`（`hnhhfcityestinsvcdfw`） |
| 登録・変更 | 確認用ブランチ`feat/mobile-pedigree-ui`のPreviewで`PEDIGREE_WRITES_ENABLED=1`。登録・編集が可能 |
| メールログイン | 送信制限への対応としてResendの専用SMTPを設定し、上限を1時間30通へ変更。2026年10月18日、本人から新しい送信経路でのメール受信・マジックリンクによるログイン完了の報告を受領 |

MyCats ProのVercelプロジェクトや別のDBへ置き換えていない。GitHubの`main`にもマージしていない。確認用のブランチから単体版を配置した。

## 業務用の入力UI

同日、本人から印刷以外の動作確認が完了したとの報告を受領した。続いて依頼された入力欄の改修を同じPreviewへ反映した。IDは7桁分、コード・頭数は小幅、日付は固定幅とし、コードと名称、短い項目を横に並べた。案内文と繰り返しのラベルを削減した。設計・文字数の集計・検証は[業務用フォームの入力幅と配置](compact-input-design.md)に記録している。

本人から欄幅の改善確認を受領し、さらに項目名を欄の内側へ表示してフォーカス時に消す方式へ変更した。入力後は値だけを表示し、項目名を上へ浮かせない。上下の入力余白を0にし、スマホは文字16px・枠込み22px、PCは文字14px・枠込み19.5pxとした。候補の矢印があるコード欄だけは、項目名と3桁の数字が欠けない最低幅を確保した。

現在の配置が`READY`で、確認用URLの割り当てと実装コミットの一致を確認した。VercelからのDB接続確認は専用ユーザー`pedigree_web_app`で血統データ13,868件、猫種112件、色柄407件、性別4件に成功。公開先のログイン画面はHTTP 200、未ログインの一覧アクセスもログイン画面へ制限された。配置されたCSSにも新しい欄高とフォーカス時に項目名を消す定義が含まれることを確認した。

最新の型チェック・本番用ビルド、単体テスト9件、合成DBでのブラウザー検証16項目に成功した。10項目で欄内の項目名・フォーカス時の消去・入力後の値だけの表示・空欄に戻した際の再表示を確認し、スマホ22px・PC19.5pxの欄高を実測した。7段階の画面幅、7桁ID・10桁の値の保持、文字200%の表示、保存・父母呼び出しも確認した。33文字相当の色柄名・3桁コード・2桁頭数は幅改修時に確認済みで、今回も3桁コードと項目名の表示を画像で確認した。今回変更した項目名・高さでの実機の入力感と実際の台紙への印刷は未確認。

## DBへの接続

専用ユーザー`pedigree_web_app`を作成し、セッションプーラーの5432番ポート経由で接続する。接続先は`aws-1-ap-northeast-1.pooler.supabase.com`。既存の管理用パスワードは変更していない。

このユーザーは猫種・色柄・性別の読み取りと、血統データの読み取り・追加・変更だけを許可する。削除、利用者情報の読み取り、管理権限、RLSを回避する権限は付けていない。RLSは有効なまま、専用ロールに限定したポリシーを使用する。本人によるログイン確認後、確認用ブランチのPreviewだけでアプリの登録・変更を有効にした。保存内容は既存の血統書DBへ反映される。その他のPreviewとProductionの既定値は`PEDIGREE_WRITES_ENABLED=0`を維持する。

接続情報はSupabase Vaultの`cat_pedigrees_web_database_password`とVercelのサーバー設定で管理し、Gitへ保存しない。DB接続数は1つの実行環境あたり2本に制限する。

TLSにはSupabase公式のRoot 2021 CAを`DATABASE_SSL_CA`へ登録し、証明書とホスト名の検証を有効にする。公式配布元は以下。SHA-256は`807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`。

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

ビルドコマンドは`npm run build && node --import tsx scripts/verify-deployment-db.mjs`。後半が読み取り専用で接続し、専用ユーザーと必要な4テーブルを確認できなければデプロイを失敗させる。

## 確認できたこと

- 初回の配置では、Vercelの実行環境から専用ユーザーで血統データ13,867件、猫種112件、色柄407件、性別4件を読み取れた。
- 公開先のログイン画面を取得できた。未ログインで一覧を開くとログイン画面へ制限された。
- 2026年10月18日、本人が公開先でマジックリンクによるログイン完了を確認した。
- 初回のUI実装では型チェック、単体テスト9件、ローカルの合成データによるブラウザー検証14項目が成功した。登録・編集、父母呼び出し、きょうだい登録、PDF出力を含む。
- 実行時の依存パッケージは`npm audit --omit=dev`で検出0件。開発用のshadcn CLIに由来するbraces系の検出6件は残るが、CLIをアプリの実行時依存から外し、利用者の入力をCLIへ渡す処理は設けていない。
- Supabaseの確認では、内部DDLイベント用のRLS補助関数について一般利用者のAPI実行権限を外した。残る通知は、管理用の`_prisma_migrations`にRLSポリシーがないという情報のみ。管理用テーブルをアプリへ公開する必要はない。

エージェントから本番の血統データへの書き込みテストは行っていない。今回のDB設定は接続ユーザー、権限、RLSポリシー、内部関数の実行権限であり、血統データの行は変更していない。

## 設定済みのログインURL

Supabaseの[ログインURL設定](https://supabase.com/dashboard/project/hnhhfcityestinsvcdfw/auth/url-configuration)で、次の2項目を保存済み。

| 設定欄 | 値 |
| --- | --- |
| Site URL | `https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app` |
| Redirect URLsに追加 | `https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app/auth/callback` |

利用者の承認を受けて別のブラウザー接続へ切り替え、既存アカウントでログインして設定した。画面上の保存結果に加え、メールを送らない無効リンクの応答がHTTP 303で上記の`/auth/callback`へ戻ることを確認した。変更前の`http://localhost:3000`には戻らない。この確認では実際のログインメール送信、認証完了、利用者アカウント作成は行っていない。

利用できるメールアドレスは、Vercelの登録者のアドレスをサーバー設定へ登録済み。値は公開リポジトリに記載しない。他の利用者を追加する際は`PEDIGREE_ALLOWED_EMAILS`へアドレスを登録し、必要に応じてSupabaseのメール送信設定も確認する。

本人からログイン成功、印刷以外の動作確認完了、欄幅の改善確認の報告を受領した。次は今回変更した項目名・高さでの実機の入力感と、台紙への試し刷りを確認する。エージェントから本番の血統データへ試験用の行を追加・変更する操作は行っていない。`main`へのマージと本番公開は未実施。

## メール送信設定と受信確認

2026年10月18日、利用者から「時間をおいてお試しください」と表示され、メールを送れないとの報告があった。Supabaseの画面で、Pedigreeは標準のメール送信を使用し、専用SMTPは無効であることを確認した。標準送信はプロジェクト全体で1時間2通に制限されている。認証ログでも直近24時間の`/otp`に成功2件（HTTP 200）と送信上限による拒否6件（HTTP 429、`over_email_send_rate_limit`）があり、今回の原因を確認できた。メール本文、宛先、認証トークンは調査結果へ保存していない。

- 公式仕様：[メール送信と認証の上限](https://supabase.com/docs/guides/auth/rate-limits)、[専用SMTPの設定](https://supabase.com/docs/guides/auth/auth-smtp)。
- 送信処理はボタン操作時に1回実行され、自動再送や繰り返し送信の処理はない。
- アプリのログイン状態は、同じ公開先・同じブラウザーで12時間保持する実装。別端末や別ブラウザーでは別途ログインが必要。今回、利用者が再送を必要とした理由は未特定。
- HUBの本番DBでは専用SMTPが有効で、Resendのホスト`smtp.resend.com`と465番ポートを使用していた。設定の有無と公開された接続先だけを読み取り、HUB側は変更していない。保存済みの認証情報は読み出していない。
- Pedigree側へResendの専用SMTPを追加した。既存の認証済みドメイン`auth.nekoya.ltd`を使用し、このドメインでの送信だけを許可する血統書専用キーを作成した。既存ドメインの設定やHUB側のキーは変更していない。

2026年10月18日18:57（日本時間）、保存後の設定を管理APIで再取得し、次の内容を確認した。

| 設定 | 保存済みの値 |
| --- | --- |
| 対象プロジェクト | `pedigrees`（`hnhhfcityestinsvcdfw`） |
| SMTPホスト・ポート | `smtp.resend.com`・465（SSL/TLS） |
| SMTPユーザー | `resend` |
| 送信者名 | 血統書管理 |
| 送信元メールアドレス | `no-reply@auth.nekoya.ltd` |
| メール送信上限 | プロジェクト全体で1時間30通 |
| 専用キー名 | `cat-pedigrees-supabase-smtp-20261018` |
| 専用キーの権限 | `sending_access`。送信ドメインを`auth.nekoya.ltd`に限定 |

Site URL、Redirect URLs、メール確認の設定、サインアップの設定は維持している。キーと管理トークンの値はGitへ保存していない。

ResendのAPIが専用キーを認識し、ドメイン一覧の管理操作を`restricted_api_key`で拒否することを確認した。作業環境からのSMTP直接接続はホスト名を解決できず、直接のSMTP認証テストは実施できなかった。2026年10月18日、本人から新しい送信経路でのメール受信とマジックリンクによるログイン完了の報告を受領し、実環境での送信・受信・ログインを確認した。エージェントからログインメールの再送は行っていない。

## CLIによる設定

公式のResend CLI 2.26.0とSupabase CLI 2.121.0を作業環境へ導入し、配布元のSHA-256と起動を確認した。アプリへの依存追加はない。本人による認証後、Resend CLIで送信ドメインを確認して専用キーを作成し、Supabase Management APIへ設定した。

`scripts/configure-resend-smtp.mjs`は対象プロジェクトを`hnhhfcityestinsvcdfw`へ固定し、Supabase Management APIへSMTPの6項目とメール送信上限だけを保存する。上限は1時間30通とし、既にそれ以上なら維持する。保存後は設定を読み直し、接続先・送信元・上限と、既存のログインURL・確認設定を検証する。APIキーの有効性と配信成功は設定の読み直しだけでは確認できないため、受信確認を別途行う。

必要な環境変数は次の3つ。秘密値をGit・チャット・コマンド引数・ログへ記録せず、実行する端末のシークレット管理または非表示入力で渡す。

| 変数 | 内容 |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | 対象プロジェクトの認証設定を読み取り・更新できる管理用トークン。アプリ用の公開キーやDBパスワードでは代用できない |
| `RESEND_SMTP_PASSWORD` | Resendの認証済み送信ドメインに限定した送信専用APIキー |
| `SMTP_FROM_EMAIL` | 上記の認証済みドメインの送信元メールアドレス |

実行場所は`cat-pedigrees`リポジトリのルート（`package.json`があるフォルダー）。

```bash
# 入力の有無と形式を確認する。API通信も設定変更も行わない。
node scripts/configure-resend-smtp.mjs --check

# 認証と送信元が揃った環境で、専用SMTPの設定を保存・再取得する。
node scripts/configure-resend-smtp.mjs --apply

# 実サービスへ接続せず、変更対象・秘密値の非表示・異常時の停止を確認する。
node --test tests/smtp-setup.test.mjs
```

認証情報と送信元を非表示で渡して`--apply`を実行し、終了コード0を確認した。設定の保存・読み直しに加えて、別の管理API要求でも上記の値を確認した。設定スクリプトのテスト5件では、変更対象の限定、秘密値の非表示、異常時の停止、既存のログイン設定の維持を確認している。

APIの仕様：[SMTP設定](https://supabase.com/docs/guides/auth/auth-smtp)、[認証設定の部分更新](https://supabase.com/docs/reference/api/v1-update-auth-service-config)、[ResendのSupabase接続](https://resend.com/docs/send-with-supabase-smtp)。
