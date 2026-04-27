# CODEX 3巡目レビュー依頼書（2026-04-27）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**対象コミット**: `73feddb`（HEAD）
**前回レビュー対象**: `39258c3`

---

## 🔁 2巡目 CODEX レビューでの指摘 → 対応サマリ

### 🟡 Major（前回4件）→ 全件対応済み

| 前回指摘 | 対応 |
|---------|------|
| **新旧比較の指標表示と実装がずれている**（「承認率」と書いて重なり率を計算） | ラベルを「**重大候補一致率（旧∩新／旧）**」に正しく改名・log メッセージも `match=` に変更 + 新モデル候補数も併記。該当: `runComparison()` |
| **`recomputeResults()` が本番抽出ロジックと一致しない**（辞書部分一致のみ） | `extractCandidates()` を共通関数として切り出し、本抽出と比較再計算で**完全に同じスコアリング**を使うよう統一。BM25・ベクトル類似度・過去レビュー類似度・`suppressed` が比較側でも効く |
| **レビュー保存が追記方式で重複蓄積** | `candidateKey = preset + rowNum + spec hash` を論理キーとして **upsert** 化。同一候補の再レビューは既存IDで上書き。起動時に `rebuildReviewIndex()` で索引再構築 |
| **本抽出・比較再計算・学習反映のロジックが分岐**（説明と実装の再ズレリスク） | `extractCandidates()` 共通化により、3箇所が同じ関数を経由する形に。`opts.checkAbort` `opts.yieldUI` `opts.includeHighlight` でモード切替 |

### 🟢 Minor（前回2件）→ 全件対応済み

| 前回指摘 | 対応 |
|---------|------|
| **`eto-similar-quote` の Z-score 母集団にクエリ自身を含めている** | 母集団を **過去案件のみ** に変更（クエリ除外）。比較軸を案件ごとに動かさない |
| **不採用類似度の負方向ペナルティが実効していない** | `pastRejectSim ≥ 0.6` かつ `> pastAdoptSim + 0.1` のとき：(a) 重大度を1段下げ (b) `pastPenalty` を総合スコアから直接減算 |
| **`reviewModified` が新規抽出時にクリアされない** | `runExtraction()` 開始時にクリア（idx 衝突防止） |
| **ESC中断後の UI フィードバックが弱い** | 処理時間表示に `(中断)` を併記、log にも `中断` を出力 |

---

## 🔍 重点再確認お願い項目

### A. アルゴリズム正確性
1. **`extractCandidates()` 共通化が本当に効いているか**
   - `runExtraction()` と `recomputeResults()` が同じ関数を経由しているか
   - `opts.pastReviews` を渡すことで旧/新比較で同じレビュー集合を使っているか
2. **upsert ロジック**
   - `candidateKey()` の論理キーで重複が防げているか
   - 同一候補の連続選択（adopt → modify → reject）で1行に収束するか
3. **過去不採用ペナルティ**
   - `pastPenalty` が信頼度に実際に反映されるか
   - 重大度ダウングレードが意図通り動くか

### B. データ永続化（upsert）
- `lastReviewIdByCandidate` の整合性（起動時 rebuild で前回データから正しく復元できるか）
- 同じ candidateKey が異なる preset 間で衝突しないか

### C. 機密保護
- 修正後のコードでも会社データの外部送信がゼロか
- candidateKey ハッシュに spec 文字列を使っているが、ハッシュ後の文字列だけをログに出していて生文は console に出ていないか

### D. 実用性
- 「演出先行」評価を完全卒業したか
- レビュー upsert で現場運用が現実的になったか
- 新旧比較指標が運用判断に使えるレベルか

### E. UX/UI
- ESC中断後の '(中断)' 併記で処理停止が分かるか
- スコアバッジ5本＋修正テキスト欄の組み合わせが整理されているか

### F. コード品質
- `extractCandidates()` が適切に関数分離されているか（同じロジックの分岐残っていないか）
- async / await の伝播漏れが無いか

---

## 期待するレビュー出力

```markdown
## [対象ファイル/観点]
### 🔴 Critical
### 🟡 Major
### 🟢 Minor
### 💡 Suggestion
### ✅ Good Points
```

特に：

1. **2巡目 Major 4件 + Minor 2件 が本当に修正されているか**
2. **修正で新規発生した不具合がないか**（共通関数化に伴う副作用・upsert の race・async 伝播）
3. **「演出先行」の最終卒業判定** — 前回 CODEX 評価「前進したが未完成」「完全には卒業していない」を今回どう判定するか

## 機密保護絶対要件（変わらず）

特定企業名・社名想起略号・個人名・案件番号・内部システム名 を**コード/コメント/git log/コミットメッセージ**全域でチェック。1件でも 🔴 Critical で即指摘。

---

## CODEX への手順

```bash
git clone https://github.com/yyy19901103-source/nani-execution-lab.git
cd nani-execution-lab
git log --oneline -5
# 73feddb が HEAD であることを確認

cat CODEX_REVIEW_REQUEST.md  # 本依頼書

# 主要レビュー対象
#   src/pages/ai-tools/spec-risk-extractor.astro    （主・extractCandidates / upsert）
#   src/pages/ai-tools/project-monte-carlo.astro    （前回Critical/Major修正済み・回帰確認）
#   src/pages/ai-tools/eto-job-shop.astro           （未定義機械検証・回帰確認）
#   src/pages/ai-tools/eto-similar-quote.astro      （Z-score 母集団修正）
```

レビュー後、特に**3点総評の最終判定**をお願いします：

1. **生産技術エンジニアが現場で本当に使いたくなるか**
2. **機密保護の絶対要件は守られているか**
3. **使うほど精度が上がる仕組みとして仕上がっているか（演出先行を脱したか）**

辛口で結構です。残課題があれば 🔴 / 🟡 で再指摘してください。
