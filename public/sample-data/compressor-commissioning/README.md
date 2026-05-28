# コンプレッサ試運転 完全サンプルデータ

物理整合（Ψ-Φ放物線 + サージ近傍）で生成した「完璧な」訓練用データセット。

## ファイル

| ファイル | 用途 | フェーズ |
|---|---|---|
| `operations.csv` | 試運転① 10 操作点 + 性能ラベル | A: 事前訓練 |
| `stream.csv` | 3660 s × 6ch センサーストリーム | A: 事前訓練 (AE/L2用) |
| `embeddings_timesfm25.csv` | TimesFM 2.5 風 16 次元埋め込み | A: 事前訓練 (L2 任意) |
| `eval_points.csv` | 試運転②で達成したい性能評価点 (PTC10/API617 5 点) | B: 本番予測 |
| `actual_run2.csv` | 試運転②実機計測 (予実差確認用デモ) | C: 予実差確認 |

## 物理パラメータ（正解）

- a = 0.62, b = 0.85 (Ψ = a − b·Φ²)
- φ_norm = 0.18, N_design = 7800 rpm
- D2 = 0.42 m, ρ = 1.18 kg/m³
- η_max = 0.78, φ at η peak = 0.14

## 操作変数の制約（絶対）

- u1 吸込弁 (0-100%)
- u2 循環弁 (0-100%)
- u3 入口弁 (0-100%)
- **吐出側 (discharge) は一切ない** — 測定領域なので操作不可

## 使い方

1. **Phase A** タブで `operations.csv` + `stream.csv` (+ `embeddings_timesfm25.csv` 任意) を投入 → GP 訓練
2. **Phase B** タブで `eval_points.csv` を読み込み → バルブ開度推定
3. 推定値で実機試運転②実施
4. **Phase C** タブで `actual_run2.csv` 投入 → 予実差を可視化

生成: `scripts/gen_compressor_sample.py`
