# study-quest TODO

## 現状サマリー（2026-07-13 時点）

**今の作業状態**: `bqyujiyamada-code/study-quest`をローカルにclone・セットアップし、実データでのDynamoDB/S3/Gemini API疎通確認、および大規模なリファクタリング（共通ロジックの一元化・3件の実バグ修正）まで完了。GitHubにpush済み（`9d7795e`）。ローカル`npm run dev`（ポート3001、3000はmahjong-appが使用中のため自動でずれた）での動作確認のみ実施、本番環境での確認は未実施。

**次にやりたいこと**（詳細は下記「次に着手すべきこと」参照）:
- 本番（Vercelなど）環境での動作確認
- 残っているESLintのreact-hooks系エラー・警告への対応（今回のリファクタ対象外）
- `/admin`ページが無認証でアクセス可能な点（精算リセットという破壊的操作を含む）の扱いを検討

## これまでの成果

### セットアップ
- `~/projects/study-quest`にclone、`npm install`実行（522パッケージ、脆弱性5件は`npm audit`で詳細確認可能・未対応）
- `.env.example`がリポジトリに存在しないため、`process.env`参照箇所をコード全体からgrepして必要な環境変数を洗い出した:
  - `AWS_REGION`（`ap-northeast-1`）
  - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`（DynamoDB3テーブル・S3バケット専用のIAMユーザー`study-quest-app`の認証情報）
  - `AWS_S3_BUCKET_NAME`（`study-quest-assets`。未設定時のフォールバックと同値）
  - `GEMINI_API_KEY`（Google Generative AI。フォールバック無し、未設定だと実行時エラー）
  - `.env.local`を作成（`.gitignore`済みでコミットされない）
- IAMユーザー`study-quest-app`を新規作成。当初のポリシーは`GetItem`/`PutItem`/`DeleteItem`/`Query`/`Scan`のみで`UpdateItem`が漏れていたことが後のリファクタ中に判明し、追加対応した（下記参照）
- 対象AWSリソース:
  - DynamoDB: `UserStats`（PK: userId）、`StudyQuestLogs`（PK: userId / SK: timestamp）、`study_quest-knowledge`（PK: userId / SK: cardId）
  - S3: `study-quest-assets`（画像はCloudFront経由で配信、ドメインは`d3nkmrk6hg66h7.cloudfront.net`）
- 一時的なデバッグ用APIルート（`src/app/api/debugtest9f2a1/`、Next.jsの命名規則上`_`始まりだとルーティングされないため通し番号名にした）を都度作成・検証後に削除する形で、DynamoDB/S3/Gemini APIそれぞれの疎通を実データで確認（テストは`__xxx_test__`系の架空userIdのみを使い、作成したテストデータは都度削除。実データには一切触れていない）

### リファクタリング（2026-07-13 完了）
ユーザーから「リファクタリングできるところを探して」と依頼を受けコードレビューを実施。発見した重複・ハードコーディングを優先度順に一つずつ解消した。過程で **3件の実バグ** を発見・修正できたのが今回の一番の収穫。

- **`src/lib/levels.ts`（新設）**: レベル・お小遣い単価の判定ロジックが2箇所に分散し、計算式自体が異なっていた
  - 表示側（`page.tsx`の`getLevelInfo`）: `RANK_MASTER`（累計**時間**基準、10段階のランク名付き）
  - 精算側（`study.ts`の`getUnitPrice`）: `Math.floor(totalMinutes/100)+1`という全く別の式
  - 例えば累計300分時点で「表示は0.4円/分」なのに「実際の支払いは0.5円/分」というズレが実在することを検証で確認 → 1つの関数に統一し、以降ズレが起きない構造にした
- **`src/lib/db.ts` / `src/lib/s3.ts`**: DynamoDB/S3クライアント生成が3箇所（`src/lib/db.ts`（未使用のデッドコードだった）・`study.ts`・`knowledge.ts`）でバラバラだったのを一本化。リージョンのハードコーディングや、credentialsブロックの有無の不統一も解消
  - **バグ発見**: `knowledge.ts`の`deleteKnowledgeCard`が、S3画像を削除する際にCloudFront URL（`https://d3nkmrk6hg66h7.cloudfront.net/...`）を`.amazonaws.com/`で分割しようとしていたため、条件に一致せず**S3側の画像削除が常に無言でスキップされていた**（DynamoDBのレコードは消えるが画像ファイルは残り続ける）。`new URL(imageUrl).pathname`でキーを取り出す実装に修正し、実際にオブジェクトを作成→削除して直っていることを確認
  - CloudFrontドメインも`knowledge.ts`のベタ書きから`CLOUDFRONT_DOMAIN`環境変数（フォールバック値あり）に変更
- **`src/lib/user.ts`（新設）**: `userId`が5ファイルにハードコーディング、しかも`"daughter_01"`（勉強記録系）と`"user_01"`（ナレッジ系）で値が割れていた。ユーザーに確認したところ「別々のまま、値だけ共通定数にまとめてほしい」とのことで、`STUDY_USER_ID`/`KNOWLEDGE_USER_ID`として集約（統一はしていない）
- **`src/lib/subjects.ts`（新設）**: 教科の定義が複数箇所に重複
  - 勉強記録用7科目（算数・国語・理科・社会・英語・論理・作文）: `page.tsx`・`admin/page.tsx`・`history/page.tsx`に別々定義
    - 集約時に判明: `admin/page.tsx`の科目バッジ色が`page.tsx`の定義と5科目分ズレていた（別々に編集され続けた結果と思われる）。`page.tsx`側の定義を正として統一したため、**admin画面のバッジ色が一部変わっている**
  - ナレッジカード用4科目（math/japanese/science/society）: `knowledge-generator.ts`・`knowledge/page.tsx`（2箇所）・`knowledge/new/page.tsx`に絵文字有無違いで実質4箇所重複 → `KNOWLEDGE_SUBJECTS`・`getKnowledgeSubjectLabel`に統一
- **`src/lib/types.ts`（新設）**: `StudyLog`・`UserStats`・`KnowledgeCardContent`・`LogicLesson`型を新設し、`actions/`配下と各ページに散らばっていた`any`（20箇所のESLint `no-explicit-any`エラー）を解消
  - **バグ発見**: `admin/page.tsx`が存在しない`log.unpaid`プロパティを参照していた（実際のフィールドは`status: "unpaid"|"paid"`）。`any[]`型がこれを隠しており、常に`undefined`＝常に「精算済み」表示になっていた。実データ（91件中9件が実際は未精算）で確認したところ、修正前は全91件が精算済み表示になっていたことを確認し、`log.status === "paid"`に修正
- **`study.ts`の細部強化**:
  - `getUnpaidLogs`（Scan）・`getAllStudyLogs`（Query）に`LastEvaluatedKey`のページングループを追加（データ増加時の欠落防止）
  - `executeSettlement`を、対象ログ全件を丸ごと`PutCommand`で上書きする方式から、`status`/`paidAt`のみを更新する`UpdateCommand`に変更（Scan取得後の他更新を巻き戻すリスクを減らす）
    - この変更には`dynamodb:UpdateItem`権限が必要だったが、当初のIAMポリシーに含まれていなかった（提案時の漏れ）。ユーザーに追加してもらい、テスト用架空ユーザーでの精算フロー（未精算ログ作成→取得→精算実行→ステータス確認→残高0確認→削除）で正常動作を確認
- 空の残置ファイル`src/app/page.tsx.save`を削除
- 検証: `npx tsc --noEmit`（0エラー）・`npx eslint src`（`no-explicit-any`は0件、残るのは今回のリファクタ対象外のreact-hooks系エラー2件・警告数件）・`npm run build`・全ページ200確認・実データでの動作確認、すべて完了
- コミットは1本（`9d7795e`、Co-Authored-By付き）、push済み

### 開発環境メモ
- リポジトリにgit identityが未設定だったため、schedule-share/mahjong-appと同じ`bqyujiyamada-code` / `bqyujiyamada-code@users.noreply.github.com`をこのリポジトリのローカル設定として追加（`--global`ではなくリポジトリ単位）
- Next.jsのApp Routerは`_`始まりのディレクトリ名（例: `src/app/api/_debug-test`）を「private folder」としてルーティング対象外にする点に注意（検証用ルートを作る際にハマった。`debugtest9f2a1`のような通し番号名で回避）

## 次に着手すべきこと

### 動作確認
- 本番（Vercelなど）デプロイ環境での動作確認は未実施（ローカル`npm run dev`のみ確認済み）
- モバイル実機での見た目・操作感は未確認

### コード品質（今回のリファクタでは対象外にしたもの）
- ESLintに残るreact-hooks系の指摘（優先度低〜中）:
  - `admin/page.tsx`: `useEffect`内で`fetchData()`を直接呼んでいる（`react-hooks/set-state-in-effect`）
  - `cube-quest/page.tsx`: `useMemo(getPatterns, [])`が「インライン関数ではない」と指摘（`react-hooks/use-memo`）
  - `history/page.tsx`・`knowledge/page.tsx`・`page.tsx`: `useEffect`の依存配列に`userId`/`fetchCards`が抜けている警告（`react-hooks/exhaustive-deps`）
- `knowledge/page.tsx`の`<img>`タグ2箇所（`next/image`未使用の警告）

### 設計面
- `/admin`ページは認証なしで誰でもアクセス可能。「精算を確定してお小遣い残高を0にリセット」という破壊的操作もワンクリックで実行できてしまう（mahjong-appと同様、家族内利用前提であれば許容範囲かもしれないが未確認・未合意）
- `admin/page.tsx`の科目バッジ色を`page.tsx`基準に統一した影響で、見た目が一部変わっている点をユーザーに実機で見てもらい問題ないか確認したい
