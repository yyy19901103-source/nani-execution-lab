# CODEX レビュー依頼書（最新版・2026-04-26）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**公開URL**: https://yyy19901103-source.github.io/nani-execution-lab/
**最新コミット**: `main` ブランチ HEAD（仕様書リスク候補抽出ツール追加版）

---

## 🔴 重点レビュー対象 — 仕様書リスク候補抽出ツール（最新追加・最重要）

ファイル: `src/pages/ai-tools/spec-risk-extractor.astro`（約1500行）  
URL: `/ai-tools/spec-risk-extractor/`

ETO（受注設計生産）製造業の仕様書Excelから、見積り工数・納期・品質を狂わせるリスク候補をブラウザ完結で抽出するツール。**仕様書の第1〜第7段階すべてを実装した完成形**。

### 機能スコープ（25ステップ処理フロー）

```
入力 ──→ ① Excel読込 (.xlsx/.xls/サンプル)
      ──→ ② シート選択・列マッピング自動推定
      ──→ ③ 要求仕様文の正規化・分割
解析 ──→ ④ BM25検索 (Top100)
      ──→ ⑤ 文章ベクトル類似度 (bag-of-bigrams + コサイン類似度)
      ──→ ⑥ リスク辞書ヒット検出 (3段階重大度)
      ──→ ⑦ 過去レビューDB類似引き当て
判断 ──→ ⑧ 候補統合・重複除去
      ──→ ⑨ リランキング (5指標重み付き総合)
      ──→ ⑩〜⑬ 重大度・カテゴリ・所掌・優先度・信頼度・推定根拠
学習 ──→ ⑭ 人レビュー (採用/修正/不採用)
      ──→ ⑮〜⑰ IndexedDB保存・新辞書バージョン候補生成
比較 ──→ ⑱〜⑳ 旧/新モデル評価・重大リスクRecall・Top10一致率
判断 ──→ ㉑〜㉓ 人による採用判断・旧モデル復元可能
出力 ──→ ㉔ 別Excel出力 (4シート: リスク候補/処理内容/列対応/リスク辞書)
      ──→ ㉕ 操作ログ (200件保持)
```

### レビュー観点（特に重点）

#### A. アルゴリズム正確性

- [ ] **BM25**: k1=1.5, b=0.75 のパラメータ。IDF計算 `log(1 + (N - df + 0.5) / (df + 0.5))` の数式正当性
- [ ] **日本語bigram**: `tokenize()` 関数で CJK 文字のみを bigram 化、ASCII単語と分離処理。1文字の場合の扱い
- [ ] **bag-of-bigrams + コサイン類似度**: L2正規化のタイミング、疎ベクトルでの計算効率
- [ ] **過去レビュー一致補正**: 類似度 ≥ 0.6 で +12 / -15 の閾値・補正値が妥当か
- [ ] **重大度判定ロジック**: hits.high.length > 0 → 'high' の優先度設計
- [ ] **信頼度算出**: `high*35 + mid*18 + low*8 + (total>=3?15:0)` の重み配分妥当性
- [ ] **学習ロジック**: 採用率 ≥ 80% & 一致回数 ≥ 3 で「強化候補」、≤ 20% で「弱化候補」の閾値

#### B. データ永続化（IndexedDB）

- [ ] `openDB()` の上位層キャッシュ `_dbCache` は同時アクセスで競合しないか
- [ ] `onupgradeneeded` での 4 ObjectStore 定義（reviews/dictVersions/modelMeta/learningQ）
- [ ] レビュー保存時の `change` イベント委譲パターンが正しく動くか
- [ ] エラーハンドリング（`reject` への到達と上位への伝播）

#### C. 機密保護（最重要）

- [ ] **会社データ送信ゼロ**の保証：`fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, `WebSocket` 等が会社データを送らないことを確認
- [ ] `console.log` 経由のクラウドロギングが無いことの確認
- [ ] CDN リソースは SheetJS のみ（CDN ライブラリのロード時にデータが送られないこと）
- [ ] LocalStorage / sessionStorage を使っていないこと（IndexedDBのみ）
- [ ] 第三者JS（解析・トラッキング）の不在
- [ ] Service Worker による意図しないキャッシング・送信が無いこと

#### D. 実用性 — ETO 製造業の現場で本当に使えるか

- [ ] **業界別リスク辞書**：産業機械40語/プラント30語/特装車両30語の妥当性
  - 各語の `why`（判断材料）が実務的に正しい根拠を提示できているか
  - 業界エンジニアが見て「これは確かに見積もり工数を狂わせる」と納得できるか
- [ ] **サンプル仕様書**：3業界×12行が現場感のある記述になっているか
- [ ] **5秒クイックスタート**：プリセット選択→サンプル読込→実行の3ステップで結果が得られるか
- [ ] **レビューUI**：採用/修正/不採用の3択は現場で迷わず使えるか（修正後内容入力欄が無い点をどう評価するか）
- [ ] **新旧比較指標**：重大リスクRecall・Top10一致率が判断に使えるレベルか

#### E. UX/UI

- [ ] レイアウトの一貫性（既存 ETO 3 ツールとデザイン揃ってるか）
- [ ] レスポンシブ対応（モバイルで使えるか）
- [ ] 大容量Excel（5000行超）の警告ダイアログ・ESC中断
- [ ] 機密保護バナー＋検証方法トグル
- [ ] 操作ログ（直近30件表示）の可読性
- [ ] 「機能仕様」セクション（WHAT/HOW/USE/PRIVACY/METRICS/TECH/LIMIT）が一読で全機能を理解できるか

#### F. コード品質

- [ ] 重複コード／不要コードの有無
- [ ] エラーハンドリング（try-catch）の網羅性
- [ ] **detach-reattach パターン使用禁止**（過去事故あり）→ DocumentFragment 使用済み確認
- [ ] グローバル変数汚染（workbook, currentRows 等）の影響範囲
- [ ] `runExtraction` のラップパターン（`_origRunExtraction` 経由）が想定通り動くか

---

## 🟡 高優先 — ETO 関連ツール3本（既存）

| ファイル | URL | アルゴリズム | レビュー観点 |
|---------|-----|-------------|------------|
| `src/pages/ai-tools/eto-similar-quote.astro` | `/ai-tools/eto-similar-quote/` | コサイン類似度+k-NN | 8特徴量設計の妥当性・Z-score正規化・加重平均ロジック |
| `src/pages/ai-tools/project-monte-carlo.astro` | `/ai-tools/project-monte-carlo/` | PERT 3点+1万回モンテカルロ+CPM | DAG トポロジカルソート・三角分布サンプリング・P50/P80/P95算出 |
| `src/pages/ai-tools/eto-job-shop.astro` | `/ai-tools/eto-job-shop/` | EDD/SPT/CR ディスパッチング | 時刻同期ロジック・並列リソース管理 |

---

## 🟢 中優先 — 量産系AIツール6本（既存）

| ファイル | アルゴリズム |
|---------|-------------|
| `production-schedule.astro` | GA + NEH + FIFO比較 |
| `bottleneck.astro` | Little's Law + Monte Carlo |
| `demand-forecast.astro` | Holt-Winters + AR(2) + 季節MA |
| `anomaly-detection.astro` | TF.js Autoencoder + Isolation Forest |
| `quality-prediction.astro` | TF.js Dense NN + 信頼区間 + バッチCSV |
| `spc-chart.astro` | X-bar/R + X-MR + Western Electric |

---

## ⚠️ 機密保護に関する絶対要件（最重要）

**特定企業名・製品名・社内固有名詞が記事中・コード中・コミットメッセージに出ていないか厳格にチェック**。

### NG リスト
- 特定企業名（実在する産業機械メーカー名・プラントメーカー名等）
- 任意の3〜4文字略号で社名や製品名を想起させるもの
- 個人名（Author含む）
- 特定の顧客名・案件番号
- 内部システム名・社内ツール名

### OK な汎用表現
- 業界カテゴリ（産業機械・プラント設備・特装車両 等）
- アルゴリズム名（GA, NEH, BM25, Holt-Winters, Isolation Forest 等）
- 一般的な業界用語（ETO, Job Shop, CCPM, TOC, MAPE, PERT 等）
- サンプル製品名（「プレス機200t」「貯蔵タンク50KL」「消防車ポンプ車」等の汎用品名）

**NG が1つでも見つかれば即座に指摘してほしい。**

---

## 期待するレビュー出力

以下の形式で1ファイル（または1観点）ごとに分けて報告してほしい：

```markdown
## [対象ファイル/観点]

### 🔴 Critical（即修正）
- [問題点と対応案]
  - 根拠: 該当ファイル:行番号 / コードスニペット
  - 影響範囲: 機密漏洩 / アルゴリズム間違い / 実用不可レベルの欠陥
  - 推奨対応: 具体的な修正方針

### 🟡 Major（早期修正推奨）
- [問題点と対応案]

### 🟢 Minor（任意改善）
- [問題点と対応案]

### 💡 Suggestion（拡張提案）
- [改善アイデア]

### ✅ Good Points（評価点）
- [良い実装箇所と理由]
```

特に **🔴 Critical** は機密漏洩・アルゴリズム致命的間違い・実用性に致命的な欠陥がある場合のみ。

---

## 補足情報

### 技術スタック
- Astro v6 (静的SSG) + Tailwind v4 + GitHub Pages（完全静的）
- ビルド: `npx astro build` で 85 ページ
- デザイン: 背景 #0c0c0e、ゴールド #c8a96e、テキスト #edede8

### 過去のハマりポイント（再発防止チェック対象）
1. **detach-reattach × getElementById null 衝突バグ**
   - `parent.removeChild(tbody)` で切り離し中に `getElementById('tbody')` を呼んで null クラッシュした事故
   - 対応: 全ツールで DocumentFragment パターンに統一済み
2. **Astro v6 の破壊的変更**
   - `entry.slug` → `entry.id.replace(/\.md$/, '')`
   - `entry.render()` → `import { render } from 'astro:content'; render(entry)`
3. **配列定義はあるがレンダリング欠落**
   - `etoTools` 配列を index.astro に定義したが画面表示処理を入れ忘れた事故
   - 対応: 各 .astro ファイルで定義配列が確実に `.map()` でレンダリングされているか確認
4. **JS関数名の Vite 最小化検証ノイズ**
   - 関数名 grep でツール検証すると minified 後の名前差で誤検知
   - 対応: HTML ID 文字列での検証に切り替え

---

## 履歴ログ抜粋（最新の改善履歴）

- Round 1〜10: パフォーマンス改善（GA最適化・TF.js遅延ロード・LRUキャッシュ・DOM最適化・CSVチャンク・PNG export・性能計測）
- Round 11〜14: 新機能（NEH法・AR(2)・Isolation Forest・バッチCSV予測+信頼区間）
- 実用化フェーズ: USE CASES / 業界プリセット / CSVテンプレートDL / NEXT ACTIONS / 5秒クイックスタート
- ETO拡張: 類似案件見積り・モンテカルロ・Job Shopスケジューラ + ETO事例
- 20項目改善: 用語集 ETO 13語追加・FAQ・ハイライト・ETOツール相互リンク・blog/news/README更新等
- **仕様書リスク候補抽出ツール追加（最新）**: BM25+リスク辞書+人レビュー学習+IndexedDB+新旧比較+評価指標+操作ログ（第1〜第7段階すべて実装）

---

## 追加お願い

レビュー後、以下3点について最後に1段落ずつ総評をお願いしたい：

1. **「これを生産技術エンジニアが現場で見たら、本当に使いたくなるか」** — 実用性の総評
2. **「機密保護の絶対要件は守られているか」** — 漏洩リスクの総評
3. **「使うほど精度が上がる仕組みとして仕上がっているか」** — 学習ループの総評

辛口で構わない。「実用レベルに達していない」と判断されれば理由を明確に。

---

**この依頼書をそのまま CODEX に投げ込んでください。** 必要に応じて対象ファイルを `cat src/pages/ai-tools/spec-risk-extractor.astro` 等で示すか、リポジトリ URL を提供してください。
