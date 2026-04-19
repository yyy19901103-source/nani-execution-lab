---
title: "ふたりの暮らし家計簿 — AIノート読み取り家計管理PWA"
description: "手書きノートをスマホで撮影するだけでGemini AIが自動入力。Google Sheetsと連携した夫婦二人のためのモバイルファースト家計簿アプリ。依存ゼロ・単一HTMLファイルで完結。"
category: "AI開発・モバイル"
date: "2026-04-01"
tags: ["JavaScript", "Gemini AI", "Google Apps Script", "PWA", "家計管理", "OCR", "モバイル"]
featured: true
---

## 🌐 ライブデモ

**👉 [今すぐ使う（PWA）](https://yyy19901103-source.github.io/kehi-seisan/)**  
📦 [GitHub リポジトリ](https://github.com/yyy19901103-source/kehi-seisan)

スマホで開いて「ホーム画面に追加」すればアプリのように起動できます。

---

## 背景

「毎月手書きのノートで家計管理しているが、スマホアプリに転記するのが面倒」——そのギャップを埋めるため、**ノートを撮影するだけでAIが自動入力する**家計簿アプリを構築した。

インストール不要・ログイン不要・サーバー代ゼロ。スマホのホーム画面に追加すればアプリとして使える。夫婦ふたりの収支を一元管理し、Google Sheetsに自動保存することで過去履歴もいつでも参照できる。

---

## できること

| 機能 | 説明 |
|------|------|
| **AI OCR 自動入力** | 手書き家計ノートをカメラ撮影 → Gemini 2.5 Flashが項目を自動認識・フォームに入力 |
| **リアルタイム収支計算** | 入力のたびに収入・支出・繰越額を即時計算 |
| **Google Sheets 保存** | Google Apps Script経由でスプレッドシートに永続保存 |
| **履歴閲覧** | 過去の月次記録をカード形式で一覧表示 |
| **PWA対応** | ホーム画面追加でネイティブアプリのように起動 |
| **週次生活費管理** | 1〜4週目の週ごと予算 + 予備費を個別管理 |

---

## 技術構成

```
kehi-seisan/
└── index.html    # 単一ファイル（全機能を含む）
```

**外部依存は2つのみ（CDN）:**
- Tailwind CSS（スタイリング）
- Kiwi Maru フォント（Google Fonts・かわいい和風フォント）

**バックエンド:**
- Google Apps Script（GAS）— POST: 保存 / GET: 履歴取得

**AI:**
- Gemini 2.5 Flash API — 画像→JSON変換（OCR）

---

## 処理フロー

```
① カメラ起動（スマホの場合はリアカメラ）
        ↓
② 画像を Base64 に変換（FileReader API）
        ↓
③ Gemini 2.5 Flash API へ送信
   プロンプト: 家計簿の項目一覧 + JSON形式で返却指示
   出力: { year, month, incomeS, incomeA, fixIns1, ... }
        ↓
④ JSONをフォーム各フィールドに自動入力
        ↓
⑤ リアルタイム集計（収入 - 支出 = 繰越）
        ↓
⑥「スプレッドシートに保存」→ GAS POSTリクエスト
        ↓
⑦ Google Sheets に行追加・履歴から取得可能に
```

---

## 実装のポイント

### Gemini OCR — 手書きノートの構造化

Gemini 2.5 Flashに「この画像から家計項目をJSON形式で返してください」と指示するだけで、手書きの数字を正確に抽出できる。`responseMimeType: "application/json"` を指定することでパース不要な純粋JSONが返ってくる。

```javascript
const payload = {
    contents: [{
        parts: [
            { text: prompt },  // 抽出項目の定義
            { inlineData: { mimeType: "image/png", data: base64 } }
        ]
    }],
    generationConfig: { responseMimeType: "application/json" }
};
```

数値が読み取れない項目は `0` として返すようプロンプトで指示し、エラーが起きない設計にした。

### Google Apps Script との連携

専用バックエンドを持たずに永続化を実現。GASのウェブアプリURLに対してPOST/GETするだけでGoogle Sheetsの読み書きができる。月次データの保存・閲覧に十分な性能。

### Exponential Backoff リトライ

Gemini APIは高負荷時にエラーが返ることがあるため、最大5回・指数バックオフでリトライする設計にした。

```javascript
const delay = Math.pow(2, retryCount) * 1000;
await new Promise(r => setTimeout(r, delay));
```

### PWAとしてホーム画面に追加

`<meta name="viewport" content="...user-scalable=no">` と `<meta property="og:*">` を適切に設定することで、LINEで共有した際もプレビューが表示され、ホーム画面追加後はアプリライクに動作する。

---

## 管理する家計項目

### 収入
- 前月くりこし
- 給料（芯・愛）
- 売電 / その他

### 固定支出
- 保険1・保険2
- 通信費（万ピコム）
- 投資・医療費
- 光熱費予算（水道実績・電気実績）

### 生活費
- 週次予算（1W〜4W）+ 予備費
- 交通・特別費・携帯通信
- 貯金・おこづかい（各自）

---

## UI設計の工夫

- **かわいいデザイン**: ピンクグラデーション・角丸カード・Kiwi Maruフォントで日常使いしやすい見た目
- **OCRスキャンアニメ**: AI解析中は紫色のスキャンラインアニメーションでフィードバック
- **リアルタイム集計バー**: 入力のたびに Income / Expense / Carry を3色で即時表示
- **3画面シングルページ**: メニュー → 入力 → 履歴 をページ遷移なしで切り替え

---

## コスト

| 項目 | コスト |
|------|--------|
| ホスティング | **無料**（GitHub Pages） |
| Google Apps Script | **無料** |
| Gemini API | 月数十回の利用なら **無料枠内** |
| **合計** | **¥0/月** |

---

## 技術選定の理由

- **単一HTMLファイル**: インストール・ビルド不要。URLをLINEで共有するだけで夫婦どちらでも使える。
- **Gemini 2.5 Flash**: 手書き認識精度が高く、JSON出力指定ができる。OCRユースケースに最適。
- **Google Apps Script**: 別途DBサーバー不要。既存のGoogleアカウントと連携できる。
- **Tailwind CDN**: 追加設定ゼロでモバイル最適化済みのスタイリングが使える。
