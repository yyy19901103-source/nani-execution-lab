# CODEX 再レビュー依頼書（修正後・2026-04-27）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**前回レビュー対象コミット**: `bcc5ed2`
**今回再レビュー対象コミット**: `39258c3`（CODEX レビュー対応版）

---

## 🔁 前回 CODEX レビューでの指摘と対応状況

前回レビューで Critical 2件 + Major 6件の指摘を受け、すべて修正しました。以下、対応のサマリと該当コードの位置です。

### 🔴 Critical（修正済み・要再確認）

#### Critical#1: BM25 が実際には使われていない問題

| 項目 | 内容 |
|------|------|
| 前回指摘 | `bm25.fit()` は呼ぶが `bm25.search()` を呼んでおらず、実処理は `text.indexOf()` だけだった |
| 対応 | 辞書語をクエリ化し `bm25.search(dictQuery, docs.length)` で全件スコア取得 → 各仕様文の `bmScore` を最大値正規化 |
| 該当箇所 | `src/pages/ai-tools/spec-risk-extractor.astro` の `runExtraction()` 内 |
| 統合スコア | `0.35 × 辞書 + 0.25 × BM25 + 0.20 × ベクトル類似度 + 0.10 × 過去採用 + 0.10 × 一致語数` |
| 候補化判定 | 辞書ヒットゼロでも BM25 ≥ 0.30 / ベクトル類似度 ≥ 0.15 / 過去採用類似 ≥ 0.5 のいずれかで候補化 |

#### Critical#2: 学習が辞書を実更新しない問題

| 項目 | 内容 |
|------|------|
| 前回指摘 | 学習処理は強化候補/弱化候補を数えるだけ、`extendedDicts` は空のまま、本抽出は `RISK_DICT` 直参照 |
| 対応 | (a) 採用率≥80% の新語を `extendedDicts[preset].high[]` に **実エントリとして追加** / (b) 採用率≤20% の語を `extendedDicts[preset].suppressed[]` に追加 / (c) 本抽出 `runExtraction()` も `getEffectiveDict()` 経由に変更し、suppressed 語を hit から除外 |
| 該当箇所 | `btn-train` クリックハンドラ内 + `runExtraction()` 内の辞書取得 |
| 学習効果の流れ | レビュー保存 → 学習実行 → `extendedDicts` 更新 → 新バージョンとして dbPut → 採用判断 → 次回 `runExtraction()` で反映 |

### 🟡 Major（修正済み・要再確認）

| # | 前回指摘 | 対応 |
|---|---------|------|
| ESC中断 | ESC押下をログするだけで処理停止しない | `extractAborted` フラグ + 200行ごとに `setTimeout(0)` で UI yield + ループ先頭でフラグチェック → 実際に停止 |
| 修正テキスト欄なし | 「修正して採用」しても修正後内容が残らない | `modify` 選択時に `<textarea class="modify-textarea">` を表示。入力内容を `reviews.modifiedSpec` として IndexedDB に保存 |
| Recall定義誤り | 正解集合がないのに「Recall」を名乗る | 名称を「**重大候補の承認率**」に変更 + 説明文に「※統計的Recallではなく承認率」を併記 |
| openDB 競合 | `_dbCache` に入る前の同時呼び出しで複数 open 走る | `_dbPromise` で **Promise 自体をキャッシュ** → 同時呼び出しを1本化 |
| tx.oncomplete 不使用 | request 成功で resolve、tx 完了を待たない | `tx.oncomplete` で resolve / `tx.onabort` `tx.onerror` でreject に変更 |
| project-monte-carlo クリティカル度 | 単一終端起点で並列終端を取りこぼし | 「最大EFを持つ全終端」を起点に逆探索する形に修正 |
| eto-job-shop 未定義機械 | 未定義機械参照で部分スケジュール完了 | `schedule()` 冒頭で未定義機械・ゼロ台数を検証 → throw で実行中止 |
| パーセンタイル | `floor(iterations*q)` で上振れ | 線形補間方式 `sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)` に変更 |

### 💡 Suggestion 採用

| 提案 | 対応 |
|------|------|
| 辞書/BM25/類似度を別スコアで可視化 | 結果テーブル各行に **5つのスコアバッジ**（辞書 / BM25 / 類似度 / 過去採用 / 過去不採用）を表示 |

---

## 🔍 重点再確認お願い項目

### A. アルゴリズム正確性

#### A-1. BM25 の使われ方
- 辞書語結合クエリでの検索結果が、各仕様文の `bmScore` として実際に統合スコアに反映されているか
- BM25 の重みづけ 0.25 が辞書 0.35 と比較して妥当か（辞書が依然主役・BM25 が補助）
- 候補化閾値 BM25 ≥ 0.30 が見逃し防止／ノイズ削減のバランスとして妥当か

#### A-2. 学習ループの実効性
- `btn-train` クリック後、`extendedDicts[preset].high[]` に新語が**実際に追加**されているか
- `suppressedSet` が `runExtraction()` 内の `dict[lvl].forEach` ループで参照され、対象語の hit が**実際にスキップ**されているか
- 採用された後の新語が、次回抽出で BM25 クエリにも入るか（→ 副次的な強化が連鎖するか）

#### A-3. 過去レビュー類似度
- `pastAdoptSim` / `pastRejectSim` が `vectorize` + `cosineSim` で正しく計算されているか
- `pastBonus = pastAdoptSim * 0.5 - pastRejectSim * 0.5` の重みが妥当か
- レビュー DB が空の状態（初回利用時）でもエラーにならないか

### B. データ永続化（IndexedDB）

- `_dbPromise` キャッシュで同時呼び出しが1本化されているか
- `tx.oncomplete` 待ちで書き込み確定が保証されているか
- レビュー保存・学習・新旧比較の各書き込みで race condition が起きないか

### C. 機密保護（前回 Critical なし）

- 修正後のコードでも会社データの外部送信が無いことの再確認
- レビュー UI に追加した textarea の内容が `console.log` 等経由で漏れないか
- 学習辞書バージョン JSON が IndexedDB 内に閉じているか

### D. 実用性

- 「修正して採用」テキスト欄が現場の運用に耐えるか（修正テキストはDBに残る・次回抽出のパターン学習材料）
- 「重大候補の承認率」表示が誤解を招かないか
- ESC 中断後、再度実行ボタンを押すと正しく再開できるか
- `extendedDicts[preset].suppressed` が UI で確認できるか（学習結果の透明性）

### E. UX/UI

- スコアバッジ5本（辞書/BM25/類似度/過去採用/過去不採用）が画面で読みやすいか
- 大容量Excel + ESC中断のフロー全体が現場で使えるレベルか
- `modify` 選択 → textarea 表示 → 入力 → 自動保存 のフィードバックループ

### F. コード品質

- `_origRunExtraction` ラッパー削除後、`runExtraction()` 単体で完結しているか
- 旧コードと新コードの境界に dead code が残っていないか
- 名前変更（重大リスクRecall → 重大候補の承認率）が UI / コメント / Excel出力 / log で一貫しているか

---

## 期待するレビュー出力

前回と同じフォーマットでお願いします：

```markdown
## [対象ファイル/観点]

### 🔴 Critical（即修正）
### 🟡 Major（早期修正推奨）
### 🟢 Minor（任意改善）
### 💡 Suggestion（拡張提案）
### ✅ Good Points（評価点）
```

特に：

1. **前回の Critical 2件が本当に修正されているか** — `bm25.search()` の戻り値が信頼度に反映されているか / `extendedDicts` が学習で実更新され `runExtraction()` で参照されているか
2. **修正で新規発生した不具合がないか** — async化に伴う race condition / await 漏れ / 例外伝播
3. **依然として「演出先行」感が残る箇所** — 説明文と実装の差分

---

## 機密保護に関する絶対要件（前回と同じ）

特定企業名・3〜4文字略号で社名想起させるもの・個人名・案件番号・内部システム名 が**コード/コメント/git log/コミットメッセージ**のどこにも混入していないか厳格にチェック。1件でも見つかれば即 🔴 Critical で指摘。

---

## CODEX への手順

```bash
# 1. ワークスペースに最新版を clone
git clone https://github.com/yyy19901103-source/nani-execution-lab.git
cd nani-execution-lab

# 2. 再レビュー対象コミットに合わせる
git log --oneline -5
# 39258c3 CODEX レビュー対応: Critical 2件 + Major 6件 を修正
# が HEAD であることを確認

# 3. 本依頼書を読む
cat CODEX_REVIEW_REQUEST.md

# 4. 前回指摘の各項目について、上記「該当箇所」を中心に再点検
#    - src/pages/ai-tools/spec-risk-extractor.astro
#    - src/pages/ai-tools/project-monte-carlo.astro
#    - src/pages/ai-tools/eto-job-shop.astro

# 5. 「期待するレビュー出力」フォーマットで報告
#    最後に前回の3点総評（実用性／機密保護／学習ループ）を更新版で再評価
```

---

## 追加お願い

レビュー後、特に**前回の3点総評を再評価**してください：

1. **「これを生産技術エンジニアが現場で見たら、本当に使いたくなるか」**
   - 前回評価: 「触ってみたくなる段階。看板機能と実装の差が大きく現場導入レベルまでもう一段」
   - 今回 Critical 2件修正後の評価は？

2. **「機密保護の絶対要件は守られているか」**
   - 前回評価: 「コード上はかなり良好。会社データ送信なし・NGワードなし・第三者通信は SheetJS CDN のみ」
   - 修正で何か変化したか？

3. **「使うほど精度が上がる仕組みとして仕上がっているか」**
   - 前回評価: 「現状未完成。レビュー保存はできても辞書実更新が無く、修正内容も残らず、学習結果が本抽出に効かない。**演出先行**」
   - 今回の修正で「演出先行」を脱したか？

辛口で構わない。改善が不十分なら 🔴 Critical / 🟡 Major で再指摘してください。
