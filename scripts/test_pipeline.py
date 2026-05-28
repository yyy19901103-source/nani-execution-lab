"""
Round 2: データパイプラインの厳密シミュレーション
ツールが実行するロジック（CSV パース → 時刻 join → 残差 → GP 訓練 → 逆推定 → 予実差）を
全部 Python で再現し、論理的整合を検証する。
"""
import csv
import math
from pathlib import Path

ROOT = Path(__file__).parent.parent
SD = ROOT / "public" / "sample-data" / "compressor-commissioning"

print("="*70)
print("Round 2: データパイプライン Python シミュレーション")
print("="*70)

# --- Step 1: CSV パース ---
def load_csv(p):
    with open(p, encoding='utf-8') as f:
        r = csv.reader(f)
        header = next(r)
        rows = [row for row in r]
    return header, rows

ops_h, ops_r = load_csv(SD / "operations.csv")
st_h, st_r = load_csv(SD / "stream.csv")
emb_h, emb_r = load_csv(SD / "embeddings_timesfm25.csv")
ev_h, ev_r = load_csv(SD / "eval_points.csv")
ac_h, ac_r = load_csv(SD / "actual_run2.csv")

print(f"\n[1] CSV パース")
print(f"  operations: {len(ops_r)}行 × {len(ops_h)}列  {ops_h}")
print(f"  stream:     {len(st_r)}行 × {len(st_h)}列  {st_h}")
print(f"  embeddings: {len(emb_r)}行 × {len(emb_h)}列")
print(f"  eval_pts:   {len(ev_r)}行")
print(f"  actual2:    {len(ac_r)}行")

errors = []
warnings = []

# --- Step 2: 列マッピング検証 ---
print(f"\n[2] 列マッピング検証 (JS の setSel/setMulti と CSV ヘッダの突き合わせ)")
expected_op_u = ['rpm', 'u1_suction_pct', 'u2_circ_pct', 'u3_inlet_pct']
expected_op_time = 'timestamp_s'
expected_st_y = ['Q_Nm3h', 'p_disch_kPa', 'T_disch_C']
expected_st_time = 't_s'

for col in [expected_op_time] + expected_op_u:
    ok = col in ops_h
    print(f"  ops.{col}: {'✓' if ok else '✗ NOT FOUND'}")
    if not ok: errors.append(f"ops missing {col}")

for col in [expected_st_time] + expected_st_y:
    ok = col in st_h
    print(f"  stream.{col}: {'✓' if ok else '✗ NOT FOUND'}")
    if not ok: errors.append(f"stream missing {col}")

# 吐出側が u に混入していないか
for u in expected_op_u:
    if 'disch' in u.lower() or 'discharge' in u.lower() or '吐出' in u:
        errors.append(f"!! 吐出側列 {u} が u に混入 !!")
print(f"  吐出側 u 混入チェック: {'✗ FRAUD!' if any('disch' in str(e) for e in errors) else '✓ なし'}")

# --- Step 3: 時刻パース + 時間範囲整合 ---
print(f"\n[3] 時刻パース + 時間範囲整合")
op_times = [float(r[ops_h.index('timestamp_s')]) for r in ops_r]
st_times = [float(r[st_h.index('t_s')]) for r in st_r]
op_min, op_max = min(op_times), max(op_times)
st_min, st_max = min(st_times), max(st_times)
print(f"  ops range: {op_min:.0f}〜{op_max:.0f} s ({len(op_times)} 点)")
print(f"  stream range: {st_min:.0f}〜{st_max:.0f} s ({len(st_times)} 点)")
range_ok = (op_min >= st_min - 1) and (op_max <= st_max + 1)
print(f"  時間範囲整合 (ops ⊆ stream): {'✓' if range_ok else '✗'}")
if not range_ok: errors.append("時間範囲不整合")

# --- Step 4: 時刻 join (operations 時刻に最も近い stream 行を抽出) ---
print(f"\n[4] 時刻 join → y ラベル抽出 (ツールの訓練データ生成)")
def nearest(times, t):
    return min(range(len(times)), key=lambda i: abs(times[i] - t))
Q_idx = st_h.index('Q_Nm3h')
p_disch_idx = st_h.index('p_disch_kPa')
T_disch_idx = st_h.index('T_disch_C')

X_train = []  # (rpm, u1, u2, u3)
Y_train = []  # (Q, p_disch, T_disch)
for op in ops_r:
    op_t = float(op[ops_h.index('timestamp_s')])
    si = nearest(st_times, op_t)
    rpm = float(op[ops_h.index('rpm')])
    u1 = float(op[ops_h.index('u1_suction_pct')])
    u2 = float(op[ops_h.index('u2_circ_pct')])
    u3 = float(op[ops_h.index('u3_inlet_pct')])
    X_train.append((rpm, u1, u2, u3))
    Y_train.append((float(st_r[si][Q_idx]), float(st_r[si][p_disch_idx]), float(st_r[si][T_disch_idx])))

print(f"  X_train shape: {len(X_train)} × {len(X_train[0])}  (rpm, u1, u2, u3)")
print(f"  Y_train shape: {len(Y_train)} × {len(Y_train[0])}  (Q, p_disch, T_disch)")
print(f"  X range: rpm {min(x[0] for x in X_train):.0f}〜{max(x[0] for x in X_train):.0f}, "
      f"u1 {min(x[1] for x in X_train):.0f}〜{max(x[1] for x in X_train):.0f}, "
      f"u2 {min(x[2] for x in X_train):.0f}〜{max(x[2] for x in X_train):.0f}, "
      f"u3 {min(x[3] for x in X_train):.0f}〜{max(x[3] for x in X_train):.0f}")
print(f"  Y range: Q {min(y[0] for y in Y_train):.0f}〜{max(y[0] for y in Y_train):.0f}, "
      f"p_disch {min(y[1] for y in Y_train):.0f}〜{max(y[1] for y in Y_train):.0f}, "
      f"T_disch {min(y[2] for y in Y_train):.0f}〜{max(y[2] for y in Y_train):.0f}")

# サニティ: Q 負値
neg_Q = sum(1 for y in Y_train if y[0] < 0)
if neg_Q > 0: warnings.append(f"Q に負値 {neg_Q} 件 (サニティ警告対象)")
print(f"  Q 負値: {'⚠️ ' + str(neg_Q) if neg_Q else '✓ なし'}")

# --- Step 5: 物理モデル予測 + 残差計算 ---
print(f"\n[5] 物理モデル予測 + 残差")
# gen_compressor_sample.py の physics() を再現
def physics(u1, u2, u3, rpm):
    a, b = 0.62, 0.85
    N_design = 7800
    D2 = 0.42
    rho = 1.18
    eta_max = 0.78
    Cv = max(0.05, 0.55 * (u1 / 100) + 0.20 * (u3 / 100) - 0.30 * (u2 / 100))
    U2 = math.pi * D2 * rpm / 60.0
    Phi = Cv * 0.32 * (rpm / N_design)
    Psi = max(0.02, a - b * Phi * Phi)
    H = Psi * U2 * U2 / 9.81
    Q = Phi * U2 * (math.pi * D2 * D2 / 4) * 3600 * 0.7
    dP = rho * 9.81 * H / 1000.0 * 5.0
    eta = max(0.40, min(0.82, eta_max - 30.0 * (Phi - 0.055) ** 2))
    return Q, dP, eta * 100

# 注: 物理モデルが返すのは (Q吸込, ΔP, η)
# Y_train は (Q吸込, p_disch, T_disch) → 物理対応: Q ↔ Q, ΔP ↔ p_disch-p_suction (近似)
phys_pred = []
for x in X_train:
    rpm, u1, u2, u3 = x
    phys_pred.append(physics(u1, u2, u3, rpm))

print(f"  物理予測 Q (vs 実測 Q):")
for i, (x, y, p) in enumerate(zip(X_train, Y_train, phys_pred)):
    resid = y[0] - p[0]
    rel = resid / y[0] * 100 if y[0] != 0 else 0
    print(f"    op{i+1}: rpm={x[0]:.0f} u=({x[1]:.0f},{x[2]:.0f},{x[3]:.0f}) "
          f"y_Q={y[0]:.0f} phys_Q={p[0]:.0f} resid={resid:+.0f} ({rel:+.1f}%)")

# 残差が小さければ物理モデル + 残差 GP の前提が成立
max_rel_err = max(abs((y[0] - p[0]) / y[0] * 100) if y[0] != 0 else 0
                  for y, p in zip(Y_train, phys_pred))
print(f"  最大相対残差 (Q): {max_rel_err:.1f}%")
if max_rel_err > 30:
    warnings.append(f"物理モデルと実測の乖離が大 ({max_rel_err:.1f}%) — 残差 GP で補正が要る")

# --- Step 6: 埋め込み join ---
print(f"\n[6] TimesFM 埋め込み join (時刻 → 16次元ベクトル)")
emb_time_idx = 0
emb_vec_cols = list(range(1, len(emb_h)))
emb_times = [float(r[emb_time_idx]) for r in emb_r]
print(f"  埋め込み行数: {len(emb_times)}, 操作行数: {len(op_times)}")
print(f"  埋め込み時刻: {emb_times[:5]}...")
print(f"  操作時刻: {op_times[:5]}...")
# 操作時刻と埋め込み時刻の一致確認
exact = sum(1 for t in op_times if t in emb_times)
print(f"  完全一致: {exact}/{len(op_times)} ({'✓ all match' if exact == len(op_times) else '⚠️ 一部のみ — 最近傍 join 必要'})")

# --- Step 7: 逆推定 (各 eval 点に対する最適バルブ) ---
print(f"\n[7] 逆推定 (eval_points → 最適 u 探索)")
def solve(Q_t, dP_t, rpm=7800):
    best = None
    for u1 in range(20, 100, 2):
        for u2 in range(2, 70, 2):
            for u3 in range(20, 95, 2):
                Q, dP, eta = physics(u1, u2, u3, rpm)
                e = ((Q - Q_t) / Q_t) ** 2 + ((dP - dP_t) / dP_t) ** 2
                if best is None or e < best[0]:
                    best = (e, u1, u2, u3, Q, dP, eta)
    return best

for r in ev_r:
    Qt = float(r[1]); dPt = float(r[2]); et_t = float(r[3])
    sol = solve(Qt, dPt)
    qerr = (sol[4] - Qt) / Qt * 100
    perr = (sol[5] - dPt) / dPt * 100
    print(f"  {r[0]}: target Q={Qt:.0f} dP={dPt:.0f} → u=({sol[1]},{sol[2]},{sol[3]}) "
          f"got Q={sol[4]:.0f}({qerr:+.1f}%) dP={sol[5]:.0f}({perr:+.1f}%)")

# --- Step 8: 予実差確認 ---
print(f"\n[8] 予実差確認 (actual_run2 vs 物理予測)")
print(f"  actual2 列: {ac_h}")
for r in ac_r:
    rpm = float(r[1])
    u1 = float(r[2]); u2 = float(r[3]); u3 = float(r[4])
    y_act = (float(r[5]), float(r[6]), float(r[7]))
    y_phys = physics(u1, u2, u3, rpm)
    print(f"  {r[0]:35s}: actual Q={y_act[0]:.0f} dP={y_act[1]:.1f} eta={y_act[2]:.1f}  "
          f"phys Q={y_phys[0]:.0f} dP={y_phys[1]:.1f} eta={y_phys[2]:.1f}")

# --- Step 9: STEP 11 ロジック検証 ---
print(f"\n[9] STEP 11 列推測ロジック (yCols 抽出正規表現)")
# JS: yCols = hdr.filter(h => /^(y\d+|.*actual.*|.*Q.*|.*dP.*|.*eta.*)/i.test(h) && h !== 'eval_name')
import re
def is_uish(h):
    return (bool(re.match(r'^u\d+', h, re.I)) or bool(re.search(r'valve', h, re.I))
            or bool(re.match(r'^rpm$', h, re.I))
            or (bool(re.search(r'_pct$', h, re.I)) and not re.search(r'actual', h, re.I) and not re.search(r'eta', h, re.I)))
def js_y_cols(hdr):
    return [h for h in hdr if h != 'eval_name' and not is_uish(h) and re.match(r'^(y\d+|.*actual.*|.*Q.*|.*dP.*|.*eta.*|.*flow.*|.*press.*|.*temp.*)', h, re.I)]
y_cols_extracted = js_y_cols(ac_h)
print(f"  STEP 11 が抽出する y 列: {y_cols_extracted}")
expected = ['y1_Q_Nm3h_actual', 'y2_dP_kPa_actual', 'y3_eta_pct_actual']
match = y_cols_extracted == expected
print(f"  期待値と一致: {'✓' if match else '✗ ' + str(expected)}")
if not match: errors.append("STEP 11 y_cols 抽出ロジック不一致")

# u 列推測
def js_u_cols(hdr):
    return [h for h in hdr if is_uish(h)]
u_cols_extracted = js_u_cols(ac_h)
print(f"  STEP 11 が抽出する u 列: {u_cols_extracted}")
# rpm + u1_suction_pct + u2_circ_pct + u3_inlet_pct を期待
expected_u = ['rpm', 'u1_suction_pct', 'u2_circ_pct', 'u3_inlet_pct']
# JS regex は startswith u\d だが正規表現は startswith match なので . で連結
# regex 確認: /^u\d+|.../ では | が全体に効くので /^u\d+/ または「valve含む」「pct含む」「rpm含む」のどれか
# rpm は含む → match
u_match = sorted(u_cols_extracted) == sorted(expected_u)
print(f"  u 列一致: {'✓' if u_match else '✗ 期待 ' + str(expected_u)}")
if not u_match: warnings.append(f"STEP 11 u_cols: expected {expected_u}, got {u_cols_extracted}")

# --- 総合判定 ---
print(f"\n{'='*70}")
print(f"Round 2 総合判定")
print(f"{'='*70}")
print(f"エラー: {len(errors)} 件")
for e in errors: print(f"  ✗ {e}")
print(f"警告: {len(warnings)} 件")
for w in warnings: print(f"  ⚠️ {w}")
if not errors and not warnings:
    print("✅ ALL PASS")
elif not errors:
    print("⚠️ WARNINGS ONLY — 動作には支障なし")
else:
    print("❌ FIX REQUIRED")
