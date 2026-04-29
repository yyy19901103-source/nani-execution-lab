# CODEX 6巡目レビュー依頼書（2026-04-29）

## レビュー対象

**プロジェクト**: NaNi Execution Lab — 製造業DX × ETO（一品一様製造） 個人技術サイト
**リポジトリ**: https://github.com/yyy19901103-source/nani-execution-lab
**対象コミット**: `11755fb`（HEAD）
**前回レビュー対象**: `1ce495b`（5巡目）

---

## 🔁 5巡目レビュー以降の実装サマリ

### コミット一覧（新しい順）

| コミット | 内容 |
|---------|------|
| `11755fb` | Phase 5: Llama 3.2 1B（WebLLM）モードB追加 — デビクラ文自動生成 |
| `87e50d2` | Phase 4: PDF.js + Transformers.js による AI 類似事例検索 |
| `178b70d` | カスタム辞書語登録UI（自社固有デビクラ語を手動追加・削除） |
| `6240918` | blobダウンロードバグ修正（`revokeObjectURL` 即時呼び出し → `setTimeout(1000)` |
| `4a28835` | モデル共有（JSON書き出し/取り込み）+ 使い方ガイド追加 |

### Phase 4: AI類似事例検索（`87e50d2`）

| 追加要素 | 実装内容 |
|---------|---------|
| **PDF.js** | `pdfjs-dist@3.11.174`（CDN）で顧客仕様書PDF → 文分割（10文字未満除外） |
| **Transformers.js** | `@xenova/transformers@2.17.2` ESモジュール → `window._txPipeline` 架け橋 |
| **Embeddingモデル** | `Xenova/paraphrase-multilingual-MiniLM-L12-v2`（117MB・初回DLのみ・CacheAPI保存） |
| **IndexedDB拡張** | DB_VER: 1→2、`pastCases` ObjectStore 追加 `{ id, specText, devicraText, embedding: number[], preset, addedAt }` |
| **過去事例登録UI** | 過去PDF仕様書アップロード → 文リスト表示 → 行ごとデビクラ入力 → Embed保存 |
| **類似検索** | 新仕様文 Embed → 過去事例との cosine 類似度 → 閾値 0.75 以上を表示 |

### Phase 5: Llama 3.2 1B 生成（`11755fb`）

| 追加要素 | 実装内容 |
|---------|---------|
| **WebLLM** | `@mlc-ai/web-llm`（`esm.run` CDN）→ `window._webllmCreate` 架け橋 |
| **Llamaモデル** | `Llama-3.2-1B-Instruct-q4f16_1-MLC`（~700MB・WebGPU必須） |
| **モード切替UI** | モードA（Embeddingのみ）/ モードB（+Llama生成）をラジオで選択 |
| **生成ロジック** | 過去事例あり → Top2をコンテキストとして生成 / なし → 0件からデビクラ文生成 |
| **WebGPU検出** | `navigator.gpu.requestAdapter()` で非対応ブラウザを事前検出 |

### カスタム辞書語登録（`178b70d`）

- 語 / 判断材料(why) / 判定（対象/要確認/対象外）/ E&C&LT 種類 をフォーム入力
- `_custom: true` フラグで手動追加語を識別
- `saveExtendedDicts()` で即時 IndexedDB 保存（activeDictVersion がなければ自動作成）
- `getEffectiveDict()` 経由で次抽出から反映

---

## 🔍 重点レビュー項目（6巡目）

### A. Phase 4: AI類似検索の整合性

1. **PDF.js テキスト抽出の正確さ**
   - 日本語縦書き・マルチカラム・表組みのテキストが正しく抽出されるか
   - `content.items.map(it => it.str).join('')` で結合すると単語境界が消えるリスク
   - `minLen = 12` の下限は適切か（短すぎ / 長すぎ）

2. **Transformers.js 架け橋パターンの安全性**
   - `window._txPipeline = pipeline` が ESモジュール完了前にメインスクリプトから参照されるレース条件は発生しないか
   - `getEmbedder()` で `window._txPipeline` が null の場合のエラーメッセージは適切か

3. **DB_VER 1→2 アップグレード**
   - 既存ユーザーの v1 データ（reviews / dictVersions / modelMeta / learningQ）が破壊されないか
   - `onupgradeneeded` で `if (!contains(...)) createObjectStore(...)` の冪等性は保たれているか

4. **コサイン類似度計算の正確さ**
   - `normalize: true` 前提で dot 積のみ（`= cosineSim(a,b)`）を類似度として使っているが、Transformers.js が確実に L2 正規化を施しているか
   - `pastCases` に保存された古い embedding と新規 embedding のモデル不一致時の振る舞い

5. **過去事例登録フロー**
   - PDF行の「登録」ボタンが Embedding 中に連打されたとき二重登録しないか
   - `addPastCase()` 内で `embedText()` が失敗した場合、DB に中途半端なレコードが残らないか（embedding: [] のレコード）

### B. Phase 5: Llama生成の整合性

6. **WebGPU 検出ロジック**
   - `navigator.gpu.requestAdapter()` は Promise を返す非同期 API。`await` しているか確認
   - iOS Safari / Firefox は WebGPU 非対応だが、適切にフォールバックするか

7. **esm.run CDN の信頼性リスク**
   - `esm.run` は非公式ミラー。CDN 障害時に `window._webllmCreate = null` になるが、
     エラーメッセージは「WebLLMがまだ読込中です」になるため原因が不明
   - 公式 `cdn.jsdelivr.net/npm/@mlc-ai/web-llm` への切り替えを検討すべきか

8. **Llama system prompt の製造業適合性**
   - "ETO製造業のデビクラ専門家" という設定で 1B モデルが日本語で有用な出力を返せるか
   - `max_tokens=180, temperature=0.3` の設定でデビクラ文として適切な長さ・多様性になるか

9. **モードB で過去事例0件時の動作**
   - `validPast.length === 0` でも `visibleRows` にLlama生成結果が含まれるか
   - `generateDevicra(spec, [])` の空配列ケースで prompt は適切か

10. **DLサイズの告知**
    - 117MB（Embedding）+ 700MB（Llama）= 計 820MB の初回 DL
    - ユーザーへの事前告知 UI が十分か

### C. カスタム辞書語登録の整合性

11. **`saveExtendedDicts()` のバージョン管理**
    - `activeDictVersion` が null の場合 `custom-YYYY-MM-DD` を自動作成するが、
      その後「学習実行」で新バージョンが生成されたとき、カスタム語は引き継がれるか
    - `btn-train` ハンドラが `JSON.parse(JSON.stringify(extendedDicts))` でディープコピーするため
      `_custom: true` フラグも保持されるはず — 確認

12. **`_custom` フラグのモデルインポート時の扱い**
    - `model-import-upload` の `merge` モードで外部 JSON を取り込んだとき
      `_custom: true` が付いていない学習追加語と混在した場合に `renderCustomWords()` が混乱しないか

### D. 機密保護（強化確認）

13. **pastCases の仕様文が外部送信されていないか**
    - PDF仕様文が IndexedDB に保存 → Transformers.js / WebLLM はローカル推論
    - Llama の `engine.chat.completions.create()` が外部 API を叩いていないことを確認

14. **WebLLM の推論がブラウザ内完結か**
    - `@mlc-ai/web-llm` はモデルを WebGPU でブラウザ内推論する設計だが、
      `CreateMLCEngine()` が内部でどこかに通信していないか（TVM runtime の telemetry 等）

15. **console.log の仕様文露出**
    - Phase 4/5 の追加コードで `specText` / `devicraText` が console に出ていないか

### E. UX

16. **Embedding 処理時間（300文 × ~75ms = ~25秒）**
    - プログレスバーの更新が適切か。`await new Promise(r => setTimeout(r, 0))` の yield 頻度

17. **Llama 初回 DL（~700MB）のUX**
    - DL中にページを閉じるとどうなるか（次回に再DLが必要か / キャッシュが残るか）
    - プログレスバーがゼロのまま固まるケースはないか

18. **PDF文リストのUX**
    - 20ページPDFで300〜500文が一覧表示されると長すぎる
    - ページ番号フィルター / 文字数フィルター等のUX改善余地

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
1. **DB_VER アップグレードの安全性**（既存ユーザーデータ破壊リスク）
2. **Llama WebGPU 推論がブラウザ内完結であることの確認**（機密保護の根幹）
3. **esm.run CDN リスク**（本番サイトに非公式ミラーを使う妥当性）
4. **過去事例0件 + モードB の動作**（Llama のみで有用なデビクラが出るか）

## 機密保護絶対要件（変わらず）

特定企業名・社名想起略号・個人名・案件番号・内部システム名 を**コード/コメント/git log/コミットメッセージ**全域でチェック。1件でも 🔴 Critical で即指摘。

---

## CODEX への手順

```bash
git clone https://github.com/yyy19901103-source/nani-execution-lab.git
cd nani-execution-lab
git log --oneline -5
# 11755fb が HEAD であることを確認

cat CODEX_REVIEW_REQUEST.md  # 本依頼書

# 主要レビュー対象
#   src/pages/ai-tools/spec-risk-extractor.astro
#     - Phase 4: PDF.js + Transformers.js Embedding（extractPDFSentences / getEmbedder / cosineSim / addPastCase）
#     - Phase 5: WebLLM Llama（getLlamaEngine / generateDevicra / btn-ai-search モードB処理）
#     - カスタム辞書: saveExtendedDicts / renderCustomWords / btn-cdict-add
#     - DB v2: onupgradeneeded の pastCases 追加

# 差分確認
git diff 1ce495b..11755fb -- src/pages/ai-tools/spec-risk-extractor.astro
```

レビュー後、以下3点の総評をお願いします：

1. **Phase 4+5 完了で「20ページPDFを読んで過去事例と照合しデビクラを提示する」フローが現場で使えるレベルか**
2. **ブラウザ完結・外部送信ゼロの原則が Phase 4+5 追加後も維持されているか**
3. **esm.run / CDN 依存・WebGPU 要件など、本番公開サイトとしてのリスクが許容範囲か**

辛口で結構です。残課題があれば 🔴 / 🟡 で再指摘してください。
