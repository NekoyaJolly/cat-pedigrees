# Vercelの構成と接続確認

## 2026年10月18日の状態

| 項目 | 設定・結果 |
| --- | --- |
| プロジェクト | `cat-pedigrees`。VercelのNekoyaチーム内に新規作成 |
| 確認用URL | https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app |
| 環境・状態 | Preview・READY |
| 閲覧時の保護 | Vercelログインが必要な確認用プレビュー。既定の保護設定を維持 |
| 動作確認した実装コミット | `4e03d033090e60af1bd67be7d6563ea65d8e87cc` |
| 登録・編集を有効化した配置元 | `e81919e4c08b3e120efb190ab9fc649e04c1f19d`。実装は上記と同一、以降は配置文書の更新 |
| フレームワーク・実行環境 | Next.js 16.4.2・Node.js 24・東京（hnd1） |
| ビルド時間 | 登録・編集を有効化した配置の接続確認を含むビルド完了ログで36秒 |
| 接続DB | 既存のSupabase `pedigrees`（`hnhhfcityestinsvcdfw`） |
| 登録・変更 | 確認用ブランチ`feat/mobile-pedigree-ui`のPreviewで`PEDIGREE_WRITES_ENABLED=1`。登録・編集が可能 |
| メールログイン | 本人のマジックリンクによるログイン成功を確認済み。その後、メールの送信制限を報告。専用の送信設定が必要 |

MyCats ProのVercelプロジェクトや別のDBへ置き換えていない。GitHubの`main`にもマージしていない。確認用のブランチから単体版を配置した。

## DBへの接続

専用ユーザー`pedigree_web_app`を作成し、セッションプーラーの5432番ポート経由で接続する。接続先は`aws-1-ap-northeast-1.pooler.supabase.com`。既存の管理用パスワードは変更していない。

このユーザーは猫種・色柄・性別の読み取りと、血統データの読み取り・追加・変更だけを許可する。削除、利用者情報の読み取り、管理権限、RLSを回避する権限は付けていない。RLSは有効なまま、専用ロールに限定したポリシーを使用する。本人によるログイン確認後、確認用ブランチのPreviewだけでアプリの登録・変更を有効にした。保存内容は既存の血統書DBへ反映される。その他のPreviewとProductionの既定値は`PEDIGREE_WRITES_ENABLED=0`を維持する。

接続情報はSupabase Vaultの`cat_pedigrees_web_database_password`とVercelのサーバー設定で管理し、Gitへ保存しない。DB接続数は1つの実行環境あたり2本に制限する。

TLSにはSupabase公式のRoot 2021 CAを`DATABASE_SSL_CA`へ登録し、証明書とホスト名の検証を有効にする。公式配布元は以下。SHA-256は`807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`。

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

ビルドコマンドは`npm run build && node --import tsx scripts/verify-deployment-db.mjs`。後半が読み取り専用で接続し、専用ユーザーと必要な4テーブルを確認できなければデプロイを失敗させる。

## 確認できたこと

- Vercelの実行環境から、専用ユーザーで血統データ13,867件、猫種112件、色柄407件、性別4件を読み取れた。
- 公開先のログイン画面を取得できた。未ログインで一覧を開くとログイン画面へ制限された。
- 2026年10月18日、本人が公開先でマジックリンクによるログイン完了を確認した。
- 更新後の型チェック、単体テスト9件、ローカルの合成データによるブラウザー検証14項目が成功した。登録・編集、父母呼び出し、きょうだい登録、PDF出力を含む。
- 実行時の依存パッケージは`npm audit --omit=dev`で検出0件。開発用のshadcn CLIに由来するbraces系の検出6件は残るが、CLIをアプリの実行時依存から外し、利用者の入力をCLIへ渡す処理は設けていない。
- Supabaseの確認では、内部DDLイベント用のRLS補助関数について一般利用者のAPI実行権限を外した。残る通知は、管理用の`_prisma_migrations`にRLSポリシーがないという情報のみ。管理用テーブルをアプリへ公開する必要はない。

本番の血統データへの書き込みテストは行っていない。今回のDB設定は接続ユーザー、権限、RLSポリシー、内部関数の実行権限であり、血統データの行は変更していない。

## 設定済みのログインURL

Supabaseの[ログインURL設定](https://supabase.com/dashboard/project/hnhhfcityestinsvcdfw/auth/url-configuration)で、次の2項目を保存済み。

| 設定欄 | 値 |
| --- | --- |
| Site URL | `https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app` |
| Redirect URLsに追加 | `https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app/auth/callback` |

利用者の承認を受けて別のブラウザー接続へ切り替え、既存アカウントでログインして設定した。画面上の保存結果に加え、メールを送らない無効リンクの応答がHTTP 303で上記の`/auth/callback`へ戻ることを確認した。変更前の`http://localhost:3000`には戻らない。この確認では実際のログインメール送信、認証完了、利用者アカウント作成は行っていない。

利用できるメールアドレスは、Vercelの登録者のアドレスをサーバー設定へ登録済み。値は公開リポジトリに記載しない。他の利用者を追加する際は`PEDIGREE_ALLOWED_EMAILS`へアドレスを登録し、必要に応じてSupabaseのメール送信設定も確認する。

ログインの実機確認は完了。次は実機での一覧・詳細の見やすさ、登録・編集、父母の呼び出し、台紙への試し刷りを確認する。エージェントから本番の血統データへ試験用の行を追加・変更する操作は行っていない。`main`へのマージと本番公開は未実施。

## メール送信制限の確認と残作業

2026年10月18日、利用者から「時間をおいてお試しください」と表示され、メールを送れないとの報告があった。Supabaseの画面で、Pedigreeは標準のメール送信を使用し、専用SMTPは無効であることを確認した。標準送信はプロジェクト全体で1時間2通に制限されており、今回の報告と一致する。失敗した要求の提供元エラーコードは未取得のため、個別の要求に適用された制限の種類までは確定していない。

- 公式仕様：[メール送信と認証の上限](https://supabase.com/docs/guides/auth/rate-limits)、[専用SMTPの設定](https://supabase.com/docs/guides/auth/auth-smtp)。
- 送信処理はボタン操作時に1回実行され、自動再送や繰り返し送信の処理はない。
- アプリのログイン状態は、同じ公開先・同じブラウザーで12時間保持する実装。別端末や別ブラウザーでは別途ログインが必要。今回、利用者が再送を必要とした理由は未特定。
- HUBの本番DBでは専用SMTPが有効で、Resendのホスト`smtp.resend.com`と465番ポートを使用していた。設定の有無と公開された接続先だけを読み取り、HUB側は変更していない。保存済みの認証情報は読み出していない。
- 対応はPedigree側へのResend接続の追加。既存アカウントで利用可能な送信元と接続権限の確認が必要。Resend側の画面をブラウザーの保護機能で確認できず、接続の切替は未実施。

今回の調査ではログインメールの再送を行っていない。専用SMTPの設定後、メール送信上限と本人の受信・ログインを改めて確認する。
