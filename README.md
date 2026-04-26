# NaNi Execution Lab

> 製造業DX × ローカルAI × ETO（一品一様製造）向け実用ツールの個人技術サイト

公開サイト: **https://yyy19901103-source.github.io/nani-execution-lab/**

---

## 概要

製造業DXの実行事例・AI活用知見を発信し、**ブラウザで完結する実用AIツール9本**を無料で公開しています。

### サイトの特徴

- 🔒 **データ社外送信ゼロ** — 全AIツールがブラウザ内で計算完結
- 💰 **完全無料** — Astro v6 + GitHub Pages + Unsplash CDN（月額¥0運用）
- 📊 **9つのAIツール** — 量産6本 + ETO（一品一様製造）3本
- 📖 **13事例 + 多数のブログ・学習ロードマップ** — 製造DX実務に即した内容

---

## AI Tools（全9本）

### 量産・繰り返し製造向け（6本）
| ツール | アルゴリズム | 用途 |
|--------|-------------|------|
| 生産スケジュール最適化 | GA + NEH + FIFO比較 | ジョブ投入順序最適化 |
| 工程ボトルネック分析 | Little's Law + Monte Carlo | 改善優先順位決定 |
| 需要予測 | Holt-Winters + AR(2) + 季節MA | 在庫計画・原材料発注 |
| 異常検知 | TF.js Autoencoder / Isolation Forest | 予知保全・不良流出防止 |
| 品質予測 | TF.js Dense NN + 信頼区間 + バッチCSV | 歩留まり予測・パラメータ最適化 |
| SPC管理図 | X-bar/R + X-MR + Western Electric | 工程能力評価・Cp/Cpk |

### ETO・一品一様製造向け（3本・新規）
| ツール | アルゴリズム | 用途 |
|--------|-------------|------|
| ETO類似案件見積り | コサイン類似度 + k-NN | 営業段階の概算見積 |
| プロジェクト納期モンテカルロ | PERT 3点 + 1万回 + CPM | 受注時 P50/P80/P95 算出 |
| ETO Job Shopスケジューラ | EDD/SPT/CR ディスパッチング | 受注後の生産計画 |

すべて産業機械・プラント設備・特装車両（または自動車部品・電子機器・食品工場）のリアルなプリセットデータ内蔵。CSVテンプレートDLで自社データ即適用可能。

---

## 技術スタック（月額 ¥0）

```
Astro v6 (SSG) + Tailwind v4
  ├─ Content Collections (Markdown)
  ├─ TF.js (Autoencoder / Dense NN・遅延ロード)
  ├─ Chart.js (LTTBデシメーション)
  ├─ GitHub Actions (自動デプロイ・Node.js 22)
  └─ GitHub Pages (ホスティング)
```

---

## ディレクトリ構成

```
src/
├── pages/
│   ├── ai-tools/        # 9つのAIツール
│   │   ├── eto-similar-quote.astro      # ETO 類似案件見積り
│   │   ├── project-monte-carlo.astro    # プロジェクト納期モンテカルロ
│   │   ├── eto-job-shop.astro           # ETO Job Shop スケジューラ
│   │   ├── production-schedule.astro    # 生産スケジュール最適化
│   │   ├── bottleneck.astro             # 工程ボトルネック分析
│   │   ├── demand-forecast.astro        # 需要予測
│   │   ├── anomaly-detection.astro      # 異常検知
│   │   ├── quality-prediction.astro     # 品質予測
│   │   ├── spc-chart.astro              # SPC管理図
│   │   └── index.astro                  # AI Tools ハブ
│   ├── cases/           # 事例詳細ページ（動的）
│   ├── blog/            # ブログ記事
│   ├── glossary.astro   # 用語集（68語）
│   └── 404.astro
├── content/
│   ├── cases/           # 13事例
│   ├── blog/            # 12ブログ記事
│   ├── news/            # ニュース
│   └── learning/        # 製造DX学習ロードマップ（16週）
├── components/
└── layouts/
```

---

## ローカル開発

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # ./dist/ にビルド
```

Node.js v22+ が必須（Astro v6 要件）。

---

## デプロイ

`main` ブランチに push すると GitHub Actions が自動デプロイ（約1〜2分）。

```bash
git add .
git commit -m "..."
git push
```

---

## ライセンス・著作権

- 本サイトのソースコードは MIT ライセンス
- 事例・ブログ記事の内容は CC BY 4.0
- 一部、Unsplash 画像（クレジット明示・商用OK）を使用

---

## 関連ドキュメント

- [`CODEX_REVIEW_REQUEST.md`](./CODEX_REVIEW_REQUEST.md) — CODEX向けレビュー依頼書

## サイト内主要URL

- [TOP](https://yyy19901103-source.github.io/nani-execution-lab/)
- [AI Tools ハブ](https://yyy19901103-source.github.io/nani-execution-lab/ai-tools/)
- [事例一覧](https://yyy19901103-source.github.io/nani-execution-lab/cases/)
- [製造DX学習ロードマップ](https://yyy19901103-source.github.io/nani-execution-lab/learning/)
- [用語集](https://yyy19901103-source.github.io/nani-execution-lab/glossary/)

---

**Built with [Claude Code](https://claude.com/claude-code) — AIペアプログラミングで2週間構築・継続強化中**
