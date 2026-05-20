# CODEX 評価依頼書 — PMP 学習アプリ（2026-05-20）

## レビュー対象

**プロジェクト**: PMP 学習アプリ（NaNi Execution Lab 内の独立ブロック）
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**対象コミット**: `0bf961c`（HEAD・6回目監査完了時点）
**公開URL（TOP）**: https://yyy19901103-source.github.io/nani-execution-lab/ai-tools/pmp-study/

---

## 📋 アプリの位置づけ

**PMI 非公認の補助学習ツール**。公式教材（Rita Mulcahy 本・PMBOK 第7版・PMI ECO 公式PDF）との併用を前提とする補助ツール。本アプリ単体で合格保証は**しません**。

### このアプリの強み
- 完全ブラウザ完結（IndexedDB 保存・サーバー送信ゼロ・無料）
- SRS（間隔反復）・個別カリキュラム engine・横断検索
- 35章本文・103問プール・10ケーススタディ・315用語（公式195+既存120）
- 透明な追跡: ユーザー提供の PMI 公式 PDF 群（28本・約400MB）に対する処理状況を `/coverage` ページで完全可視化

### 既知の限界（自己申告）
- 章本文・問題プールは AI 生成（PMI 公式テキストではない）
- 28 PDF のうち完全処理 3本・部分処理 10本・繰越 13本・OCR 必要 2本

---

## 🔍 評価対象の構造

```
src/data/pmp/                           # PMP 学習データ
├── eco-structure.json                  # 旧 2021版 ECO 構造
├── eco-official.json                   # 旧 2021版 ECO 完全（35タスク・142イネーブラ）
├── eco-version-mapping.json            # ⚠️ 旧 vs 新 ECO マッピング（6回目監査の核心）
├── chapters.json                       # 35章メタデータ
├── chapter-content.json                # 35章本文 Markdown
├── questions.json                      # 103問プール
├── glossary.json                       # 既存 120語
├── glossary-official-additions.json    # 公式 PDF 由来 195語
├── mindset.json                        # PMP Mindset 8原則
├── pmbok7-principles.json              # PMBOK 7 公式 12原則
├── pmbok7-domains.json                 # PMBOK 7 公式 8パフォーマンスドメイン
├── case-studies.json                   # 11ケース（CS11 は PMI Shawpe 公式）
├── lesson-mapping.json                 # 12 レッスン構成
├── blueprint.json                      # ATP 6 レッスン Blueprint
├── audit-report.json                   # 監査記録（6回・25 発見項目）
├── coverage-tracker.json               # 全 28 PDF 処理状況
└── types.ts                            # TypeScript 型定義

src/components/pmp/                     # React コンポーネント
├── Dashboard.tsx
├── Quiz.tsx
├── Exam.tsx
├── ChapterDetail.tsx
├── Log.tsx
├── Settings.tsx
├── Bookmarks.tsx
├── Search.tsx
├── NoteBookmark.tsx
├── Breadcrumb.tsx
├── Toast.tsx
├── db.ts                               # Dexie (IndexedDB) ラッパー
├── store.ts                            # Zustand
└── curriculum.ts                       # 個別カリキュラム engine

src/pages/ai-tools/pmp-study/           # Astro ページ群（13ページ）
├── index.astro                         # ダッシュボード
├── quiz.astro
├── exam.astro
├── study.astro / study/[chapter].astro
├── glossary.astro
├── mindset.astro
├── cases.astro
├── log.astro
├── settings.astro
├── search.astro
├── bookmarks.astro
├── coverage.astro                      # ⚠️ 透明追跡UI
├── eco.astro                           # 公式 ECO 表示
├── audit.astro                         # 監査レポート表示
└── exam-changes.astro                  # 🚨 試験仕様変更警告
```

---

## 🎯 評価重点ポイント

### 1. 【最優先】試験仕様変更への対応の妥当性

#### 発見事項（F023・6回目監査）

| 項目 | 旧 (2021) | 新 (2025/2026) |
|------|-----------|----------------|
| 試験時間 | 230分 | **240分** |
| 問題数 | 180問 | 180問 + **10プレテスト** |
| 配分: 人 | 42% | **33%** |
| 配分: プロセス | 50% | **41%** |
| 配分: ビジネス環境 | **8%** | **🚨 26%** |
| タスク総数 | 35 (14+17+4) | **24 (8+8+8)** |

出典: `PMP_-_Lesson_12_-_Next_Steps-en_us-ja_jp-PE-C_.pdf` (© 2025 PMI) + `PMI_PMP_Exam_Prep_Questions_-_all_domains_en-us-ja_JP.pdf` (©2026 PMI)

#### 現状の対応

- ✅ `eco-version-mapping.json` で旧 vs 新を完全比較記録
- ✅ `/exam-changes` 警告ページを新規作成・ダッシュボードに highlight 表示
- ❌ 問題プール（103問）は旧版配分（42/50/8）のまま
- ❌ 模試（`Exam.tsx`）は旧版配分でドメイン別問題抽出

#### 🔍 CODEX 確認依頼

1. **問題プールの再タグ付け方針**: 既存の103問を新ECO 24タスク（8+8+8）に再マッピングすべきか、それとも旧版用と新版用の2モード切替を実装すべきか
2. **Business Environment 比率 18%pt 増（8%→26%）への対応**: 新規問題追加が必要だが、優先度・追加すべきタスクを評価してほしい
3. **新質問形式（複数選択・マッチング・ホットスポット・プルダウン）への対応**: 現状は単一選択のみ。実装優先度の判断
4. **`exam-changes.astro` の警告メッセージ**: ユーザーが誤解しないか、表現の改善余地

---

### 2. 監査透明性の仕組み

#### 監査履歴（6回）

| 回 | 出典 | 発見 |
|----|------|------|
| 1回目 | Web 検索 | PMBOK 7 12原則の欠落 (CRITICAL) |
| 2回目 | Web 検索 | 8パフォーマンスドメイン欠落 + Risk Escalate 戦略欠落 (CRITICAL ×2) |
| 3回目 | 公式 PDF 直接照合 | イネーブラ 142件全欠落 + 「アジャイル優先」誤誘導 (CRITICAL ×2) |
| 4回目 | 公式 PDF 直接照合 | カバレッジ追跡導入 |
| 5回目 | 公式 Glossary 全70p | 195 公式用語追加 |
| 6回目 | 公式問題集 + Lesson 04/06/08/11/12 | **試験仕様の根本変更**判明 (CRITICAL) |

累積発見: **25件**（重大9・軽微5・整合7・情報4）

#### 🔍 CODEX 確認依頼

5. **`audit-report.json` の構造**: 各 finding に `severity` / `status` / `myContent` / `publicSources` / `verdict` / `action` を持つ。追跡可能性は十分か
6. **`/audit` ページの表示**: 25件の発見を一覧表示。ユーザーが過去の誤りを認識できる構造になっているか
7. **「全資料網羅保証は不可能」と明示しつつ透明追跡で代替する設計判断**: 誇張せず正直な姿勢は適切か、それとも合格ツールとしての訴求が弱すぎるか

---

### 3. 機密保護・著作権

#### 設計

- 全章本文・問題・ケースは AI 生成オリジナル（PMI 公式テキストの逐語転記なし）
- PMI 公式 PDF からの抽出は**要約・構造記録**のみ（章タイトル・タスク名・イネーブラ等、事実情報の範囲）
- 用語集 195語は公式 Glossary から直接抽出（公式の表現を一部含む）→ A グレード明示
- ユーザーデータ（解答履歴・ノート・ブックマーク）は IndexedDB ローカル保存・サーバー送信ゼロ

#### 🔍 CODEX 確認依頼

8. **公式用語集 195語の転記範囲**: 「定義は公式の表現を一部含む」ことが PMI 著作権上問題ないか（Fair Use の範囲か）
9. **`/exam-changes` ページの情報量**: 試験仕様（時間・配分・タスク番号）を完全公開している。PMI の機密事項に該当しないか
10. **PMI 商標明示**: 「PMP / PMI / PMBOK は PMI の登録商標」の表記が全ページに必要か、現状は TOP と一部ページのみ

---

### 4. UX / アクセシビリティ

#### 実装

- モバイル対応 CSS（`pmp-mobile.css`・640px 以下でグリッド1列・テーブル横スクロール）
- キーボードショートカット（Quiz: 1-4 で選択 / Enter で解答 / N で次 / ChapterDetail: 左右で前後章）
- トースト通知（`Toast.tsx`・alert を置換）
- 章本文中の用語自動リンク（`ChapterDetail.tsx` の `linkifyTerms`）
- 個人ノート機能（`NoteBookmark.tsx`・章/問題/ケース/用語に保存）
- 横断検索（`Search.tsx`・章本文+問題+用語+ケースを AND 検索）

#### 🔍 CODEX 確認依頼

11. **モバイル動作確認**: 実機で `/study/[chapter]` の本文・用語自動リンクが正常動作するか
12. **キーボードショートカット衝突**: 1-4 でラジオ選択した後、`Enter` で解答提出する流れに UX 上の問題はないか
13. **`linkifyTerms` の正規表現**: 用語が HTML タグ内のテキスト（`title` 属性等）にもマッチしてしまう可能性
14. **個人ノートの永続化**: IndexedDB v2 のスキーマ移行で既ユーザーのデータが消失しないか

---

### 5. データ整合性 / TypeScript 型安全性

#### 現状

- `types.ts` で `DomainId` / `Difficulty` / `Question` / `Chapter` / `StudyLog` / `ExamLog` 等を定義
- 各 JSON ファイルは型を意識して構造化
- TypeScript strict モードは未確認

#### 🔍 CODEX 確認依頼

15. **`Question` 型の `domain` フィールド**: 旧版 `DomainId = 'People' | 'Process' | 'Business Environment'` のまま。新版24タスク対応で型拡張が必要か
16. **JSON データのバリデーション**: ビルド時に JSON Schema 等で構造検証していない。runtime エラーの可能性
17. **`Quiz.tsx` の `DeepDive` コンポーネント**: 関連用語の自動抽出ロジックは O(n*m) で 315 用語 × 解説テキスト走査。パフォーマンス影響
18. **`db.ts` の `version(2)` マイグレーション**: notes / bookmarks ストア追加時の既存データ保護

---

### 6. ビルド・パフォーマンス

#### 現状

- Astro v6 + React + Tailwind v4
- 137 ページ生成・ビルド時間約 6秒
- React コンポーネントは `client:only="react"` でロード
- Chart.js は Log.tsx で CDN 動的読込（既存ツール群と統一）

#### 🔍 CODEX 確認依頼

19. **章詳細ページ 35 ファイル**: `getStaticPaths()` で 35 ページ静的生成。JSON データ全体（合計約 350KB）が全章ページに含まれていないか
20. **`glossary.astro` のレンダリング**: 315 語を一気に DOM 生成。検索フィルタは JS で表示/非表示切替。初期ロード時間
21. **`exam-changes.astro` の組込みデータ**: `eco-version-mapping.json`（約20KB）をそのままインライン。SSR or 動的 fetch すべきか

---

## 📊 累積監査発見項目（25件）

詳細は `src/data/pmp/audit-report.json` 参照。

### CRITICAL（9件）
- F002: PMBOK 7 12原則欠落 → 修正済
- F005: PMBOK 7 8パフォーマンスドメイン欠落 → 修正済
- F006: リスク Escalate 戦略欠落 → 修正済
- F009: イネーブラ 142件全欠落 → 修正済
- F010: 「アジャイル優先」誤誘導 → 修正済
- F014: 公式用語集との重大乖離（120語 vs 公式500+語） → 部分修正
- F020: 新 ECO 番号体系の発見 → eco-version-mapping に記録
- F023: 🚨 試験仕様の大幅変更 → 警告ページ追加
- F024: 新 ECO 24タスク体系完全判明 → 完全反映

### MINOR（5件）, VERIFIED（7件）, INFO（4件）
（`audit-report.json` 参照）

---

## 🛠 想定される改善優先度（自己評価）

| 優先度 | 項目 | 工数感 |
|--------|------|--------|
| 🔴 P0 | 問題プールに新 ECO タスク番号タグ追加（旧版を維持しつつ） | 中 |
| 🔴 P0 | Business Environment 問題追加（8%→26% 対応） | 大 |
| 🟡 P1 | `eco-official-2026.json` 新規作成（新24タスク完全イネーブラ） | 中 |
| 🟡 P1 | 模試 UI に「旧版モード / 新版モード」切替追加 | 中 |
| 🟢 P2 | 新質問形式（複数選択・マッチング等）対応 | 大 |
| 🟢 P2 | jp_v3.1 大容量 PDF（約100MB）処理 | 大 |
| 🟢 P2 | 180問模試 PDF の OCR 処理 | 中（外部ツール要） |
| 🟢 P2 | 各 Lesson PDF の本文詳細抽出（Lesson 02: 104p, Lesson 08: 106p 等） | 大 |

---

## 🎯 CODEX への明確な質問（要回答）

1. **学習ツールとしての完成度評価（1-10点）**: 現状の構成で PMP 学習者にとって有用か
2. **新試験仕様への対応緊急度**: 8% → 26% のビジネス環境配分変化に対する本アプリの現状の不適合度
3. **誇張なしの正直な訴求**: 「PMI 非公認・公式教材併用必須」と明示する設計が市場戦略として正しいか、それとも合格訴求を強めるべきか
4. **次イテレーション最優先 3項目**: 上記改善優先度から TOP 3 を指定してほしい
5. **致命的バグ・データ不整合の検出**: 全 JSON ファイル間の参照整合性（章ID・タスクID・用語ID）
6. **PMI 商標・著作権リスクの最終判定**: 195 用語の公式由来定義使用が問題ないか

---

## 📝 レビュー回答フォーマット（推奨）

```markdown
# CODEX PMP 学習アプリ評価結果

## 総合評価
点数: X/10
コメント: ...

## 質問別回答
Q1. 学習ツールとしての完成度 → ...
Q2. 新試験仕様への対応緊急度 → ...
Q3. 正直な訴求の市場戦略 → ...
Q4. 次イテレーション最優先 3項目 → ...
Q5. 致命的バグ・データ不整合 → ...
Q6. PMI 商標・著作権リスク → ...

## 確認重点別所見
1-21 のそれぞれに対するコメント

## 緊急対応すべき項目
- ...

## 中長期改善項目
- ...
```

---

## 📌 補足情報

- **過去の CODEX レビュー**: 本リポジトリで PMP 学習アプリは初回レビュー（既存の `CODEX_REVIEW_REQUEST.md` は spec-risk-extractor 用）
- **PMI 公式 PDF**: `C:\Users\81804\Downloads\` に 28 PDF・約 400MB（CODEX 環境では参照不可・本依頼書の情報を元に評価）
- **本アプリ運用前提**: 個人学習補助ツール・GitHub Pages 公開・データ収集なし
- **検証メタ情報**: 各 audit finding に `sourceGrade` (A: 公式PDF直接 / B: Web資料 / C: 一次資料無し)

---

**レビュー依頼者**: Claude (Anthropic) — オーナー代理
**作成日**: 2026-05-20
**HEAD**: `0bf961c`
**ビルド状態**: ✅ 137 pages / エラー0 / 5.96s
