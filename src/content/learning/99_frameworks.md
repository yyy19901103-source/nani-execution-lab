---
title: "フレームワーク大全"
slug: "99_frameworks"
---

# フレームワーク大全

> 製造DX学習における重要フレームワーク・規格・概念の総合リファレンス

---

## 1. 生産システムフレームワーク

### 1.1 トヨタ生産方式（TPS）

```
TPS の2本柱：

① ジャスト・イン・タイム（JIT）
   必要なものを、必要なときに、必要なだけ生産する
   → 過剰生産というムダを排除

② 自働化（Jidoka）
   異常が発生したら自動停止し、人に知らせる
   → 不良品を次工程に流さない
```

**7つのムダ（大野耐一）**
1. 作り過ぎのムダ
2. 手待ちのムダ
3. 運搬のムダ
4. 加工のムダ
5. 在庫のムダ
6. 動作のムダ
7. 不良・手直しのムダ

> **ETO製造への適用注意**：JIT・カンバン等は量産前提のため直接適用不可。「プロセスのリーン化」（業務フローのムダ排除）として適用する。

---

### 1.2 リーン生産方式

TPS を西洋向けに体系化したもの。5原則：
1. **価値（Value）**：顧客が価値と認めるものを定義する
2. **価値の流れ（Value Stream）**：価値の流れを特定しムダを排除
3. **流れ（Flow）**：価値を途切れなく流す
4. **引っ張り（Pull）**：顧客需要に引っ張られて生産
5. **完全（Perfection）**：継続的改善

---

### 1.3 TPM（Total Productive Maintenance）

**中島清一（Nakajima）が体系化（1988）**

```
TPMの8本柱：
1. 個別改善（設備の効率化）
2. 自主保全（オペレーターによる保全）
3. 計画保全（保全部門による計画的保全）
4. 教育訓練
5. 初期管理（新設備・製品の管理）
6. 品質保全
7. 事務効率化
8. 安全・衛生・環境
```

**OEE（Overall Equipment Effectiveness）：設備総合効率**
```
OEE = 可用率 × 性能率 × 品質率

世界クラス目安：OEE ≥ 85%
```

---

## 2. 品質管理フレームワーク

### 2.1 DMAIC（Six Sigma の改善プロセス）

```
D：Define（定義）
   → 問題・目標・範囲を明確にする

M：Measure（測定）
   → 現状のプロセスパフォーマンスを測定する

A：Analyze（分析）
   → 根本原因を特定する（統計解析・RCA）

I：Improve（改善）
   → 根本原因を除去する解決策を実施する

C：Control（管理）
   → 改善された状態を維持する（標準化・管理図）
```

---

## 3. 情報システム標準

### 3.1 ISA-95 / IEC 62264 階層モデル

```
Level 4：ERP（企業経営レベル）
          → 売上・在庫・調達・財務

Level 3：MES（製造実行レベル）
          → 生産計画・指示・実績・品質記録

Level 2：SCADA・DCS（工程監視・制御）
          → センサーデータ・設備状態監視

Level 1：PLC（機械制御）
          → シーケンス制御・フィードバック制御

Level 0：物理的製造プロセス
          → 実際の加工・組立・計測
```

### 3.2 主要ITシステムの責任分担

| システム | 英語 | 主な責任 |
|---------|------|---------|
| ERP | Enterprise Resource Planning | 受注・調達・在庫・財務・原価 |
| MES | Manufacturing Execution System | 製造指示・実績収集・品質記録・トレーサビリティ |
| PLM | Product Lifecycle Management | 図面・BOM・設計変更・製品ライフサイクル |
| QMS | Quality Management System | 品質計画・不適合管理・是正処置・監査 |
| SCADA | Supervisory Control and Data Acquisition | 設備監視・データ収集 |
| CMMS | Computerized Maintenance Management System | 保全計画・履歴・部品管理 |

---

## 4. 変革・組織マネジメント

### 4.1 Kotter の8ステップ変革モデル

```
1. 危機意識を高める
2. 変革推進チームを作る
3. ビジョンと戦略を作る
4. ビジョンを伝える
5. 社員が行動できるよう障害を取り除く
6. 短期的成果を生む
7. 成果を積み重ねさらなる変革を進める
8. 変革を文化に定着させる
```

### 4.2 ADKAR モデル（個人の変革プロセス）

```
A：Awareness（認識）
D：Desire（意欲）
K：Knowledge（知識）
A：Ability（能力）
R：Reinforcement（強化）
```

---

## 5. 業務設計フレームワーク

### 5.1 SIPOC

```
S：Suppliers（インプットの供給者）
I：Inputs（インプット）
P：Process（プロセスのステップ）
O：Outputs（アウトプット）
C：Customers（アウトプットの受取者）
```

### 5.2 BPMN（業務プロセスの図示標準記法）

```
○ ：イベント（開始・終了・中間）
□ ：アクティビティ（作業・タスク）
◇ ：ゲートウェイ（判断・分岐）
→ ：シーケンスフロー（順序）
```

---

## 6. フレームワーク早見表

| フレームワーク | 略称 | 目的 | 対応Week |
|-------------|------|------|---------|
| Toyota Production System | TPS | ムダ排除・JIT | W2-3 |
| Total Productive Maintenance | TPM | 設備総合効率最大化 | W11 |
| Define-Measure-Analyze-Improve-Control | DMAIC | 品質改善プロジェクト | W9 |
| Plan-Do-Check-Act | PDCA | 継続的改善サイクル | 全週 |
| 5S（整理・整頓・清掃・清潔・躾） | 5S | 職場環境標準化 | W12 |
| Business Process Model and Notation | BPMN | 業務フロー可視化記法 | W2-3 |
| Engineering Change Management | ECM | 設計変更の体系的管理 | W4 |
| Failure Mode and Effects Analysis | FMEA | 故障モード影響解析 | W8-9 |
| Statistical Process Control | SPC | 統計的工程管理 | W8-9 |
| Measurement System Analysis | MSA | 測定システム解析 | W9 |
| Overall Equipment Effectiveness | OEE | 設備総合効率指標 | W11 |
| Key Performance Indicator | KPI | 重要業績評価指標 | W15 |
| Key Goal Indicator | KGI | 重要目標達成指標 | W15 |
| Root Cause Analysis | RCA | 根本原因解析 | W9 |
| Digital Twin | DT | 物理+仮想モデルの同期 | W13-14 |
| ADKAR | ADKAR | 変革管理（個人） | W12 |
