# PMP学習アプリ

NaNi Lab 内の独立ブロック。**PMI 非公認の補助ツール**。

## 正直な位置づけ

このアプリの**できること**と**できないこと**を明示します。

### ✅ できること（このアプリの価値）

- **演習場として**: 103問の選択式問題、5軸フィルタ、根拠メモ必須UI
- **進捗管理**: SRS（間隔反復）、達成条件チェッカー、学習ログ＋3グラフ
- **個別カリキュラム engine**: 進捗・誤答・経過日数から「次やるべきこと」を自動推奨
- **試験形式の模試**: 短縮60問・フル180問、ECO 配分準拠、結果に弱点傾向誘導
- **個人ノート & ブックマーク**: 章・問題・ケース・用語に学習中の気付きを残せる
- **横断検索**: 章本文・問題・用語・ケースを一発検索
- **完全ブラウザ完結**: サーバー送信なし・無料・アカウント不要
- **データ移行**: JSON Export/Import で端末間移動可能

### ❌ できないこと（限界の明示）

- **PMP 公式教材の代替にはなりません**。Rita Mulcahy 本・PMBOK 第7版・PMI ECO 2021 等との併用必須。
- **収録コンテンツの正確性を保証しません**。章本文35章・用語120語・Mindset・ケース10件は AI 生成オリジナル素材で、PMI 公式資料との照合は未実施です。誤りを発見したら個人ノート機能で訂正を記録してください。
- **合格は保証しません**。本アプリのみで合格できる主張はしません。

## 構成

```
src/data/pmp/
├── eco-structure.json    # ECO 3ドメイン × 35タスク + Mindset 8原則
├── chapters.json         # 35章メタデータ
├── chapter-content.json  # 35章本文（AI生成・要検証）
├── questions.json        # 103問プール
├── glossary.json         # 120用語
├── mindset.json          # Mindset 8原則
├── case-studies.json     # 10ケース
└── types.ts

src/components/pmp/
├── db.ts                 # IndexedDB（v2: notes/bookmarks追加）
├── store.ts              # Zustand
├── curriculum.ts         # 推奨engine
├── Dashboard.tsx
├── Quiz.tsx              # 5軸フィルタ + 個人ノート
├── Exam.tsx              # 復習+弱点傾向+全問レビュー
├── Log.tsx               # Chart.js 3グラフ
├── ChapterDetail.tsx     # 章詳細 + ノート
├── NoteBookmark.tsx      # 個人ノート/ブックマーク共通UI
├── Search.tsx            # 横断検索
├── Bookmarks.tsx         # ブックマーク・メモ一覧
└── Settings.tsx

src/pages/ai-tools/pmp-study/
├── index.astro
├── quiz.astro
├── study.astro / study/[chapter].astro
├── exam.astro
├── log.astro
├── glossary.astro
├── mindset.astro
├── cases.astro
├── search.astro          # 横断検索
├── bookmarks.astro       # ブックマーク・メモ
└── settings.astro
```

## 学習中の使い方

1. **公式教材で学ぶ**（Rita Mulcahy・PMBOK 等）
2. **このアプリの該当章を開く**（誤りに気付いたら個人ノートに記録）
3. **ミニチェック演習**（章詳細→該当章の問題演習リンク）
4. **解答後にノート**（自分の根拠と公式テキストの差分をメモ）
5. **ブックマーク**（あとで確認したい章・問題・用語に星を付ける）
6. **横断検索**（迷ったら/search で全コンテンツ検索）
7. **SRS 復習**（誤答が自動的に間隔再出題される）
8. **定期模試**（短縮版で進捗確認、フルで本番想定）

## データの保存先

- **静的データ**（章・問題・用語等）: リポジトリ内 JSON、ビルドに含まれる
- **ユーザーデータ**（解答履歴・ノート・ブックマーク・設定）: 各訪問者のブラウザ IndexedDB
- **エクスポート**: JSON 出力で他端末へ移行可能

## 商標

PMP / PMI / PMBOK は PMI の登録商標。本アプリは PMI 非公認の補助ツール。
