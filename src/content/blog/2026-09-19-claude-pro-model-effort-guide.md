---
title: "Claude Proで枠を使い切らない設定：モデルとエフォートの選び方【公式データで検証】"
description: "Claude Proで「どのモデル×どのエフォート」が最も枠効率が良いかを、Anthropic公式の実測値で検証。結論は Sonnet 5 / エフォート低。用途別の設定表付き。"
date: "2026-09-19"
author: "NaNi"
tags: ["Claude", "生成AI", "Pro", "モデル選択", "エフォート", "コスト最適化"]
---

## この記事で分かること

Claude Proを週3〜5日、1日3〜8時間ほど使うと、モデル（Opus / Sonnet / Haiku / Fable）とエフォート（思考の深さ）の選択肢が多くて迷う。「結局どれにしておけば枠を無駄にしないのか」を、Anthropic公式の一次情報だけで検証した。

## 結論

**迷ったら「Sonnet 5 / エフォート低」に置きっぱなしでよい。** 難しい作業のときだけ Opus 5 に切り替える。

## 用途別：この時はこの設定

| 場面 | モデル | エフォート | 根拠 |
|---|---|---|---|
| 学習・勉強チャット | Sonnet 5 | 低 | 知識系ベンチで低は既定比 −1〜3pt、コストは33〜50% |
| 調べもの・リサーチ | Sonnet 5 | 低 | DeepResearch Bench II: Sonnet 5 $1.20/件 vs Opus 5既定 $6.71/件（5.6倍） |
| アプリ開発（通常） | Sonnet 5 | 中 | 中は既定の精度をほぼ維持しコスト70〜87%。低だとコーディングで落ちる |
| アプリ開発（難所）設計判断・原因不明バグ・大規模改修 | Opus 5 | 低 | Opus 5低が Sonnet 5高に精度・コストとも勝つ（下記） |
| サイト運営・文章仕事 | Sonnet 5 | 低 | 知識作業。エフォートを上げても測定可能な差が出ない |
| 定型・大量処理（整形・分類・変換） | Sonnet 5 | 低 | Haiku 4.5は半額だがエフォート非対応・文脈200K・退役期限が最短 |
| 枠が残り少ない週末 | Sonnet 5 | 低 | 低は中より1.5〜2.3倍の容量効率 |

### 結果が不満なときの上げ方

```
まず Sonnet 5 / 低 で投げる
  ↓ 結果が不満
エフォートを1段上げる（低→中）  ← モデル変更より先にこれ
  ↓ まだ不満
Opus 5 / 低 に変える           ← ここで初めてモデルを変える
  ↓ まだ不満
Opus 5 / 中
```

避けたいのは「Sonnet 5のエフォートを最大まで上げる」こと。次節のとおり、Sonnet 5の高はOpus 5の低に精度でもコストでも負けるので、上げ切る前にOpus 5の低へ移るほうが得になる。

## 根拠1：エフォートは「低」で十分なことが多い

知識作業（学習・調査・文章）でのエフォート別の公式実測はこうなっている。

> "low gave up 1 to 3 points for a third to a half off the cost per task, medium matched the default's accuracy at about 70% to 87% of its cost, and the default bought nothing measurable over medium on any of the four."

| エフォート | 既定(高)比の精度 | 既定(高)比のコスト |
|---|---|---|
| 低 | −1〜3ポイント | 33〜50% |
| 中 | 同等 | 70〜87% |
| 高（既定） | 基準 | 100% |

低は中に対して**1.5〜2.3倍の容量効率**で、失うのは1〜3ポイントだけ。既定の「高」は、中に対して測定可能な上乗せがなかった。

## 根拠2：「安いモデル＋高エフォート」より「良いモデル＋低エフォート」

SWE-bench Proサブセットでの公式実測（課金額ベース）:

| 設定 | 正解率 | 1問解くごとのコスト |
|---|---|---|
| **Opus 5 / 低** | **84.0%** | **$0.25** |
| Sonnet 5 / 既定(高) | 77.4% | $0.84 |
| Opus 5 / 既定(高) | 91.7% | $1.01 |
| Fable 5.1 / 低 | 88.6% | $0.54 |

Opus 5の「低」は、Sonnet 5の「高」より**精度が6.6ポイント高く、コストは約70%安い**。Anthropic自身も原則として明記している。

> "The cheapest upgrade is the new model at a lower setting."
> （最も安い性能向上は、新しいモデルを低い設定で使うこと）

## 根拠3：Opusを常用できない理由（Proの枠は4つある）

Proの枠は1つのプールではなく、次の4つのバケツに分かれている。

| バケツ | リセット |
|---|---|
| セッション枠（全モデル共通） | 5時間ローリング |
| 週間枠（全モデル共通） | 週1回・アカウント固定時刻 |
| Opus専用上限 | 5時間 |
| Sonnet専用上限 | 5時間 |

Opusは共通プールを消費したうえに、専用の天井がある。1日3〜8時間Opusに常駐すると天井に当たり、強制的にSonnetへ落とされる。だから「普段はSonnet、難所だけOpus」が構造上いちばん安定する。

## よくある誤解

### 「Opus 5は枠を2.5倍速く消費する」→ 公式の根拠なし

ネットでよく見る数字だが、Anthropicはどこにも書いていない。公式の記述は次のような定性的なものだけだ。

> "Opus costs several times more per turn than Sonnet"
> — support.claude.com「models-usage-and-limits-in-claude-code」

2.5倍という数字は**API単価の比**（Opus 5 $5/$25 vs Sonnet 5 $2/$10）であって、サブスク枠の消費比ではない。公式も両者を切り離している。

> "Claude Max and Pro subscribers have usage included in their subscription, so the session cost figure isn't relevant for billing purposes."
> — code.claude.com/docs/en/costs

### 「エフォートを1段上げると消費が7倍」→ 図解の注記を見落としている

よく引用される「7倍」は、Anthropic自身が "Curves are for illustration purposes only... They do not represent real benchmark data" と注記した図が出どころ。実測値ではない。

### 「Sonnet 5は33%安い」→ 実質は15%

価格表では33%安く見えるが、4.7以降はトークナイザが変わり同じ文章で約30%多くトークンを消費する。公式実測での差は "15% less per solved task for 5 more points"。それでもSonnet 5が有利なのは変わらないが、倍率は盛らないほうがよい。

## 選ぶ理由がないモデル

| モデル | 入力/出力 (/Mtok) | 判定 |
|---|---|---|
| Haiku 4.5 | $1 / $5 | 退役期限が最短(10/15以降)・エフォート非対応 |
| **Sonnet 5** | **$2 / $10** | **普段使い** |
| Sonnet 4.6 | $3 / $15 | Sonnet 5より高い |
| Opus 4.6 / 4.7 / 4.8 | $5 / $25 | Opus 5と完全同額で旧世代 |
| Opus 5 | $5 / $25 | 難所用 |
| Fable 5 | $10 / $50 | Fable 5.1と同額でキャッシュ読みが4倍高 |
| Fable 5.1 | $10 / $50 | Proでは枠外の別課金（クレジット必要） |

Opusの旧版（4.6〜4.8）はOpus 5と同じ価格なので、旧版を選ぶ金銭的なメリットはない。「他のモデル」メニューはAPIのバージョン固定用で、日常の選択肢ではない。

## Proのままでいいのか

単位容量あたりの価格は、ProとMax 5xで完全に同額。

| プラン | 月額 | セッション枠 | 単位あたり |
|---|---|---|---|
| Pro | $20 | 1x | $20.00 |
| Max 5x | $100 | 5x | $20.00 |
| Max 20x | $200 | 20x | $10.00 |

つまり判断基準は「安いから」ではなく**Proの枠に収まるか**だけ。

**アップグレードの目安**：設定＞使用状況の週間バーが、リセット日前に70%を超える月が2回続いたらMax 5xへ。その時はモデルもOpus 5 / 低に変えるとよい（Opus専用上限が5倍に緩むため）。

## 枠を節約する設定以外のコツ

- **プロジェクト機能を使う**：プロジェクト内の内容はキャッシュされ、再利用時に枠を消費しない
- **会話を引きずらない**：消費要因に「現在の会話の長さ」が含まれる。話題が変わったら新規会話に
- **Fast mode（/fast）は使わない**：サブスク枠外でクレジット直引き、通常Opusの2倍単価
- **/usageで週間バーを確認する**

## 公式にも分からないこと

- **Proの枠の絶対量は非公開**。トークン数・メッセージ数・時間数のいずれも公式数値がない。この記事の比較はAPI価格を代理指標にしている
- **エフォート段階ごとの消費倍率も非公開**
- **Sonnet 5の「中」の実測値は未公開**。公開されているのは「高」の値だけなので、「低」推奨には知識作業ベンチの相対値からの推論を含む
- Sonnet 5のベンチマーク数値は画像でしか公開されていない
- エフォートのスライダー段階が low / medium / high / xhigh / max に1:1対応するかは公式文書で未確認。手元のスライダーでラベルを確認してほしい
- 日本円価格は未確認（claude.com/pricingはUSDのみ）

## 出典

確認日：2026-09-19（すべてAnthropic公式）

- [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Usage limit best practices](https://support.claude.com/en/articles/9797557-usage-limit-best-practices)
- [Claude Fable models on your plan](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan)
- [Change the model, effort, and thinking settings](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings)
- [What is the Pro plan](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)
- [Errors (Claude Code)](https://code.claude.com/docs/en/errors)
- [Claude pricing](https://claude.com/pricing)
