"""
コンプレッサ試運転サンプルデータ生成
- 物理モデル: Ψ = a − b·Φ²  (放物線ヘッド係数曲線)
- 操作変数: u1=吸込弁(0-100%), u2=循環弁(0-100%), u3=入口弁(0-100%), rpm
- 出力変数: y1=Q[Nm³/h] (吸込流量), y2=ΔP[kPa] (差圧), y3=η[%] (効率)
- 試運転① 過去データ: 10 操作点 (経験者が手動運転で記録)
- センサーストリーム: 3660 秒 (61 分) @ 1Hz、6 ch
- 外部埋め込み (TimesFM 2.5 風): 16 次元 × 操作時刻
- 試運転② 実機データ: 5 評価点の実機計測値 (予実差確認用)
"""

import csv
import math
import random
from pathlib import Path

random.seed(42)
OUT = Path(__file__).parent.parent / "public" / "sample-data" / "compressor-commissioning"
OUT.mkdir(parents=True, exist_ok=True)

# --- 物理パラメータ (これが「正解」) ---
a = 0.62        # Ψ 切片
b = 0.85        # Ψ 二次係数
phi_norm = 0.18 # 正規化流量
N_design = 7800  # rpm 定格
D2 = 0.42       # 羽根車外径 [m]
rho = 1.18      # 吸込密度 [kg/m³]
eta_max = 0.78
phi_eta_peak = 0.14


def physics(u1, u2, u3, rpm):
    """3 バルブ + rpm → (Q, dP, eta) の真の物理応答 (スケーリング調整済)"""
    # バルブ → 実効流量係数（吸込・循環側のみ操作可）
    Cv = 0.55 * (u1 / 100) + 0.20 * (u3 / 100) - 0.30 * (u2 / 100)
    Cv = max(0.05, Cv)
    # 周速 U2
    U2 = math.pi * D2 * rpm / 60.0
    # Φ（流量係数）— スケール係数 8.0 で代表機サイズに合わせる
    Phi = Cv * 0.32 * (rpm / N_design)
    # Ψ（ヘッド係数）
    Psi = a - b * Phi * Phi
    Psi = max(0.02, Psi)
    # ヘッド H = Ψ U2²/g
    H = Psi * U2 * U2 / 9.81  # [m]
    # 流量 Q ~ 12500 Nm³/h @ 設計点 (u1=90,u3=85,u2=10,rpm=7800)
    Q = Phi * U2 * (math.pi * D2 * D2 / 4) * 3600 * 0.7
    # 差圧 ΔP ~ 105 kPa @ 設計点
    dP = rho * 9.81 * H / 1000.0 * 5.0
    # 効率 (パラボリック、Φ_peak ≈ 0.055 で η_peak=78%)
    eta = eta_max - 30.0 * (Phi - 0.055) ** 2
    eta = max(0.40, min(0.82, eta))
    return Q, dP, eta * 100


# --- 試運転① 10 操作点 ---
# 経験者が広く分散して取った点（学習用）
operations = [
    # (timestamp[s], rpm, u1_suction, u2_circ, u3_inlet, label)
    (300,  6500, 40, 60, 50, "warm-up A"),
    (600,  7000, 55, 40, 60, "low-Q point"),
    (900,  7200, 70, 25, 70, "mid-Q point"),
    (1200, 7500, 80, 15, 80, "high-Q point"),
    (1500, 7800, 90, 10, 85, "near-design"),
    (1800, 7800, 65, 35, 60, "recirc test"),
    (2100, 7500, 50, 50, 50, "balanced"),
    (2400, 7300, 75, 20, 75, "surge margin test"),
    (2700, 7600, 85, 12, 82, "high-η search"),
    (3000, 7400, 60, 45, 55, "verification"),
]

# operations.csv
with open(OUT / "operations.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["timestamp_s", "rpm", "u1_suction_pct", "u2_circ_pct",
                "u3_inlet_pct", "y1_Q_Nm3h", "y2_dP_kPa", "y3_eta_pct", "label"])
    for ts, rpm, u1, u2, u3, lbl in operations:
        Q, dP, eta = physics(u1, u2, u3, rpm)
        # 実機ノイズ ±0.8%
        Q *= 1 + random.gauss(0, 0.008)
        dP *= 1 + random.gauss(0, 0.008)
        eta += random.gauss(0, 0.3)
        w.writerow([ts, rpm, u1, u2, u3, f"{Q:.2f}", f"{dP:.3f}", f"{eta:.2f}", lbl])

# --- センサーストリーム (3660s, 1Hz, 6ch) ---
# 操作点を中心にスムーズに遷移。間は擬似定常 + 微小ノイズ
def smooth_path(t):
    """t[s] → (rpm,u1,u2,u3) を線形補間"""
    pts = [(0, 0, 0, 100, 0)] + [(o[0], o[1], o[2], o[3], o[4]) for o in operations] + [(3660, 6000, 0, 100, 0)]
    for i in range(len(pts) - 1):
        if pts[i][0] <= t <= pts[i+1][0]:
            f = (t - pts[i][0]) / (pts[i+1][0] - pts[i][0] + 1e-9)
            rpm = pts[i][1] + (pts[i+1][1] - pts[i][1]) * f
            u1 = pts[i][2] + (pts[i+1][2] - pts[i][2]) * f
            u2 = pts[i][3] + (pts[i+1][3] - pts[i][3]) * f
            u3 = pts[i][4] + (pts[i+1][4] - pts[i][4]) * f
            return rpm, u1, u2, u3
    return 6000, 0, 100, 0

with open(OUT / "stream.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["t_s", "rpm", "u1_suction", "u2_circ", "u3_inlet",
                "p_suction_kPa", "p_disch_kPa", "T_suction_C", "T_disch_C",
                "Q_Nm3h", "vib_um"])
    for t in range(0, 3660):
        rpm, u1, u2, u3 = smooth_path(t)
        Q, dP, eta = physics(u1, u2, u3, rpm)
        ps = 101.3 + random.gauss(0, 0.4)
        pd = ps + dP + random.gauss(0, 0.3)
        Ts = 25 + random.gauss(0, 0.5)
        Td = Ts + dP * 0.18 + random.gauss(0, 1.2)
        vib = 8 + (rpm - 6500) / 200 + random.gauss(0, 0.6)
        Qn = Q * (1 + random.gauss(0, 0.01))
        w.writerow([t, f"{rpm:.0f}", f"{u1:.1f}", f"{u2:.1f}", f"{u3:.1f}",
                    f"{ps:.2f}", f"{pd:.2f}", f"{Ts:.2f}", f"{Td:.2f}",
                    f"{Qn:.1f}", f"{vib:.2f}"])

# --- 外部埋め込み (TimesFM 2.5 風, 16 次元) ---
# 操作時刻ごとに 16-d ベクトル: 操作点近傍のセンサーパターンを encode した「ぽい」もの
with open(OUT / "embeddings_timesfm25.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["timestamp_s"] + [f"emb_{i+1}" for i in range(16)])
    for ts, rpm, u1, u2, u3, lbl in operations:
        Q, dP, eta = physics(u1, u2, u3, rpm)
        # 操作 + 物理応答から構造のある埋め込みを合成
        seed_vec = [
            (rpm - 7000) / 800,
            (u1 - 50) / 30, (u2 - 30) / 25, (u3 - 60) / 25,
            (Q - 9000) / 2500, (dP - 80) / 30, (eta - 70) / 8,
        ]
        emb = []
        for i in range(16):
            base = sum(math.sin((i + 1) * v * 0.7 + i * 0.3) for v in seed_vec) / len(seed_vec)
            emb.append(base + random.gauss(0, 0.05))
        w.writerow([ts] + [f"{v:.5f}" for v in emb])

# --- 評価点 (試運転② で達成したい性能点) ---
# PTC10 / API617 通常 5 点
eval_points = [
    # (name, y1_Q, y2_dP, y3_eta)
    ("100% design", 12500, 105, 76.0),
    ("80% Q", 10000, 92, 74.5),
    ("60% Q", 7500, 75, 70.0),
    ("110% Q overload", 13800, 115, 73.5),
    ("min flow (surge margin)", 6000, 65, 65.0),
]
with open(OUT / "eval_points.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["name", "y1_Q_Nm3h_target", "y2_dP_kPa_target", "y3_eta_pct_target"])
    for name, Q, dP, eta in eval_points:
        w.writerow([name, Q, dP, eta])

# --- 試運転② 実機結果 (予実差確認用、デモ) ---
# ツールが推定したバルブ開度で試運転②を実施した想定 → 実機実測値
# 「正解バルブ開度」を物理逆解きで求め、それで physics() を回し、実機ノイズを乗せる
def solve_valves_for_target(Q_t, dP_t, rpm_target=7800):
    """目標 Q, dP に最も近いバルブ開度を粗探索"""
    best = None
    for u1 in range(20, 100, 5):
        for u2 in range(5, 70, 5):
            for u3 in range(20, 95, 5):
                Q, dP, eta = physics(u1, u2, u3, rpm_target)
                err = ((Q - Q_t) / Q_t) ** 2 + ((dP - dP_t) / dP_t) ** 2
                if best is None or err < best[0]:
                    best = (err, u1, u2, u3, rpm_target, Q, dP, eta)
    return best

with open(OUT / "actual_run2.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["eval_name",
                "rpm", "u1_suction_pct", "u2_circ_pct", "u3_inlet_pct",
                "y1_Q_Nm3h_actual", "y2_dP_kPa_actual", "y3_eta_pct_actual"])
    for name, Qt, dPt, etat in eval_points:
        _, u1, u2, u3, rpm, Q, dP, eta = solve_valves_for_target(Qt, dPt)
        # 試運転②の実機ノイズ (±1.5%, GP 予測との差はここから生まれる)
        Q *= 1 + random.gauss(0, 0.015)
        dP *= 1 + random.gauss(0, 0.012)
        eta += random.gauss(0, 0.6)
        w.writerow([name, rpm, u1, u2, u3, f"{Q:.1f}", f"{dP:.3f}", f"{eta:.2f}"])

# --- README ---
readme = """# コンプレッサ試運転 完全サンプルデータ

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
"""
(OUT / "README.md").write_text(readme, encoding="utf-8")

print(f"Generated 5 CSVs + README in {OUT}")
for p in sorted(OUT.iterdir()):
    print(f"  {p.name:40s} {p.stat().st_size:>8} bytes")
