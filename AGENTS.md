Project: cat-pedigrees (猫の血統書管理システム)

禁止事項
* 英語のみドキュメント作成の禁止
* any型使用禁止
* unknown型使用禁止
* 許可なく依存追加禁止


Mission

Microsoft Accessで運用されていた「猫の血統書管理・検索システム」をモダンなWebアプリケーションへ完全に移行・転生させる。
ブリーダー（Nekoya co.ltd）としての専門的な業務フローを維持しつつ、MacやWindowsを問わず、ミリ単位で正確な血統書を発行できる環境を構築する。

Project Context

Local Path: C:\Users\Nekoya2\appprojects\cat-pedigrees

User Role: ユーザーはコードを読み書きしない「バイブスコーディング」の実践者。

Core Domain: 猫の家系（3世代）、近親交配の警告、特殊サイズ（339mm x 239mm）のPDF印刷。

Tech Stack

Frontend: Next.js (App Router), Tailwind CSS, Lucide React

Backend/DB: Supabase (PostgreSQL), Prisma ORM

PDF Engine: pdf-lib, @pdf-lib/fontkit

Infrastructure: GCP (Google Cloud Platform) 連携を想定（Google AI Ultraライセンス保持者）

Critical Rules for Agents

世代シフト・マッピング: 父猫/母猫ID入力による自動入力時、取得した「本猫」情報を「親世代」としてマッピングし、1世代ずらして展開すること。

特殊サイズPDF: 用紙サイズは 339mm x 239mm 固定。mmからptへの変換（1mm=2.83465pt）を厳守し、左上原点の座標設計を行うこと。

フラットデータのツリー化: DBの95カラムのフラットなデータを PedigreeNode 型（再帰的ツリー）に変換してUIで扱うこと。

近親交配警告: ナンバー（JCU番号等）の重複はリアルタイムで検知し、文字色を青（text-blue-600）に変更すること。

Vibe Coding Protocol

コード生成前に必ず設計案を提示し、ユーザーの「OK」を得てから実装に進むこと（Review-driven）。

専門用語は避け、直感的に理解できる言葉で説明すること。

ユーザーはAntigravity、Cursor、VS Code (Copilot)を使い分ける。第一選択はAntigravity。

* 出力は全て日本語で行うこと
* 成果物は全て日本語で記載すること、正しプログラミング言語やファイル名などは除く
