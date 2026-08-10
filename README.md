# 天気予報 Web アプリ

OpenWeather One Call API 4.0 を使った 2 週間天気予報アプリです。スマートフォン向けのミニマルなデザインで、ログイン不要で利用できます。

## 機能

- **都市検索** — 世界中の都市名（日本語・英語）をインクリメンタルサーチ
- **2 週間予報** — 今週・来週をタブで切り替え、日付タップで詳細表示
- **表示項目** — 天気・気温（最高/最低）・湿度・降水確率
- **現地時刻表示** — 選択した都市の現在時刻を UTC オフセット付きでリアルタイム表示
- **AI 外出アドバイス** — Gemini API による服装・持ち物のアドバイス生成
- **お気に入り** — よく調べる都市を端末に保存（localStorage、ログイン不要）

## 技術スタック

| カテゴリ | 採用技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) |
| UI | Tailwind CSS 3 / Font Awesome 6 |
| 天気 API | OpenWeather One Call API 4.0 |
| AI | Google Gemini 2.0 Flash |
| デプロイ | Vercel |

## ディレクトリ構成

```
weather_webapp_01/
├── front/                        # Next.js アプリ
│   ├── app/
│   │   ├── layout.jsx            # ルートレイアウト・favicon 設定
│   │   ├── globals.css           # グローバルスタイル
│   │   ├── page.jsx              # メイン UI（検索・予報・お気に入り）
│   │   └── api/
│   │       ├── geocode/          # 都市名 → 緯度経度 変換
│   │       ├── weather/          # 14 日間予報取得
│   │       └── ai-advice/        # Gemini による外出アドバイス
│   └── public/                   # favicon 各サイズ・webmanifest
├── firebase/                     # Firebase 設定（将来利用）
└── other/                        # 環境変数・メモ（gitignore 対象）
```

## セットアップ

### 必要な API キー

| キー | 取得先 | 備考 |
|---|---|---|
| `OPENWEATHER_API_KEY` | [OpenWeather](https://openweathermap.org/) | **One Call by Call** プランへの登録が必要 |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) | 無料枠あり |

### ローカル開発

```bash
# 1. 依存パッケージのインストール
cd front
npm install

# 2. 環境変数の設定
cp .env.local.example .env.local
# .env.local に各 API キーを記入

# 3. 開発サーバー起動
npm run dev
# → http://localhost:3000
```

### Vercel デプロイ

1. Vercel でリポジトリをインポート
2. **Root Directory** を `front` に設定
3. **Environment Variables** に以下を追加：
   - `OPENWEATHER_API_KEY`
   - `GEMINI_API_KEY`
4. デプロイ

## 環境変数

`front/.env.local` に設定（本番は Vercel の Environment Variables で管理）：

```env
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## 追加実装予定

- [ ] 外出 AI 相談の拡充
- [ ] 海外都市の時間帯別予報
- [ ] PWA 対応（プッシュ通知）
