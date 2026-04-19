---
title: "情報基盤（ERP/MES/PLM）"
week: 13
phase: 4
priority: "支援"
slug: "11_it_infra"
---

# テーマ11：情報基盤の理解（ERP / MES / PLM / QMS）

> 学習週：Week 13  
> 優先度：支援（道具より責任分担の設計が重要）

---

## 1. システムの責任分担（ISA-95モデル）

```
Level 4：ERP（企業レベル）
  責任：受注・調達・在庫・財務・原価・人事
  代表製品：SAP, Oracle, 弥生

Level 3：MES（製造実行レベル）
  責任：製造指示・作業実績・品質記録・トレーサビリティ
  代表製品：Wonderware, Siemens Opcenter

Level 2-1：SCADA・PLC（工程制御レベル）
  責任：設備制御・センサーデータ収集

─── 別軸 ───

PLM（製品ライフサイクル管理）
  責任：図面・BOM・設計変更・製品仕様
  代表製品：PTC Windchill, Siemens Teamcenter, Dassault ENOVIA

QMS（品質管理システム）
  責任：品質計画・不適合管理・是正処置・監査・文書管理
  代表製品：ETQ, MasterControl
```

---

## 2. システム間連携の設計原則

```
重要原則：
  ① 各システムが「唯一の真実の源（Single Source of Truth）」を持つ
  ② 同じデータを複数システムが独立して持たない
  ③ 連携は明示的に設計する（自動連携 vs 手動連携）

品番情報の例：
  PLM → 品番マスターを持つ（唯一の正）
  ERP → PLMから品番を取得（参照）
  MES → ERPまたはPLMから品番を取得（参照）
```

### 2.1 主要な連携パターン

| 連携 | 方向 | 内容 |
|------|------|------|
| PLM → ERP | 設計→生産管理 | BOM・品番・仕様 |
| ERP → MES | 計画→実行 | 製造オーダー・日程計画 |
| MES → ERP | 実行→計画 | 実績・在庫・品質データ |
| PLM → MES | 設計→現場 | 作業手順・設備条件 |
| MES → QMS | 実績→品質 | 検査データ・不適合記録 |

---

## 3. 連携方式の使い分け

| 方式 | 使いどころ | リスク |
|------|----------|--------|
| API（リアルタイム連携） | タイムクリティカルな情報 | システム障害の影響が伝播 |
| CSVファイル連携（バッチ） | 日次・定期の情報更新 | タイムラグ・手動ミスのリスク |
| 手動転記 | 量が少ない・変化が少ない | 転記ミス・工数 |
| DB直結 | 高速・大量データ | 密結合による保守困難 |

---

## 4. どのシステムに何を持たせるか

```
間違えやすい責任分担の例：

× MESで設計変更を管理する
  → 設計変更の正はPLMにある。MESへの反映は連携で行う

× ERP に図面PDFを格納する
  → 図面管理はPLMの責任。ERPは品番の財務情報のみ持つ

× Excelで独自に部品表を管理し続ける
  → PLMとの二重管理になり整合性が崩れる
```

---

## 推奨参考資料

| 種別 | タイトル | 用途 |
|------|---------|------|
| 規格 | [ISA-95 / IEC 62264](https://www.isa.org/standards-and-publications/isa-95-standard) | 製造統合システムの国際標準 |
| Web | [PTC: PLM・ERP・MES連携ガイド](https://www.ptc.com/en/blogs/plm/plm-erp-mes) | 連携設計の実務解説 |
| Web | [Siemens: ISA-95フレームワーク層](https://www.siemens.com/en-us/technology/isa-95-framework-layers/) | 図解でわかる層モデル |
| 論文 | [Integration of PLM, MES and ERP（Inria 無料）](https://inria.hal.science/hal-03753122/) | 統合最適化の学術研究 |
