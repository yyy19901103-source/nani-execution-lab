# CODEX 8巡目レビュー依頼書（2026-05-01）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト  
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab  
**対象コミット**: `e77ad9b`（HEAD）  
**前回レビュー対象**: `538ae79`（7巡目）  

---

## 🔁 7巡目レビュー以降の実装サマリ

### コミット一覧（新しい順）

| コミット | 内容 |
|---------|------|
| `e77ad9b` | UI全面最適化 — learning-panelを3タブ構造に再設計、列マッピング必須/任意分離 |
| `60f2662` | 過去事例DB Excel一括取込機能追加（SheetJS、進捗バー、列自動検出） |
| `d3e1612` | WebLLM CDN固定（@0.2.73）＋esm.sh フォールバック＋RAG+Llama統合強化 |
| `31b0ca8` | ブログ記事を技術論に全面改稿（組織内容を完全削除） |

---

## 📋 今回の主要変更①：UI全面最適化（`e77ad9b`）

### 変更概要

ユーザー調査「分かりにくい」を受け、`learning-panel` と `mapping-section` を大幅リファクタ。

---

### 変更1: 列マッピングの必須/任意分離

**Before**: 9つのドロップダウンが均等に並列表示（重要度が不明）  
**After**: 必須2列（オレンジ枠でハイライト）＋ 任意8列（`<details>` で折りたたみ）

```html
<!-- 必須: .mapping-required（2列グリッド） -->
<div class="mapping-required">
  <div><label>シート選択</label><select id="sheet-select"></select></div>
  <div><label>要求仕様文の列 ★ 必須</label><select id="col-spec"></select></div>
</div>

<!-- 任意: .mapping-optional（<details> デフォルト閉じ） -->
<details class="mapping-optional">
  <summary>任意列の追加設定（章番号・カテゴリー・所掌・引合番号など）</summary>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));...">
    <!-- col-chapter / col-category / col-type / col-owner / col-project / col-rfq / col-doc / col-impact -->
  </div>
</details>
```

**重点確認 #1**:  
- `<details>` が閉じた状態でも `id="col-chapter"` 等への JS 参照（`getElementById`）は正常に動作するか  
- `populateSelects()` 実行タイミングが `<details>` の open/close 状態に依存していないか  
- 任意列の `select` が `<details>` 閉じ中でも `sheet-select` 変更時に正しく更新されるか

---

### 変更2: learning-panel の3タブ構造

**Before**: 学習統計・カスタム辞書・AI事例DB が縦に羅列（スクロールしないと全体が見えない）  
**After**: タブ切替により3つの機能グループを分離

```html
<div class="tab-bar">
  <button class="tab-btn active" data-target="tab-learn">📚 学習</button>
  <button class="tab-btn" data-target="tab-dict">📖 辞書</button>
  <button class="tab-btn" data-target="tab-ai">🧠 AI事例DB</button>
</div>

<div id="tab-learn"  class="tab-panel active"><!-- 統計カード・学習実行・モデル共有 --></div>
<div id="tab-dict"   class="tab-panel"><!-- カスタム辞書追加・一覧 --></div>
<div id="tab-ai"     class="tab-panel"><!-- Excel一括/PDF/手動登録・AI初期化 --></div>
```

タブ切替 JS:
```javascript
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(target)?.classList.add('active');
  });
});
```

**重点確認 #2**:  
- `tab-dict` 非表示中に `cdict-tbody`・`cdict-count` への DOM 操作が `tab-dict` が一度も表示されていない状態（DOM未レンダリング相当）でも `getElementById` で取得できるか  
- `tab-ai` が非表示の間に `past-excel-upload` の `change` イベントが発火した場合、プログレスバー等の DOM 操作でエラーが発生しないか  
- `refreshPastCasesUI()` が boot 時に呼ばれるが、`tab-ai` パネルが `display:none` 状態でも `past-cases-list` への innerHTML 挿入は問題ないか  
- `refreshLearningStats()` が boot 時に `tab-learn` の stat-cards を操作するが、パネル全体（`learning-panel`）が `display:none` の状態でも問題ないか

---

## 📋 今回の主要変更②：過去事例DB Excel一括取込（`60f2662`）

### 実装概要

`past-excel-upload` input で xlsx ファイルを受け取り、SheetJS で解析 → `pastCases` ObjectStore へ一括保存。

**対象外フィルタ**: 「判定」列が「対象外」の行は登録しない  
**列自動検出**: `['仕様', '要求', 'spec', 'specification']` で spec 列を探し、`['デビクラ', 'deviation', 'devicra', 'clarification']` で devicra 列を探す  
**進捗バー**: 100件ごとに `past-excel-bar` width% を更新

```javascript
async function importPastCasesFromExcel(file) {
  const buf  = await file.arrayBuffer();
  const wb   = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  // ... 列自動検出 → judgmentCol フィルタ → IndexedDB 書き込み
}
```

**重点確認 #3**:  
- `XLSX.read()` に `new Uint8Array(buf)` を渡す呼び出しは SheetJS 0.18.5 の正しい API か（`{ type: 'array' }` との組み合わせ）  
- 1000行超の xlsx 処理中にメインスレッドがブロックされ、プログレスバーが止まらないか  
- `await new Promise(r => setTimeout(r, 0))` を 100件ごとに挟む実装は十分か、それとも `requestIdleCallback` が推奨されるか  
- `対象外フィルタ` で `judgmentCol` が検出できなかった場合、全行が取り込まれる挙動は仕様通りか（意図的か）

---

## 📋 今回の主要変更③：WebLLM CDN固定 ＋ RAG統合（`d3e1612`）

### CDN安定化

```html
<!-- バージョン固定 + フォールバック -->
<script type="module" id="webllm-bridge">
  const CDN_LIST = [
    'https://esm.run/@mlc-ai/web-llm@0.2.73',
    'https://esm.sh/@mlc-ai/web-llm@0.2.73',
  ];
  for (const cdn of CDN_LIST) {
    try {
      const { CreateMLCEngine } = await import(cdn);
      window._webllmCreate = CreateMLCEngine;
      break;
    } catch(e) { continue; }
  }
  if (!window._webllmCreate) window._webllmCreate = null;
</script>
```

### RAG出力パーサー

```javascript
function parseRagOutput(raw) {
  const jMatch = raw.match(/判定\s*[:：]\s*(対象|要確認|対象外)/);
  const dMatch = raw.match(/デビクラ\s*[:：]\s*(.+)/s);
  return {
    judgment: jMatch ? jMatch[1] : null,
    devicra:  dMatch ? dMatch[1].trim() : raw,
  };
}
```

**重点確認 #4**:  
- `for...of` + `break` の動的 `import()` チェーンは、1つ目の CDN が CORS エラーで失敗した場合も `catch` で捕捉されるか（`import()` の CORS 失敗は `TypeError` としてスローされるか）  
- `window._webllmCreate = null` セット後、`getLlamaEngine()` で `null チェック → エラーメッセージ分岐` は正しく動作するか  
- `parseRagOutput` の `/s` フラグ（dotall）は Chromium 63+ / Firefox 78+ で有効か。Safari 16 以下では使用不可のため、対応ブラウザ範囲として問題ないか  
- LLM プロンプトで `temperature: 0.2` 固定は、`@mlc-ai/web-llm@0.2.73` の API で正しいパラメータ名か（`temperature` vs `temp`）

---

## 🔍 7巡目から継続している未解決懸念事項

### PDF文リストのUX（7巡目指摘 #18・継続）

- 20ページPDFで300〜500文が一覧表示される問題は未改善
- ページ番号フィルターや文字数フィルターの追加を推奨されたが未着手
- 現在は `tab-ai` タブ内に格納されたため視覚的には改善されているが、根本的な文数制限はなし
- 許容範囲か、P2対応として指摘すべきか評価をお願いします

### IndexedDB マイグレーション（継続）

- `DB_VER=2` で `pastCases` ObjectStore を追加したが、`onupgradeneeded` の `oldVersion` 分岐が正しく実装されているか確認をお願いします
- v1→v2 のアップグレードパスで既存 `reviews` / `dictVersions` / `modelMeta` が消えていないか

---

## 機密保護絶対要件（変わらず）

特定企業名・社名想起略号・個人名・案件番号・内部システム名 を **コード/コメント/git log/コミットメッセージ** 全域でチェック。1件でも 🔴 Critical で即指摘。

---

## CODEX への手順

```bash
git clone https://github.com/yyy19901103-source/nani-execution-lab.git
cd nani-execution-lab
git log --oneline -6
# e77ad9b が HEAD であることを確認

cat CODEX_REVIEW_REQUEST.md  # 本依頼書

# 主要レビュー対象
#   src/pages/ai-tools/spec-risk-extractor.astro

# 今回の主要差分
git diff 60f2662..e77ad9b -- src/pages/ai-tools/spec-risk-extractor.astro   # UI最適化
git diff d3e1612..60f2662 -- src/pages/ai-tools/spec-risk-extractor.astro   # Excel一括取込
git diff 31b0ca8..d3e1612 -- src/pages/ai-tools/spec-risk-extractor.astro   # WebLLM+RAG
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

特に重視する確認ポイント（優先順）：

1. **#2 タブ非表示中のDOM操作安全性** — `display:none` 中の `getElementById` / イベントハンドラが boot 時・各操作時にエラーを起こさないか
2. **#1 `<details>` 閉じ中の select 更新** — 任意列ドロップダウンが非表示中でも `populateSelects()` が正常動作するか
3. **#3 SheetJS API 呼び出しの妥当性** — `XLSX.read(new Uint8Array(buf), { type: 'array' })` は正しいか
4. **#4 CDN フォールバックの CORS 挙動** — `import()` の CORS 失敗が `catch` で捕捉されるか
5. **IndexedDB v1→v2 マイグレーション** — 既存 ObjectStore が消えていないか

辛口で結構です。残課題があれば 🔴 / 🟡 で再指摘してください。
