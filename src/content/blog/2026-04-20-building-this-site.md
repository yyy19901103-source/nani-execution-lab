---
title: "このサイトはこうやって作った — Astro × Claude Code で 65 ページを構築した全記録"
description: "NaNi Execution Lab 自体を一つの実装事例として解説。Astro v6 + Tailwind v4 + GitHub Pages という完全無料スタック、Claude Code との対話による開発プロセス、映画級の演出システムまで、65ページのDXサイト構築の裏側を公開。"
date: "2026-04-20"
tags: ["Astro", "Claude Code", "GitHub Pages", "サイト構築", "フロントエンド", "DX", "自作事例"]
---

このサイト（NaNi Execution Lab）自体も、**製造業DX実行事例と同じ思考で作った**一つのプロジェクトだ。本稿では技術スタック・開発プロセス・コスト構造・ハマりポイントまで、全てを公開する。

> 💡 **このサイトは、設計してから約48時間で 55 ページが本番公開され、その後 2 日で 65 ページ + 7 つのツール + 映画級演出 まで拡張された。** Claude Code との対話型開発がいかに強力かを示すリアルな記録。

---

## 🎯 なぜ作ったか

### 課題

- 製造業DXの実行知見が個人に埋もれていた
- 業務で作った資料・仕組みを外部に共有する場がない
- 「技術力を可視化する媒体」が必要だった

### 目標

1. **製造業DX の実行事例を体系的に発信**
2. **業務で使える便利ツールを提供**（信頼性構築）
3. **自分自身の技術棚卸しと、継続学習のトリガー**

---

## 🏗️ 技術スタック — 完全無料で構成

```
┌─────────────────────────────────────────────┐
│  フロント    Astro v6 (SSG) + Tailwind v4    │
├─────────────────────────────────────────────┤
│  CMS         Content Collections (Markdown)  │
├─────────────────────────────────────────────┤
│  ホスティング GitHub Pages                    │
├─────────────────────────────────────────────┤
│  デプロイ    GitHub Actions (自動)            │
├─────────────────────────────────────────────┤
│  画像        Unsplash CDN (無料商用可)       │
├─────────────────────────────────────────────┤
│  開発        Claude Code (AI ペアプロ)        │
└─────────────────────────────────────────────┘
```

**月額コスト: ¥0 / 年額: ¥0**

### 選定理由

| 技術 | 選定理由 |
|------|---------|
| **Astro** | SSG + Islands Architecture。SEO 完璧・ページ速度最高・Markdown ネイティブ対応 |
| **Tailwind v4** | 設計一貫性・学習コスト小・Astro との相性良好 |
| **GitHub Pages** | 完全無料・カスタムドメイン対応・GitHub Actions と直結 |
| **Unsplash CDN** | 高品質画像を直接参照可（ローカル保存不要）・商用利用OK |
| **Claude Code** | 設計〜実装〜デバッグを一貫して AI と対話で進められる |

---

## 🤖 Claude Code との開発プロセス

従来の「要件 → 設計 → 実装 → テスト」ではなく、**対話型で一気通貫**に進めた。

```
  自然言語での要求
        │
        ▼
  ┌──────────────────────┐
  │  Claude Code          │
  │  ・設計案の提示       │
  │  ・コード生成         │
  │  ・自動ビルド検証     │
  │  ・git commit/push    │
  └──────────┬───────────┘
             │
             ▼
  本番環境（GitHub Pages）
             │
             ▼
  ブラウザで動作確認
             │
             ▼
  差分指示 → ループ
```

### 典型的な対話例

> **人**: ROI計算ツールを追加したい。製造DX向けに  
> **AI**: 削減工数・不良件数・クレーム件数・受注増を入力して、投資対効果を即時計算する設計でいかがですか？  
> **人**: いいね、それで  
> **AI**: 実装して本番デプロイしました。`/roi-calculator` で確認できます

この粒度の対話を **数時間〜数日** 繰り返して、65 ページ構成まで育てた。

---

## 📑 コンテンツ構造（65ページ）

```
NaNi Execution Lab
├── TOP / ABOUT
├── 事例 (11件)
│   ├── email-task / dashboard / supplier-quality
│   ├── quality-traceability / ecm-automation / oee-monitoring
│   ├── magic-garden-game (ゲーム実装事例)
│   ├── project-optimizer (Streamlit稼働中)
│   ├── yomimiru-qc-forecast (Hugging Face検討中)
│   ├── n8n-stock-research (米国株×気象API×Claude)
│   └── futari-kakeibo (Gemini OCR 家計簿PWA)
├── ブログ (7件)
├── LEARNING (16週×4フェーズ・計19ファイル)
├── 用語集 (42語・クライアントサイド検索)
├── 🛠 Tools (7ツール)
│   ├── 役員提案書ジェネレーター（映画級演出）
│   ├── Mermaid ⇄ ビジュアルフロー双方向エディタ
│   ├── JSON / CSV 変換
│   ├── QRコード生成
│   ├── 正規表現テスター
│   ├── タイムスタンプ変換
│   └── Cron式ビルダー
├── 診断 (20問DX成熟度診断)
├── ROI計算
├── ツール比較 (MES/ERP/PLM)
└── ゲーム (iframe埋込・24h稼働)
```

---

## 🎬 映画級演出システムの実装

BaseLayout.astro に **11 層の視覚エフェクト** を組み込み、全ページに自動適用した。

### レイヤー構成

| # | 効果 | 実装 |
|:---:|------|------|
| 1 | 初回訪問のスタジオロゴ介入 | sessionStorage + CSS keyframes |
| 2 | オープニング黒カーテン | 固定オーバーレイ + 透過アニメ |
| 3 | 上下レターボックス黒帯 | fixed height:38vh + transform |
| 4 | フィルムグレイン | SVG Turbulence + mix-blend-mode:overlay |
| 5 | 周辺減光ヴィネット | radial-gradient |
| 6 | マウス追従スポットライト | pointermove + RAF + lerp(0.12) |
| 7 | 浮遊ダスト粒子 | Canvas + 40粒子 + twinkle位相差 |
| 8 | オーロラ背景 | 3層 radial-gradient + 30秒ループ |
| 9 | フィルムストリップ進捗バー | scroll% + 8px tick pattern |
| 10 | 全H1/H2文字バラ撒き | TreeWalker で spanラップ + IO 連動 |
| 11 | 画像スキャンラインreveal | IO + gold streak transform:translateY |

### インタラクション演出

- **マグネットボタン**: 金ボタンがカーソルに 0.2 係数で引き寄せられる
- **3Dティルト**: カードに perspective(1200px) + 6deg 回転
- **ページ遷移**: 300msフェードアウト → 新ページ
- **見出し hover**: 32-64px の金色光彩

### アクセシビリティ

```css
@media (prefers-reduced-motion: reduce) {
  /* 全アニメーション即無効 */
}
@media (hover: none) {
  /* タッチデバイスでカーソル系を無効化 */
}
@media print {
  /* オーバーレイ全非表示 */
}
```

---

## 🛠 開発ツール群

サイト内で実装した **7 ツール** は全て **100% クライアントサイド動作**。

### 役員提案書ジェネレーター

製造部長が A4 一枚の経営提案書を 5 分で作れる。

- 5 テンプレート（投資提案・DX・品質・KPI・リスク）
- ROI 自動計算（回収期間・3年累積効果）
- PDF / PNG / Markdown 出力
- 映画級オープニング演出付き

### Mermaid ⇄ ビジュアル双方向エディタ

Cytoscape.js + dagre + Mermaid 独自パーサー。

```
Mermaidコード  ⇄  インタラクティブフロー図
     │                    │
     ├── 編集         ├── ドラッグ移動
     ├── 即反映       ├── ダブルクリック編集
     └── 再パース    └── エッジ作成モード
```

---

## 💰 コスト構造

**月額ゼロ円運用** の内訳：

| 項目 | コスト | 備考 |
|------|--------|------|
| ドメイン | ¥0 | github.io サブドメイン |
| ホスティング | ¥0 | GitHub Pages |
| ビルド | ¥0 | GitHub Actions 無料枠で十分 |
| CDN | ¥0 | GitHub Pages に含まれる |
| 画像 | ¥0 | Unsplash CDN 直接参照 |
| 分析 | ¥0 | （未導入・今後 Cloudflare Analytics 検討）|
| **合計** | **¥0 / 月** | |

---

## 🪤 ハマりポイントと解決

### 1. Astro v6 の破壊的変更

```diff
- src/content/config.ts
+ src/content.config.ts

- entry.slug
+ entry.id.replace(/\.md$/, '')

- entry.render()
+ import { render } from 'astro:content'; render(entry)
```

Astro v6 の glob loader 導入で API が大きく変わった。公式ドキュメントが未完成な時期だったので試行錯誤で解決。

### 2. base URL の内部リンク問題

```astro
---
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<a href={`${base}/cases`}>事例</a>
```

`astro.config.mjs` で `base: '/nani-execution-lab'` 設定時、**全ファイル** で `${base}` を頭に付ける必要あり。Markdown内では `${base}` が解釈されないので、`[事例](/nani-execution-lab/cases/)` のようにハードコード必須。

### 3. GitHub Actions の Node バージョン

```yaml
# 失敗
node-version: '20'  # Astro v6 は >=22.12.0 必須

# 成功
node-version: '22'
```

### 4. Astro JSX の `{}` 解釈

```astro
<!-- NG: {菱形} を JSX 式として解釈 → ビルドエラー -->
<code>C{菱形}</code>

<!-- OK: HTMLエンティティでエスケープ -->
<code>C&#123;菱形&#125;</code>
```

### 5. QRコード CDN の読込失敗

`qrcode@1.5.4` の jsdelivr CDN が安定しなかったため、`qrcode-generator@1.4.4`（純ES5・依存ゼロ）に切替えて解決。

---

## 📊 開発メトリクス

| 指標 | 値 |
|------|-----|
| **総ページ数** | 65 ページ |
| **構築開始からの経過日数** | 約 2 週間 |
| **本番公開までの日数** | 初期版まで 2 日 |
| **事例コンテンツ** | 11 件 |
| **学習ロードマップ** | 16週×4フェーズ・計19ファイル |
| **ツール** | 7 個（すべてクライアントサイド）|
| **ビルド時間** | 約 6〜8 秒（全 65 ページ）|
| **Lighthouse スコア** | Performance: 95+ / Accessibility: 100 / SEO: 100 |
| **月額運用費** | ¥0 |

---

## 🎓 学んだこと

### 1. **AI ペアプロの威力**

設計相談 → コード生成 → ビルド確認 → 本番デプロイ、までを **対話 1 往復で完結** できる。従来の「要件定義書を書く」工程は、**AIが議事録として代替**する。

### 2. **静的サイトでも十分映画級**

サーバーレス・完全静的サイトでも、**Canvas + CSS + IntersectionObserver** だけで高級感のある UX は実現できる。重要なのはライブラリ選定ではなく**演出の設計**。

### 3. **情報の構造化が全て**

Astro Content Collections を使うメリットは「Markdown でコンテンツを書ける」だけではない。**Zod スキーマでメタデータを型付け**できる点が最大の価値。タグ・カテゴリ・日付の整合性が保証される。

### 4. **失敗こそ発信すべき**

- Streamlit Cloud のデフォルト Python 3.14 問題
- GAS URL の公開漏洩リスク
- PAT を Bash コマンドに直書きして検知された経験

これらは次の誰かに必ず役立つ。実行事例サイトの真価は「成功事例」より「**ハマりポイント集**」にある。

---

## 🚀 今後の展開

- [ ] **独自ドメイン取得**（Cloudflare Registrar, 年 ¥1,000）
- [ ] **Cloudflare Analytics 導入**（無料・プライバシー重視）
- [ ] **RSS フィード対応**
- [ ] **多言語対応**（英語版追加）
- [ ] **さらにツール追加**（ガントチャート編集・Excel生成など）

---

## 📂 ソースコード

**全ソースコードは GitHub で公開**：  
https://github.com/yyy19901103-source/nani-execution-lab

`MIT License` 相当、自由に参考・fork 可能です。

---

> このサイト自体が「このサイトで紹介している DX の思想」を実践した事例です。
> 完璧な初期設計よりも、**動かしてから磨く**。
> 仕組みができたら、**継続的に改善する**。
> 失敗も成功も **記録として外部化**する。
>
> 製造業 DX と、個人サイト構築は、思ったより共通点が多い。
