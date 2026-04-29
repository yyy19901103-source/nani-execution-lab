# CODEX 7巡目レビュー依頼書（2026-04-29）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**対象コミット**: `538ae79`（HEAD）
**前回レビュー対象**: `11755fb`（6巡目）

---

## 🔁 6巡目レビュー以降の実装サマリ

### コミット一覧（新しい順）

| コミット | 内容 |
|---------|------|
| `538ae79` | UI大幅シンプル化 — ウィザード型3ステップUI（中学生が直感で使えるレベルへ） |
| `fe6fd75` | ビルドエラー修正 — `cosineSim` 二重宣言を `embeddingSim` にリネーム |
| `6ed604d` | CODEX 6巡目 P1/P2 対応 5件修正 |

---

## 📋 6巡目指摘への対応状況（`6ed604d`）

6巡目で指摘を受けた以下5件を修正済み。修正の妥当性を確認してください。

### P1-1: モードB ゼロショット到達不能バグ（Critical → 修正済み）

**問題**: `ai-search-section` が `display:none` のまま、BM25抽出ゼロ件時に `visibleRows` が空になり、AI検索セクション自体が表示されなかった。  
**修正内容**: BM25抽出完了後に無条件で `ai-search-section` を `display:block` する処理を追加。

```javascript
// 抽出完了直後に必ず表示
document.getElementById('ai-search-section').style.display = 'block';
```

**確認点**: `visibleRows.length === 0` のケース（仕様書にデビクラ対象なし）でも AI 検索ボタンが表示され、モードBでLlama生成が実行できるか。

---

### P1-2: プリセット横断汚染（Critical → 修正済み）

**問題**: 過去事例のコサイン類似度計算で、プリセットA（例：建設）の過去事例がプリセットB（例：半導体）の検索結果に混入していた。

**修正内容**: `validPast` フィルタに `c.preset === currentPreset` 条件を追加。

```javascript
const validPast = all.filter(c =>
  Array.isArray(c.embedding) && c.embedding.length > 0 && c.preset === currentPreset
);
```

**確認点**: `pastCases` ObjectStore に複数プリセットのレコードが混在しているとき、現在選択中のプリセットのみが候補になるか。

---

### P1-3: モデル置換後の古いメモリ状態残留（Major → 修正済み）

**問題**: 「モデル取込（replace）」後もメモリ上の `activeDictVersion` / `extendedDicts` が旧値を保持し、取込直後の抽出が旧モデルで動いていた。

**修正内容**: `model-import-upload` の replace ハンドラで DB クリア直後にメモリ変数もリセット。

```javascript
await dbClear('reviews'); await dbClear('dictVersions'); await dbClear('modelMeta');
activeDictVersion = null;
extendedDicts = {};
```

**確認点**: replace 後すぐに「学習実行」せず抽出を走らせた場合、デフォルト辞書（メモリ変数がnull）でフォールバックするか。

---

### P2-1: PDF テキスト結合時の単語境界消失（Minor → 修正済み）

**問題**: `content.items.map(it => it.str).join('')` では行末の改行が失われ、日本語以外のワードが結合してしまう可能性があった。

**修正内容**: PDF.js の `hasEOL` プロパティで行末を検出し、改行を挿入。

```javascript
const raw = content.items.map(it => it.str + (it.hasEOL ? '\n' : '')).join('');
```

**確認点**: `hasEOL` は PDF.js 3.x の TextItem に存在するプロパティか。実際に英語混じり仕様書でスペースなし結合が発生しなくなっているか。

---

### P2-2: CDN障害時のエラーメッセージ不明瞭（Minor → 修正済み）

**問題**: Transformers.js / WebLLM の ESモジュールブリッジで、CDN障害時に `window._txPipeline = undefined`（未ロード）と `null`（ロード失敗）が区別できず、「まだ読込中です」という誤誘導メッセージが出ていた。

**修正内容**:
- ESモジュールの `import()` を `try/catch` で囲み、失敗時は `window._txPipeline = null` をセット
- `getEmbedder()` / `getLlamaEngine()` で `=== null` チェックを追加し、エラーメッセージを分岐

```javascript
// ブリッジスクリプト側
try {
  const { pipeline, env } = await import('https://cdn.jsdelivr.net/...');
  window._txPipeline = pipeline;
} catch (e) { window._txPipeline = null; }

// 呼び出し側
if (pipeline === null) throw new Error('Transformers.jsの読込に失敗しました。CDN障害またはCSP設定をご確認ください。');
if (!pipeline)         throw new Error('Transformers.jsをまだ読込中です。少し待ってから再試行してください。');
```

**確認点**: `null` と `undefined` の分岐が正しく機能しているか。WebLLM 側（`window._webllmCreate`）にも同様のパターンが適用されているか。

---

## 🎨 UI刷新の内容（`538ae79`）

### 変更概要

「中学生が直感で操作できるレベル」を目標に、ウィザード型3ステップUIに刷新。

**Before**: USE CASEカード3枚 + 「5秒でわかる使い方」ガイド + フラットなフォーム群  
**After**: STEP1/2/3 のウィザードカード + 上級者向け機能を折りたたみに格納

### 変更詳細

| 変更箇所 | Before | After |
|---------|--------|-------|
| ヒーロー説明文 | "BM25 · デビクラ辞書 · Browser-Local" | "仕様書を読み込むだけで、コスト・納期・設計に関わる注意ポイントを自動で見つけます" |
| USE CASEカード | 3枚カード + 5秒ガイド | シンプルな横3ステップ表示（1業界を選ぶ → 2仕様書を読み込む → 3ボタンを押す） |
| プリセット選択 | フラット配置 | STEP1 ウィザードカード（"どの業界で使いますか？" ＋ 大きめボタン） |
| ファイルアップロード | フラット配置 | STEP2 ウィザードカード（"📄 サンプルで試す" をプライマリボタンに昇格） |
| 実行ボタン | 通常サイズ | STEP3 ウィザードカード（緑背景 ＋ 大きいボタン "🔍 注意ポイントを探す ▶"） |
| テンプレートDL・学習データ取込 | STEP1 直下に配置 | 「⚙️ 上級者向け機能」`<details>` に格納（デフォルト閉じ） |
| マッピングセクション | 列名ドロップダウンのみ | "Excelのどの列が「仕様書の文章」か自動推定" の説明文を追加 |
| メトリクスラベル | 対象 / 要確認 / 対象外 | 🔴 要注意（対象）/ 🟡 要確認 / ⚪ 問題なし（対象外） |

### 重点確認項目

19. **ウィザードカードの視覚的階層**
    - `.wiz-num`（番号バッジ）・`.wiz-title`・`.wiz-desc` が正しいサイズ・余白で表示されるか
    - STEP3 カードの背景色（`#f0fdf4`）が他セクションと明確に区別されるか

20. **上級者向け機能の格納**
    - `<details id="adv-details">` 内の `btn-template`（テンプレートDL）と `learning-upload` が機能するか
    - `<details>` を開いた状態でレイアウト崩れが起きないか

21. **サンプル試用ボタンのプライマリ昇格**
    - `.action-btn-primary`（緑）が "サンプルで試す" に、`.action-btn-secondary`（グレー枠）がExcel/PDFアップロードに正しく対応しているか
    - モバイルで2つのボタンが縦並びになるか

22. **ステップインジケーター**
    - 横3ステップ表示が幅320px以下でも折り返し・崩れなく表示されるか

23. **メトリクスラベルの絵文字**
    - 🔴 🟡 ⚪ が Windows / macOS / iOS / Android 各環境で文字化けなく表示されるか

---

## 🔍 6巡目から継続している未解決懸念事項

以下は6巡目レビューで指摘されたが、今サイクルでは対応しなかった項目。現時点での評価も含めてレビューしてください。

### esm.run CDN リスク（6巡目指摘 #7）

- `@mlc-ai/web-llm` を `esm.run` ミラーから読み込んでいる
- 公式 `cdn.jsdelivr.net/npm/@mlc-ai/web-llm` への切替を推奨されたが未対応
- **現在の影響範囲**: WebLLM（モードB）のみ。モードA（Embedding）は jsdelivr 使用のため影響なし
- 許容すべきか、今すぐ直すべきか評価をお願いします

### Llama ブラウザ内完結の確認（6巡目指摘 #14）

- `@mlc-ai/web-llm` は WebGPU + TVM ランタイムで動く設計
- TVM runtime が起動時 telemetry を送信していないかは未確認
- 機密保護の根幹に関わるため、確認方法または現時点での判断をお願いします

### PDF文リストのUX（6巡目指摘 #18）

- 20ページPDFで300〜500文が一覧表示される問題は未改善
- ページ番号フィルターや文字数フィルターの追加を推奨されたが未着手
- UI刷新のスコープ外として後回しにした。優先度評価をお願いします

---

## 機密保護絶対要件（変わらず）

特定企業名・社名想起略号・個人名・案件番号・内部システム名 を**コード/コメント/git log/コミットメッセージ**全域でチェック。1件でも 🔴 Critical で即指摘。

---

## CODEX への手順

```bash
git clone https://github.com/yyy19901103-source/nani-execution-lab.git
cd nani-execution-lab
git log --oneline -5
# 538ae79 が HEAD であることを確認

cat CODEX_REVIEW_REQUEST.md  # 本依頼書

# 主要レビュー対象
#   src/pages/ai-tools/spec-risk-extractor.astro

# P1/P2 修正の差分確認
git diff 11755fb..6ed604d -- src/pages/ai-tools/spec-risk-extractor.astro

# UI刷新の差分確認
git diff fe6fd75..538ae79 -- src/pages/ai-tools/spec-risk-extractor.astro
```

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

特に重視：
1. **6巡目P1/P2の5件修正が意図通り動作するか**（ロジック検証）
2. **UI刷新後の上級者向け機能が隠れていても正常動作するか**（JS参照切れの有無）
3. **esm.run CDN リスクの最終判断**（本番公開サイトとして許容範囲か）
4. **`<details>` 格納後のイベントハンドラが正常に動作するか**（`btn-template` / `learning-upload`）

辛口で結構です。残課題があれば 🔴 / 🟡 で再指摘してください。
