# YouTube アナリティクス自動レポート（Evidence.dev）

YouTube Analytics API からチャンネルのデータを毎日取得して、
[Evidence.dev](https://evidence.dev) でグラフ付きのレポートに組み立て、GitHub Pages に公開します。

毎日 **12:00（日本時間）** に GitHub Actions が動いて、最新のデータでレポートが作り直されます。

## できあがるもの

| ページ | 中身 |
| --- | --- |
| `/youtube/` | 直近28日のサマリー（前28日比つき）、視聴回数の推移、登録者の増減、流入経路、デバイス、上位動画 |
| `/youtube/videos` | 動画別の一覧、視聴維持率ランキング、登録につながっている動画ランキング |
| `/youtube/audience` | 国・地域別、年齢と性別の内訳 |

## 仕組み

```
GitHub Actions（毎日12:00 JST）
  └ scripts/fetch-youtube.mjs
      └ YouTube Analytics API → sources/youtube/*.csv
          └ evidence sources → evidence build
              └ GitHub Pages（/youtube 配下）に公開
```

データは CSV としてビルド時に生成し、Evidence が静的サイトに変換します。
サーバーやデータベースは要りません。

## まず動かしてみる（認証なし）

サンプルデータが最初から入っているので、そのまま起動できます。

```bash
cd youtube-analytics
npm install
npm run sources   # CSV を読み込む
npm run dev       # http://localhost:3000 が開く
```

サンプルデータを作り直したいときは `npm run sample` です。

## 実データにつなぐ

### 1. Google Cloud でプロジェクトと API を用意する

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作る（既存のものでも可）
2. 「APIとサービス」→「ライブラリ」から次の2つを有効にする
   - **YouTube Analytics API**
   - **YouTube Data API v3**
3. 「OAuth同意画面」を設定する
   - ユーザーの種類は **外部**、公開ステータスは **テスト** のままで構いません
   - **テストユーザー** に、分析したいチャンネルの Google アカウントを追加してください（これを忘れると認可時に弾かれます）
   - スコープは次の2つ
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
     - `https://www.googleapis.com/auth/youtube.readonly`
4. 「認証情報」→「認証情報を作成」→ **OAuth クライアント ID**
   - アプリケーションの種類: **デスクトップアプリ**
   - できあがった **クライアントID** と **クライアントシークレット** を控える

> テストモードの OAuth クライアントは、リフレッシュトークンの有効期限が7日間です。
> 毎日動かし続けるなら、OAuth同意画面を「本番環境」に公開してください（審査は不要です。
> 自分のチャンネルを自分で読むだけなら、機密スコープの審査対象になりません）。

### 2. リフレッシュトークンを取得する

自分のPCで一度だけ実行します。ブラウザが開くので、チャンネルの Google アカウントで許可してください。

```bash
cd youtube-analytics
YT_CLIENT_ID=<クライアントID> \
YT_CLIENT_SECRET=<クライアントシークレット> \
node scripts/get-refresh-token.mjs
```

ターミナルに表示された `YT_REFRESH_TOKEN` を控えます。

### 3. GitHub Secrets に登録する

リポジトリの **Settings → Secrets and variables → Actions → New repository secret** で、次の3つを登録します。

| 名前 | 値 |
| --- | --- |
| `YT_CLIENT_ID` | クライアントID |
| `YT_CLIENT_SECRET` | クライアントシークレット |
| `YT_REFRESH_TOKEN` | 手順2で取得したトークン |

### 4. 動作確認

**Actions → Daily YouTube report → Run workflow** で手動実行します。
実行結果のサマリーに「✅ YouTube Analytics API から最新データを取得しました。」と出れば成功です。

失敗しても、リポジトリに入っている CSV を使ってビルドは続行されます
（サイトが落ちないようにするためです）。その場合はサマリーに理由が出ます。

### ローカルで実データを取得する

```bash
cd youtube-analytics
YT_CLIENT_ID=... YT_CLIENT_SECRET=... YT_REFRESH_TOKEN=... npm run fetch
npm run sources && npm run dev
```

`sources/youtube/*.csv` が実データで上書きされます。
なお CI は毎回この取得をやり直すので、CSV を commit する必要はありません。

## 公開先

GitHub Pages のサイトに、weather-app と同居する形で配信されます。

- `https://<ユーザー名>.github.io/<リポジトリ名>/` … weather-app
- `https://<ユーザー名>.github.io/<リポジトリ名>/youtube/` … このレポート

Pages のデプロイは `.github/workflows/youtube-report.yml` に一本化しています。
`deploy.yml` は手動実行のみに変更しました（同じ Pages サイトに2つのワークフローから
デプロイすると、後から走ったほうが相手の成果物を丸ごと上書きしてしまうためです）。

## 設定できること

| 環境変数 | 既定値 | 説明 |
| --- | --- | --- |
| `YT_DAYS` | `90` | 取得する日数 |
| `YT_END_DATE` | 3日前 | 集計の最終日（`YYYY-MM-DD`）。YouTube の分析データは数日遅れて確定するため、既定で3日前までを見ています |

取得している指標を増やしたいときは `scripts/fetch-youtube.mjs` の各レポート定義に
メトリクスを足してください。使えるディメンション・メトリクスの一覧は
[YouTube Analytics API のドキュメント](https://developers.google.com/youtube/analytics/channel_reports)にあります。

## グラフの配色について

`evidence.config.yaml` のカテゴリ配色は、色覚多様性（P型・D型・T型）のシミュレーション上でも
隣り合う色が見分けられるように順番まで含めて検証したものです。
色を足したり並べ替えたりすると、この保証が崩れます。変更したときは必ず再検証してください。

## うまくいかないとき

| 症状 | 対処 |
| --- | --- |
| `invalid_grant` が出る | リフレッシュトークンが失効しています。OAuth同意画面がテストモードだと7日で切れるので、本番環境に公開するか、手順2をやり直してください |
| `403 forbidden` が出る | YouTube Analytics API / YouTube Data API v3 が有効になっているか、テストユーザーにアカウントを追加したかを確認してください |
| 視聴者属性が空になる | サンプル数が少ない期間では YouTube が内訳を返しません。`YT_DAYS` を増やすと出てくることがあります |
| レポートがサンプルのまま | Actions の実行サマリーで、取得に失敗した理由を確認してください |
