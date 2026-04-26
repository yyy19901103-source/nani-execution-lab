# CODEX レビュー依頼書

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**公開URL**: https://yyy19901103-source.github.io/nani-execution-lab/
**最新コミット**: `bc8d63c` （ETO新ツール3本+事例追加）

## レビュー範囲（優先度順）

### 🔴 最優先: ETO（一品一様・受注設計生産）向け新ツール3本

実務での使用に耐える品質か、アルゴリズム・UX・ETO業務知識の正確性を厳しく見てほしい。

| ファイル | URL | アルゴリズム |
|---------|-----|-------------|
| `src/pages/ai-tools/eto-similar-quote.astro` | `/ai-tools/eto-similar-quote/` | コサイン類似度 + k-NN |
| `src/pages/ai-tools/project-monte-carlo.astro` | `/ai-tools/project-monte-carlo/` | PERT 3点見積り + モンテカルロ 10000回 + CPM |
| `src/pages/ai-tools/eto-job-shop.astro` | `/ai-tools/eto-job-shop/` | ディスパッチングルール（EDD/SPT/CR）+ 時刻同期 |

### 🟡 高優先: 既存6ツール（量産向け・実用化済み）

| ファイル | アルゴリズム |
|---------|-------------|
| `src/pages/ai-tools/production-schedule.astro` | GA + NEH + 3手法比較 |
| `src/pages/ai-tools/bottleneck.astro` | Little's Law + Monte Carlo |
| `src/pages/ai-tools/demand-forecast.astro` | Holt-Winters + AR(2) + 季節MA + アンサンブル |
| `src/pages/ai-tools/anomaly-detection.astro` | TF.js Autoencoder + Isolation Forest |
| `src/pages/ai-tools/quality-prediction.astro` | TF.js Dense NN + 信頼区間 + バッチCSV |
| `src/pages/ai-tools/spc-chart.astro` | X-bar/R + X-MR + Western Electric Rules |

### 🟢 中優先: 事例コンテンツ

- `src/content/cases/eto-ai-utilization.md`（ETO実務適用記録・最新追加）
- `src/content/cases/local-llm-document-automation.md`（ローカルLLM活用）
- `src/content/cases/nani-execution-lab-build.md`（サイト構築事例）

---

## ⚠️ 機密保護に関する絶対要件（最重要）

**特定企業名・製品名・社内固有名詞が記事中に出ていないか厳格にチェック**してほしい。

### 確認項目（NG リスト）
- 特定企業名（実在する産業機械メーカー名・プラントメーカー名等）
- 任意の3〜4文字略号で社名や製品名を想起させるもの
- 個人名（Author含む）
- 特定の顧客名・案件番号
- 内部システム名・社内ツール名

### OK な汎用表現
- 業界カテゴリ（産業機械・プラント設備・特装車両 等）
- アルゴリズム名（GA, NEH, Holt-Winters, Isolation Forest 等）
- 一般的な業界用語（ETO, Job Shop, CCPM, TOC, MAPE 等）

**NG が1つでも見つかれば即座に指摘してほしい。**

---

## レビュー観点

### 1. アルゴリズムの正確性

#### eto-similar-quote.astro
- [ ] Z-score 正規化が数値特徴量に正しく適用されているか
- [ ] One-hot エンコーディングがカテゴリ変数に対して正しいか
- [ ] コサイン類似度の計算式が正しいか（分子=内積, 分母=ノルム積）
- [ ] k-NN の k 値（3 or 5）の妥当性
- [ ] 類似度加重平均で予測値を出す重み付けロジックが正しいか
- [ ] 標準偏差からの信頼区間算出が統計的に妥当か

#### project-monte-carlo.astro
- [ ] PERT の3点見積り（a, m, b）からのサンプリングが適切か（三角分布 or ベータ分布）
- [ ] DAG のトポロジカルソートが正しく動くか（循環検出含む）
- [ ] CPM の Forward/Backward Pass が正しいか
- [ ] 10000回シミュレーションで完了日分布を構築しているか
- [ ] P50/P80/P95 の percentile 計算が正しいか
- [ ] クリティカル度（各タスクが何%でクリティカルパス上にあったか）の集計ロジック

#### eto-job-shop.astro
- [ ] EDD（Earliest Due Date）の優先度計算が正しいか
- [ ] SPT（Shortest Processing Time）が現工程の処理時間を見ているか
- [ ] CR（Critical Ratio = (納期-現在時刻) / 残処理時間）が正しいか
- [ ] 時刻同期: 工程開始時刻 = max(前工程完了時刻, 機械空き時刻) のロジック
- [ ] 機械リソース管理（複数台ある機械の並列処理）

### 2. 実用性 — 生産技術エンジニアが本当に使えるか

- [ ] サンプルデータが「現場感」あるか（部品名・工程名の現実性）
- [ ] 業界プリセット（自動車部品/電子機器/食品/産業機械/プラント/特装車両）が業界の特徴を反映しているか
- [ ] 入力フォームが直感的か（数値レンジ・単位明記）
- [ ] 結果表示が「現場で次に何をすべきか」に繋がっているか（NEXT ACTIONS の具体性）
- [ ] CSVテンプレートDLが実用的なヘッダ+10行のリアルなサンプルになっているか
- [ ] エラー時のメッセージが分かりやすいか

### 3. UX/UI

- [ ] レイアウトの一貫性（既存6ツールと新3ツールでデザインが揃っているか）
- [ ] レスポンシブ対応（モバイルで使えるか）
- [ ] アクセシビリティ（キーボード操作・読み上げ）
- [ ] ローディング表示（モンテカルロ10000回・GA計算等）
- [ ] Chart.js の可視化が読みやすいか

### 4. パフォーマンス

- [ ] ブラウザでの計算速度（モンテカルロ10000回が秒単位で完了するか）
- [ ] 大量CSV（5000+行）でフリーズしないか
- [ ] TF.js の遅延ロードが効いているか（Autoencoder/Dense NN）
- [ ] LRU キャッシュ・メモ化が機能しているか

### 5. 機密性・セキュリティ

- [ ] 「全処理ブラウザ完結・データ社外送信ゼロ」が実装で保証されているか
- [ ] LocalStorage を不必要に使っていないか
- [ ] 外部APIコール（fetch等）が無いか
- [ ] CDN ライブラリ（Chart.js, TF.js）の読込のみに限定されているか

### 6. ETO業務知識の正確性

- [ ] 類似度ベース見積りの考え方が正しいか
- [ ] CCPM（クリティカルチェイン・プロジェクトマネジメント）の説明
- [ ] TOC（制約条件理論）の適用
- [ ] PERT/CPM の理論的基礎
- [ ] Job Shop ディスパッチングルールの一般的解釈

### 7. コード品質

- [ ] 重複コード・不要なコードがないか
- [ ] 関数の責務分離
- [ ] エラーハンドリング（try-catch）
- [ ] 既存ツールと共通化できる部分があるか
- [ ] detach-reattach パターン使用禁止（getElementById null 衝突）→ DocumentFragment 使用済みか
- [ ] コメントの質と量

### 8. 事例（Markdown）の質

- [ ] 説得力ある具体性（数値・期待効果）
- [ ] 個人情報・企業名なし
- [ ] 業界知識として正確か
- [ ] 想定読者（生産技術エンジニア）に刺さる内容か

---

## 期待するレビュー出力

以下の形式で1ファイル（または1観点）ごとに分けて報告してほしい：

```markdown
## [対象ファイル/観点]

### 🔴 Critical（即修正）
- [問題点と対応案]

### 🟡 Major（早期修正推奨）
- [問題点と対応案]

### 🟢 Minor（任意改善）
- [問題点と対応案]

### 💡 Suggestion（拡張提案）
- [改善アイデア]

### ✅ Good Points（評価点）
- [良い実装箇所]
```

特に **🔴 Critical** は機密漏洩・アルゴリズム間違い・実用性に致命的な欠陥がある場合のみ。

---

## 補足情報

- **技術スタック**: Astro v6 + Tailwind v4 + GitHub Pages（完全静的）
- **ビルド**: `npx astro build` で 82 ページ
- **デザイン**: 背景 #0c0c0e、ゴールド #c8a96e、テキスト #edede8
- **デプロイ**: GitHub Actions 自動（push → 1-2分）
- **過去のハマりポイント**:
  - detach-reattach × getElementById null 衝突バグ（修正済み）
  - Astro v6 の破壊的変更（content collections 仕様変更）
  - JS 関数名の Vite 最小化による検証ノイズ

## 履歴ログ抜粋

過去のラウンド改善実績:
- Round 1〜10: パフォーマンス改善（GA最適化・TF.js遅延ロード・LRUキャッシュ・DOM最適化・CSVチャンク・PNG export・性能計測）
- Round 11〜14: 新機能（NEH法・AR(2)・Isolation Forest・バッチCSV予測+信頼区間）
- 実用化フェーズ: USE CASES / 業界プリセット / CSVテンプレートDL / NEXT ACTIONS
- ETO拡張（最新）: 類似案件見積り・モンテカルロ・Job Shopスケジューラ + ETO事例

---

## 追加お願い

レビュー後、**「これを生産技術エンジニアが現場で見たら、本当に使いたくなるか」** という観点での総評を最後に1段落でお願いしたい。

辛口で構わない。「実用レベルに達していない」と判断されれば理由を明確に。
