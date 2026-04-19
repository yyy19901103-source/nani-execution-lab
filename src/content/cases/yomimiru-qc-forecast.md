---
title: "読み見る — 音読品質AI分析ツール"
description: "音声ファイルをアップロードするだけで、Whisper文字起こし・ポーズ検出・躓き異常検知・NeuralProphetによる14日間成長予測まで全自動分析。読み聞かせ品質の継続的改善を支援するStreamlitアプリ。"
category: "AI分析・音声処理"
date: "2026-04-10"
tags: ["Python", "Whisper", "NeuralProphet", "Isolation Forest", "Streamlit", "音声処理", "異常検知"]
featured: true
---

## 🌐 ソース・デプロイ

📦 **[GitHub リポジトリ](https://github.com/yyy19901103-source/yomimiru-qc-forecast)**

> **推奨デプロイ先: Hugging Face Spaces**  
> torch + Whisper + NeuralProphet の依存サイズが大きいため、Streamlit Community Cloud（1GB制限）ではなく **Hugging Face Spaces（16GB RAM・ffmpeg標準搭載）** でのデプロイを推奨します。

---

## 背景

**対象ユーザー:** 読み聞かせ配信者・子どもの音読練習を見守る保護者・朗読や語学の自己改善に取り組む方

「読み聞かせの品質をどうやって客観的に測るか」——感覚ではなくデータで改善サイクルを回したい、というニーズから生まれたツール。

従来は「なんとなく上手くなった気がする」程度の主観評価しかできなかった音読練習を、**AI音声解析 × 統計的異常検知 × 時系列予測**の3層で定量化する。

録音ファイルを投げれば、どこで詰まったか・どんな単語で躓く傾向があるか・この調子で練習を続けると2週間後にどう成長するかが自動で可視化される。

---

## できること

| 機能 | 説明 |
|------|------|
| **音声文字起こし** | Whisper（small model・日本語）で高精度トランスクリプト生成 |
| **ポーズ検出** | 200ms以上の無音区間を自動検出・箇所別に分類 |
| **躓き異常検知** | Isolation Forestで統計的外れ値の躓きパターンを特定 |
| **構文別分析** | spaCy/Stanzaで品詞分類（名詞・動詞・形容詞等）別の躓き傾向を可視化 |
| **成長予測** | NeuralProphetで14日間の品質スコア予測・週次トレンド表示 |
| **セッション管理** | SQLiteで全セッション永続保存・履歴比較 |
| **デモデータ生成** | 実データなしでもUIを体験できるサンプル生成機能 |

> **品質スコアについて:** ポーズ頻度・躓き単語数・音読速度の3指標を 0〜100 に正規化して合成した指標。スコアが高いほど流暢な読み上げを示す。

---

## 技術構成

```
yomimiru-qc-forecast/
├── app.py                  # 528行：Streamlit UI・4タブ制御
├── pipeline/
│   ├── transcriber.py      # 151行：Whisper音声→テキスト変換
│   ├── pause_detector.py   # 125行：無音区間検出・分類
│   ├── anomaly_detector.py # 84行：Isolation Forest異常検知
│   ├── syntax_analyzer.py  # 199行：spaCy/Stanza品詞分析
│   └── forecaster.py       # 116行：NeuralProphet時系列予測
├── qc/
│   ├── metrics.py          # 品質スコア算出
│   └── charts.py           # Plotlyグラフ生成
└── database.py             # SQLiteセッション永続化
```

**合計: 約1,481行のPythonコード**

---

## 処理パイプライン

```
① 音声入力（.wav / .mp3 / .m4a）
        ↓
② Whisper文字起こし
   モデル: small（日本語最適化）
   出力: テキスト + タイムスタンプ付きセグメント
        ↓
③ ポーズ検出
   閾値: MIN_PAUSE_S = 0.20秒
   → 短ポーズ（0.2〜0.5s）/ 長ポーズ（0.5s以上）に分類
        ↓
④ 異常検知（Isolation Forest）
   汚染率: CONTAMINATION = 10%
   特徴量: ポーズ時間・位置・周辺テキスト長
   → 統計的に「異常な躓き」を自動フラグ
        ↓
⑤ 構文分析
   spaCy/Stanza による品詞タグ付け
   → NOUN/VERB/ADJ/NUM別の躓き率を集計
        ↓
⑥ NeuralProphet予測
   予測期間: FORECAST_DAYS = 14日
   特徴量: 過去セッションの品質スコア推移
   → 週次トレンド + 信頼区間付き成長予測
        ↓
⑦ Streamlit 4タブUI で可視化
   - Dashboard（サマリー・スコア推移）
   - セッション分析（ポーズ分布・異常箇所）
   - 躓き詳細（品詞別・単語別ランキング）
   - 成長予測（14日間フォーキャスト）
```

---

## 実装のポイント

### Whisper + ポーズ検出の統合

Whisperはセグメント単位でタイムスタンプを返す。セグメント間のギャップをポーズとして検出し、200ms未満は通常の間、それ以上を「引っかかり」として記録する設計にした。

```python
# ポーズ検出の核心部分
for i in range(len(segments) - 1):
    gap = segments[i+1].start - segments[i].end
    if gap >= MIN_PAUSE_S:
        pauses.append(PauseEvent(
            position=segments[i].end,
            duration=gap,
            preceding_text=segments[i].text,
            category='long' if gap >= 0.5 else 'short'
        ))
```

### Isolation Forest による異常検知

全ポーズが等しく問題というわけではない。統計的に「この読み手にとっての異常な躓き」を検出するため、Isolation Forestを採用。セッション内のポーズを多次元特徴量（時間・位置・前後テキスト長）に変換し、外れ値スコアでフラグを立てる。

```python
detector = IsolationForest(contamination=IF_CONTAMINATION, random_state=42)
features = extract_pause_features(pauses)  # shape: (n_pauses, n_features)
labels = detector.fit_predict(features)    # -1: 異常, 1: 正常
anomalies = [p for p, l in zip(pauses, labels) if l == -1]
```

### NeuralProphet による成長予測

FacebookのProphetをベースに改善されたNeuralProphetで、過去セッションの品質スコア時系列を学習し14日間の予測を生成。週次の周期性（週末練習が多い等）を自動的に捉える。

```python
model = NeuralProphet(
    n_forecasts=FORECAST_DAYS,
    seasonality_mode='multiplicative',
    weekly_seasonality=True,
)
model.fit(df_scores, freq='D')
forecast = model.predict(df_future)
```

---

## UI構成（4タブ）

### Tab 1: ダッシュボード
- 総セッション数・総練習時間・直近スコア・改善率の KPIカード
- セッション別品質スコアの折れ線グラフ（Plotly）

### Tab 2: セッション分析
- ポーズ分布ヒストグラム（短/長分類別）
- タイムライン上の異常箇所ハイライト
- セグメント別テキスト + ポーズ時間の詳細テーブル

### Tab 3: 躓き詳細
- 品詞別（名詞/動詞/形容詞…）躓き率の棒グラフ
- 頻繁に躓く単語 Top20 ランキング
- 「この単語は複数セッションで繰り返し躓いている」アラート

### Tab 4: 成長予測
- 過去スコア + 14日間予測の結合グラフ（信頼区間付き）
- 「このペースで続けると X日後にスコア Y に到達」テキスト予測
- 週次改善率の棒グラフ

---

## 技術選定の理由

| 技術 | 選定理由 |
|------|----------|
| **Whisper small** | GPU不要でローカル動作・日本語精度が十分高い |
| **Isolation Forest** | ラベルなしで異常検知できる。読み手ごとにモデルを適応させる必要がない |
| **NeuralProphet** | Prophetより精度が高く、短期予測に強い。PyTorchベースで拡張しやすい |
| **spaCy / Stanza** | 日本語形態素解析の精度。品詞タグの一貫性 |
| **SQLite** | サーバーレス・ファイル1本・セッション管理に十分な性能 |
| **Streamlit** | Pythonだけでインタラクティブな分析UIを高速構築できる |

---

## 効果

| 作業 | 従来の工数 | ツール導入後 | 削減率 |
|------|-----------|------------|-------|
| 1回分の音読分析 | 30〜60分（手動メモ） | 2〜3分（自動） | 95% |
| 躓きパターンの把握 | 数セッション後に主観で気づく | 初回から定量把握 | 質的改善（比率換算困難） |
| 成長の可視化 | スプレッドシート手入力 | 自動グラフ生成 | 90% |
