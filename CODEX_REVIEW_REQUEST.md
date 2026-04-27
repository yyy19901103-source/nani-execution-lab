# CODEX 4巡目レビュー依頼書（2026-04-27）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**対象コミット**: `d1e31f3`（HEAD）
**前回レビュー対象**: `73feddb`（3巡目）

---

## 🔁 3巡目以降の変更サマリ

### Phase 1（コミット `e580ce1`）: 学習データインポート + 列マッピング拡張

| 変更 | 内容 |
|------|------|
| **学習データ取り込み** | 既存のデビクラ判定済みExcelを `IndexedDB.reviews` に一括投入するUIを追加 |
| **デビクラ列マッピング** | 対象→adopt/high・要確認→modify/mid・対象外→reject/low のマッピング確立 |
| **列マッピング5列追加** | `col-category` / `col-project` / `col-rfq` / `col-doc` / `col-impact` |
| **candidateKey による upsert** | `preset+rowNum+spec hash` の論理キーで重複蓄積防止 |
| **起動時 rebuildReviewIndex** | インポート済みデータの索引を起動時に復元 |

### Phase 2（コミット `d1e31f3`）: UI業界用語化（本コミット）

| 変更 | 内容 |
|------|------|
| **「リスク候補」→「懸念候補」** | 全画面・HTML/JS/コメント置換 |
| **「⚠ 重大 / 注意 / 参考」→「対象 / 要確認 / 対象外」** | badge・フィルター・統計カード・Excel出力列値を置換 |
| **「リスク辞書」→「デビクラ辞書」** | アルゴリズム解説・機能仕様・Excel シート名・コメントを置換 |
| **Excel出力列追加** | Project名・引合番号・E&C&LT・ドキュメント番号の4列を「デビクラ一覧」シートに追加 |
| **Excel「デビクラ一覧」シートの列「重大度」→「判定」** | 値も「対象/要確認/対象外」に変更 |
| **USE CASES/NEXT ACTIONS/機能仕様の文言更新** | 業界用語に統一 |

---

## 🔍 重点レビュー依頼項目（4巡目）

### A. Phase 2 UI変更の整合性チェック
1. **用語置換の抜け漏れがないか**
   - HTML・JS・コメントすべてで「リスク候補/リスク辞書/⚠ 重大/注意/参考」が残っていないか
   - `filter-level` select の option value（`high`/`mid`/`low`）は変えずに表示ラベルだけ変えているか
   - badge CSS クラス名（`badge-high` 等）は変えずに中身の文字列だけ変えているか

2. **Excel出力の新4列が正しく出力されるか**
   - `currentRows[r.idx]?.[colProject]` 等のアクセスで `r.idx` が正しく `currentRows` の添字と対応しているか
   - 列マッピングセレクタが未設定の場合（空文字）のフォールバックが空文字になっているか
   - `ws1['!cols']` のカラム幅配列が新18列と一致しているか

3. **デビクラ辞書の `high/mid/low` キー名は変更されていないか**（JavaScript内部処理で `level === 'high'` 等が使われているため、キー名変更は破壊的変更になる）

### B. Phase 1 + 2 の統合整合性
4. **学習インポート時の `decision`・`level` マッピングが正しいか**
   - `'対象'` → `decision:'adopt', level:'high'`
   - `'要確認'` → `decision:'modify', level:'mid'`
   - `'対象外'` → `decision:'reject', level:'low'`

5. **`refreshLearningStats()` が「対象」候補の承認率を正しく計算しているか**
   - `highReviews` は `r.level === 'high'` でフィルタ — Phase 2でレベルキー名を変更していないなら問題なし

### C. Phase 3 への準備状況評価（実装前フィードバック求む）
Phase 3 として以下の実装を計画中。問題点・改善提案があれば指摘を：

```
E&C&LT 影響軸推定:
- デビクラ辞書の各語に impact 属性を追加
  例: { word:'公差', why:'...', impact:['E','C'] }
- 抽出結果に E/C/LT バッジ表示（色分け）
- 結果Excelの「E&C&LT」列を自動推定値で出力
- 学習データの impact 列値を辞書補強の材料にする
```

   - `impact` 属性をデビクラ辞書に追加する場合、既存の `RISK_DICT` 構造にどう追加するのが最善か
   - 複数辞書語がヒットした場合の `impact` 集約ロジック（union? 多数決?）
   - Excel の `E&C&LT` 列にどう出力するか（`['E','C']` → `"E/C"` 等の文字列変換）

### D. 機密保護・コード品質（継続確認）
- Phase 1/2 の変更で会社データの外部送信がゼロのまま保たれているか
- `console.log` で仕様文・プロジェクト名等の実データが出ていないか
- async/await の伝播に漏れがないか（Phase 1 の `learning-upload` ハンドラ）

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

1. **Phase 2 の用語置換に抜け・整合性破壊がないか**
2. **Excel新4列の `currentRows[r.idx]` アクセスに実行時エラーが無いか**
3. **Phase 3 設計の事前フィードバック** — `impact` 属性の追加方針に問題がないか
4. **「演出先行」最終卒業判定** — Phase1/2完了後で「使うほど精度が上がる仕組み」として仕上がっているか

## 機密保護絶対要件（変わらず）

特定企業名・社名想起略号・個人名・案件番号・内部システム名 を**コード/コメント/git log/コミットメッセージ**全域でチェック。1件でも 🔴 Critical で即指摘。

---

## CODEX への手順

```bash
git clone https://github.com/yyy19901103-source/nani-execution-lab.git
cd nani-execution-lab
git log --oneline -5
# d1e31f3 が HEAD であることを確認

cat CODEX_REVIEW_REQUEST.md  # 本依頼書

# 主要レビュー対象
#   src/pages/ai-tools/spec-risk-extractor.astro    （主対象: Phase1/2 全変更）
#   src/pages/ai-tools/eto-similar-quote.astro      （Z-score 修正・回帰確認）
#   src/pages/ai-tools/project-monte-carlo.astro    （回帰確認）
#   src/pages/ai-tools/eto-job-shop.astro           （回帰確認）
```

レビュー後、以下3点の総評をお願いします：

1. **生産技術エンジニアが現場で本当に使いたくなるか（Phase 2で業界用語統一後）**
2. **機密保護の絶対要件は守られているか**
3. **Phase 3（E&C&LT軸推定）を安全に実装するための設計上の注意点**

辛口で結構です。残課題があれば 🔴 / 🟡 で再指摘してください。
