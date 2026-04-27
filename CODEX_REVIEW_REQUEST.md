# CODEX 5巡目レビュー依頼書（2026-04-27）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**対象コミット**: `1ce495b`（HEAD）
**前回レビュー対象**: `cc725d6`（4巡目）

---

## 🔁 4巡目レビュー以降の対応サマリ

### 4巡目 Major（4件）→ 全件対応（コミット `18fe484`）

| 4巡目指摘 | 対応 |
|----------|------|
| **学習インポートのupsertキー不整合** | キー形式を `${preset}\|${rowNum}\|${hash}` に統一（通常レビューと同一）。同一Excel再取込で重複しなくなった |
| **`runExtraction()` で `lastReviewIdByCandidate = {}` で索引破棄バグ** | 空にせず `await rebuildReviewIndex()` で再構築するよう変更 |
| **UI文言「リスク」残存4箇所** | コメント・ラベル・メッセージを業界用語に置換完了 |
| **列対応シートに新5列が未反映** | カテゴリー / Project名 / 引合番号 / ドキュメント番号 / E&C&LT 影響軸 を追加 |

### 4巡目 Minor → 対応
- コメント「重大候補」→「対象」候補 統一（HOW ⑲・アルゴリズム解説・コメント・テーブル行）

### Phase 3 実装（コミット `1ce495b`）: E&C&LT 影響軸推定

CODEX 4巡目フィードバック（D節）を反映：

| CODEX指摘 | 設計反映 |
|----------|---------|
| **`impact` は配列で持つべき** | `RISK_DICT` 全100語に `impact: ['E','C','LT']` 配列を付与 |
| **OR集約 + 軸別スコア** | `impactFlags`（OR集約）と `impactScore`（軸別重み和）を別管理 |
| **E影響/C影響/LT影響を別列で○/空** | Excel出力に `E影響/C影響/LT影響` の3列追加（○表示） |
| **画面に小バッジでE/C/LTを出す** | テーブル行に `.impact-e/.impact-c/.impact-lt` バッジ表示 |
| **学習インポート時のimpact正規化** | `parseImpactString()` で "E,C" / "設計・コスト" / "Engineering, Cost" 等を `['E','C']` に統一 |

軸別重み: `high=3, mid=1.5, low=0.5` で `impactScore.E/C/LT` に積算。

---

## 🔍 重点レビュー項目（5巡目）

### A. Phase 3 実装の整合性

1. **`impact` 配列の業務的妥当性**（`RISK_DICT` 全100語）
   - E（設計）/ C（コスト）/ LT（納期）の割当が業務的に妥当か
   - 例: `公差 → ['E','C']` / `短納期 → ['LT','C']` / `PED → ['LT','C','E']` / `4WD → ['E','C']` 等
   - 抜けがありそうな語（impact属性が論理的でない）はないか

2. **OR集約 + 軸別スコアのロジック**
   - 同じ軸が複数の語からヒットしたとき、`impactScore` にスコアが加算される設計でよいか
   - `impactFlags` は単純OR集約だが、軸別の信頼度をUIに反映する設計が必要か

3. **`parseImpactString()` の堅牢性**
   - "E,C" / "E/C" / "E C" / "E、C" / "Engineering, Cost" / "設計・コスト" / "ENG/LT" 等を正しく解釈するか
   - エッジケース（空文字 / 数字混入 / 全角英字 / 不正トークン）の扱い

4. **Excel出力17→23列拡張で `!cols` 配列のずれがないか**
   - 列順: 元行/章/種別/所掌/Proj/引合/E&C&LT入力/E&C&LT推定/E影響/C影響/LT影響/影響軸スコア/Doc/仕様文/判定/信頼度/一致語/根拠/レビュー/修正/コメント/辞書/日時 = 23列
   - `ws1['!cols']` も23要素で対応済みか

### B. 4巡目 Major対応の回帰確認
5. 学習インポートのupsertキー統一が崩れていないか
6. `runExtraction()` の `rebuildReviewIndex()` 呼び出しが正しく機能しているか（async 伝播含む）

### C. 機密保護（継続確認）
7. `console.log` で `impactFlags`/`impactScore` 等が間接的に仕様文を漏らしていないか
8. `parseImpactString()` の正規化結果に PII が混入する可能性はないか

### D. UX
9. E/C/LTバッジの色分け（青/金/緑）が直感的に区別できるか
10. ツールチップ表示（軸別スコア）が情報過多になっていないか
11. バッジが横に並ぶレイアウトでスマホ表示が崩れないか

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
1. **Phase 3 の `impact` 配列割当の業務的妥当性**（100語のサンプリングレビュー）
2. **17→23列拡張の `!cols` ずれ・型エラーがないか**
3. **「演出先行卒業の最終判定」** — Phase 1/2/3 完了後で「使うほど精度が上がる仕組み」として完成しているか

## 機密保護絶対要件（変わらず）

特定企業名・社名想起略号・個人名・案件番号・内部システム名 を**コード/コメント/git log/コミットメッセージ**全域でチェック。1件でも 🔴 Critical で即指摘。

---

## CODEX への手順

```bash
git clone https://github.com/yyy19901103-source/nani-execution-lab.git
cd nani-execution-lab
git log --oneline -5
# 1ce495b が HEAD であることを確認

cat CODEX_REVIEW_REQUEST.md  # 本依頼書

# 主要レビュー対象
#   src/pages/ai-tools/spec-risk-extractor.astro    （Phase 3 全変更 + 4巡目修正）
```

レビュー後、以下3点の総評をお願いします：

1. **Phase 1+2+3 完了で、生産技術エンジニアが現場で本当に使いたくなるか**
2. **E&C&LT 影響軸推定で意思決定支援として実用レベルに達しているか**
3. **「演出先行」を完全卒業したと判定できるか**

辛口で結構です。残課題があれば 🔴 / 🟡 で再指摘してください。
