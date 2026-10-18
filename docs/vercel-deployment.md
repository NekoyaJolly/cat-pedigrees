# Vercelの構成と接続確認

## 2026年10月18日の状態

| 項目 | 設定・結果 |
| --- | --- |
| プロジェクト | `cat-pedigrees`。VercelのNekoyaチーム内に新規作成 |
| 確認用URL | https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app |
| 環境・状態 | Preview・READY |
| 閲覧時の保護 | Vercelログインが必要な確認用プレビュー。既定の保護設定を維持 |
| 動作確認した実装コミット | `4e03d033090e60af1bd67be7d6563ea65d8e87cc` |
| フレームワーク・実行環境 | Next.js 16.4.2・Node.js 24・東京（hnd1） |
| ビルド時間 | 接続確認を含むビルド完了ログで33秒 |
| 接続DB | 既存のSupabase `pedigrees`（`hnhhfcityestinsvcdfw`） |
| 登録・変更 | `PEDIGREE_WRITES_ENABLED=0`。現在は閲覧用 |
| メールログイン | 公開先への戻り先設定が未完了。下記の設定が必要 |

MyCats ProのVercelプロジェクトや別のDBへ置き換えていない。GitHubの`main`にもマージしていない。確認用のブランチから単体版を配置した。

## DBへの接続

専用ユーザー`pedigree_web_app`を作成し、セッションプーラーの5432番ポート経由で接続する。接続先は`aws-1-ap-northeast-1.pooler.supabase.com`。既存の管理用パスワードは変更していない。

このユーザーは猫種・色柄・性別の読み取りと、血統データの読み取り・追加・変更だけを許可する。削除、利用者情報の読み取り、管理権限、RLSを回避する権限は付けていない。RLSは有効なまま、専用ロールに限定したポリシーを使用する。現在はアプリ側でも登録・変更を無効にしている。

接続情報はSupabase Vaultの`cat_pedigrees_web_database_password`とVercelのサーバー設定で管理し、Gitへ保存しない。DB接続数は1つの実行環境あたり2本に制限する。

TLSにはSupabase公式のRoot 2021 CAを`DATABASE_SSL_CA`へ登録し、証明書とホスト名の検証を有効にする。公式配布元は以下。SHA-256は`807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`。

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

ビルドコマンドは`npm run build && node --import tsx scripts/verify-deployment-db.mjs`。後半が読み取り専用で接続し、専用ユーザーと必要な4テーブルを確認できなければデプロイを失敗させる。

## 確認できたこと

- Vercelの実行環境から、専用ユーザーで血統データ13,867件、猫種112件、色柄407件、性別4件を読み取れた。
- 公開先のログイン画面を取得できた。未ログインで一覧を開くとログイン画面へ制限された。
- 更新後の型チェック、単体テスト9件、ローカルの合成データによるブラウザー検証14項目が成功した。登録・編集、父母呼び出し、きょうだい登録、PDF出力を含む。
- 実行時の依存パッケージは`npm audit --omit=dev`で検出0件。開発用のshadcn CLIに由来するbraces系の検出6件は残るが、CLIをアプリの実行時依存から外し、利用者の入力をCLIへ渡す処理は設けていない。
- Supabaseの確認では、内部DDLイベント用のRLS補助関数について一般利用者のAPI実行権限を外した。残る通知は、管理用の`_prisma_migrations`にRLSポリシーがないという情報のみ。管理用テーブルをアプリへ公開する必要はない。

本番の血統データへの書き込みテストは行っていない。今回のDB設定は接続ユーザー、権限、RLSポリシー、内部関数の実行権限であり、血統データの行は変更していない。

## 残っているログイン設定

Supabaseの[ログインURL設定](https://supabase.com/dashboard/project/hnhhfcityestinsvcdfw/auth/url-configuration)で、次を設定する。

| 設定欄 | 値 |
| --- | --- |
| Site URL | `https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app` |
| Redirect URLsに追加 | `https://cat-pedigrees-git-feat-mobile-pedigree-ui-nekoya258.vercel.app/auth/callback` |

現在の戻り先が`http://localhost:3000`であることを、メールを送らない無効リンクの応答で確認した。Supabaseの認証URL設定は連携ツールに操作がなく、接続ブラウザーも2回タイムアウトしたため、この変更は実行できていない。

利用できるメールアドレスは、Vercelの登録者のアドレスをサーバー設定へ登録済み。値は公開リポジトリに記載しない。他の利用者を追加する際は`PEDIGREE_ALLOWED_EMAILS`へアドレスを登録し、必要に応じてSupabaseのメール送信設定も確認する。

上記設定後に、本人のメールでログインを確認する。実機のキーボード操作と台紙への試し刷りも残る。登録開始時は、接続先と利用者を確認したうえで`PEDIGREE_WRITES_ENABLED=1`にして再デプロイする。
