---
title: "n8n × Claude AI 米国株リサーチ自動化"
description: "気温・消費者需要トレンドと米国株価の相関を毎朝自動収集・分析。n8nワークフロー + Claude Haiku APIで日次レポートを自動生成するゼロコスト運用システム。"
category: "業務自動化"
date: "2026-04-15"
tags: ["n8n", "Claude API", "自動化", "株式リサーチ", "ワークフロー", "Windows"]
featured: true
---

## 背景

「消費財銘柄の株価は気温・季節需要と相関するはず」——その仮説を毎朝手動で確認するのは現実的でない。

気象庁API・Yahoo Finance・Claude AIを組み合わせて**毎朝自動でリサーチメモを生成**するシステムを、ノーコードワークフローツール「n8n」で構築した。自動売買は行わず、情報整理と考察の生成に特化した安全設計。

---

## できること

| 機能 | 説明 |
|------|------|
| **気象データ取得** | 気象庁APIから東京の気温・天気予報を自動取得 |
| **株価データ取得** | Yahoo Finance APIから対象6銘柄の最新株価・変動率を取得 |
| **AI分析レポート生成** | Claude Haiku APIで気温×株価の相関考察を日本語Markdownで自動作成 |
| **日次ファイル出力** | `daily-report-YYYY-MM-DD.md` として自動保存 |
| **毎朝定時実行** | n8n cronで朝7時に全ノードを自動実行 |

---

## システム構成

```
n8n-stock-research/
├── workflow.json          # n8nワークフロー定義（8ノード）
├── docker-compose.yml     # n8nコンテナ設定
├── setup-npm.ps1          # Docker不要のnpmインストール版
├── start-n8n-internal.bat # 環境変数付き起動バッチ
├── .env.example           # 環境変数テンプレート
├── claude-prompt.md       # プロンプトカスタマイズ用
└── output/
    └── daily-report-*.md  # 日次レポート出力先
```

**n8nワークフロー（8ノード）:**

```
[Cron: 毎朝7時]
    ↓
[HTTP: 気象庁API] → 東京気温・天気
    ↓
[HTTP: Yahoo Finance × 6銘柄] → 株価・変動率
    ↓
[Function: データ整形] → Claudeへの入力を構造化
    ↓
[HTTP: Claude Haiku API] → 相関考察・Markdownレポート生成
    ↓
[Function: ファイル名生成] → daily-report-YYYY-MM-DD.md
    ↓
[Write File: output/保存]
    ↓
[Set: 完了ステータス]
```

---

## 対象銘柄

| ティッカー | 銘柄名 | 選定理由 |
|-----------|--------|----------|
| **UL** | ユニリーバ | アイスクリーム・夏需要との相関 |
| **GIS** | ゼネラルミルズ | シリアル・季節消費財 |
| **KO** | コカ・コーラ | 気温と清涼飲料需要 |
| **PEP** | ペプシコ | スナック・飲料の複合消費財 |
| **SBUX** | スターバックス | コールドドリンク季節需要 |
| **MCD** | マクドナルド | 客足と気象条件の相関 |

`.env` の `TARGET_TICKERS` で自由にカスタマイズ可能。

---

## 実装のポイント

### Windows環境での n8n セットアップ

n8nはDocker推奨だが、Windows環境ではnpmグローバルインストールでも動作する。ただしn8nの環境変数制約（デフォルトでファイルアクセス・外部モジュールが制限）を解除する必要があった。

```powershell
# 必須の環境変数（start-n8n-internal.bat に記述）
$env:N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES = "false"
$env:N8N_RESTRICT_FILE_ACCESS_TO = ""
$env:N8N_BLOCK_ENV_ACCESS_IN_NODE = "false"
$env:NODE_FUNCTION_ALLOW_BUILTIN = "*"
$env:NODE_FUNCTION_ALLOW_EXTERNAL = "*"
```

### Yahoo Finance API v8 対応

2024年以降、Yahoo Finance APIはv7→v8に変更され認証要件が変わった。`query1.finance.yahoo.com/v8/finance/quote` エンドポイントを使用し、適切なUser-Agentヘッダーを設定することで安定動作を確認。

### Claude Haiku によるレポート生成

コスト最小化のためClaude Haikuを採用。プロンプトは `claude-prompt.md` に外出しして、ユーザーが自由にカスタマイズできる設計。

```
生成レポートの構成:
1. 本日の気象サマリー（気温・天気）
2. 各銘柄の株価・前日比
3. 気温トレンドと銘柄の相関考察
4. 注目ポイント・次回確認事項
※ 投資判断・売買推奨は含まない
```

---

## 構築時のトラブルと解決

| 問題 | 原因 | 解決 |
|------|------|------|
| n8n 起動後にディレクトリ消失 | `Stop-Process` 強制終了でファイルロック → 再起動時に破損 | 正規の `n8n stop` コマンドで終了、再インストール |
| Yahoo Finance 401エラー | v7→v8 API仕様変更 | エンドポイントをv8に変更、Headerを追加 |
| cron式が無効 | n8n は6フィールド cron（秒含む）を要求 | `0 7 * * *` → `0 0 7 * * *` に修正 |
| Functionノードでファイル書き込み不可 | n8nのデフォルトセキュリティ制約 | 環境変数バッチで制約解除 |

---

## 運用コスト

| 項目 | コスト |
|------|--------|
| n8n | **無料**（セルフホスト） |
| 気象庁API | **無料** |
| Yahoo Finance API | **無料** |
| Claude Haiku API | **月約¥10**（1日1回・日本語500トークン相当） |
| **合計** | **月約¥10** |

---

## 技術選定の理由

- **n8n**: ローカル実行・無料・8ノード程度の自動化に最適。Zapierと違いAPIコール制限なし。
- **Claude Haiku**: GPT-4oの1/20以下のコストで日本語考察を高品質生成。リサーチ補助用途に最適。
- **気象庁API**: 無料・高信頼・JSON形式。商用APIと遜色ない品質。
- **npmインストール版**: Dockerが使えないWindows環境でもセットアップ1コマンド。

---

## 出力サンプル

```markdown
# 日次リサーチメモ — 2026-04-15

## 🌤 本日の東京気象
最高気温: 22°C / 天気: 晴れ時々曇り

## 📈 対象銘柄
| 銘柄 | 株価 | 前日比 |
|------|------|--------|
| KO   | $63.2 | +0.8% |
| PEP  | $171.4 | -0.3% |
...

## 💡 相関考察（Claude Haiku）
本日の22°C・晴れ傾向は清涼飲料需要に緩やかなプラス影響が
予想されます。KOの+0.8%上昇はこの季節性トレンドと
一致しており...（以下、投資判断なし・情報整理のみ）
```
