"""
Rebuild the exact pipeline from dga_composite_score.ipynb (cells 3,5,6,8,11) and export:
- webapp_artifacts/dataset.json  -- full computed dataframe (161 rows), for the static dashboard
- webapp_artifacts/isolation_forest.onnx -- trained model, for live scoring in the browser
- webapp_artifacts/tables.json -- IEEE Table 1-4 thresholds, for the TypeScript rule-engine port
Also verifies onnxruntime output matches sklearn's decision_function on the training data.
"""
import json
import ast

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

with open("dga_composite_score.ipynb", encoding="utf-8") as f:
    nb = json.load(f)

# --- pull raw_rows straight out of the (already verified) notebook cell 3 ---
src3 = "".join(nb["cells"][3]["source"])
start = src3.index("raw_rows = [")
block = src3[start:]
block = block[block.index("["):]
depth = 0
for i, ch in enumerate(block):
    if ch == "[":
        depth += 1
    elif ch == "]":
        depth -= 1
        if depth == 0:
            block = block[: i + 1]
            break
raw_rows = ast.literal_eval(block)

columns = [
    "asset_id", "manufacture_year", "sample_date",
    "h2", "ch4", "c2h6", "c2h4", "c2h2", "co", "co2", "o2", "n2",
    "lab_status", "lab_fault_type",
]
df = pd.DataFrame(raw_rows, columns=columns)
df["sample_date"] = pd.to_datetime(df["sample_date"])
df = df.sort_values(["asset_id", "sample_date"]).reset_index(drop=True)

GAS_COLS = ["h2", "ch4", "c2h6", "c2h4", "c2h2", "co", "co2"]


def age_bucket(age_years):
    if pd.isna(age_years):
        return "unknown"
    if age_years < 1:
        return "unknown"
    if age_years <= 9:
        return "1-9"
    if age_years <= 30:
        return "10-30"
    return ">30"


def o2n2_class(o2, n2):
    if n2 == 0 or pd.isna(n2):
        return "low"
    ratio = o2 / n2
    return "low" if ratio <= 0.2 else "high"


TABLE1 = {
    ("low", "unknown"): dict(h2=80, ch4=90, c2h6=90, c2h4=50, c2h2=1, co=900, co2=9000),
    ("low", "1-9"):     dict(h2=75, ch4=45, c2h6=30, c2h4=20, c2h2=1, co=900, co2=5000),
    ("low", "10-30"):   dict(h2=75, ch4=90, c2h6=90, c2h4=50, c2h2=1, co=900, co2=10000),
    ("low", ">30"):     dict(h2=100, ch4=110, c2h6=150, c2h4=90, c2h2=1, co=900, co2=10000),
    ("high", "unknown"): dict(h2=40, ch4=20, c2h6=15, c2h4=50, c2h2=2, co=500, co2=5000),
    ("high", "1-9"):     dict(h2=40, ch4=20, c2h6=15, c2h4=25, c2h2=2, co=500, co2=3500),
    ("high", "10-30"):   dict(h2=40, ch4=20, c2h6=15, c2h4=60, c2h2=2, co=500, co2=5500),
    ("high", ">30"):     dict(h2=40, ch4=20, c2h6=15, c2h4=60, c2h2=2, co=500, co2=5500),
}
TABLE2 = {
    ("low", "unknown"): dict(h2=200, ch4=150, c2h6=175, c2h4=100, c2h2=2, co=1100, co2=12500),
    ("low", "1-9"):     dict(h2=200, ch4=100, c2h6=70, c2h4=40, c2h2=2, co=1100, co2=7000),
    ("low", "10-30"):   dict(h2=200, ch4=150, c2h6=175, c2h4=95, c2h2=2, co=1100, co2=14000),
    ("low", ">30"):     dict(h2=200, ch4=200, c2h6=250, c2h4=175, c2h2=4, co=1100, co2=14000),
    ("high", "unknown"): dict(h2=90, ch4=50, c2h6=40, c2h4=100, c2h2=7, co=600, co2=7000),
    ("high", "1-9"):     dict(h2=90, ch4=60, c2h6=30, c2h4=80, c2h2=7, co=600, co2=5000),
    ("high", "10-30"):   dict(h2=90, ch4=90, c2h6=40, c2h4=125, c2h2=7, co=600, co2=8000),
    ("high", ">30"):     dict(h2=90, ch4=90, c2h6=40, c2h4=125, c2h2=7, co=600, co2=8000),
}
TABLE3_DELTA = {
    "low": dict(h2=40, ch4=30, c2h6=25, c2h4=20, c2h2=0, co=250, co2=2500),
    "high": dict(h2=25, ch4=10, c2h6=7, c2h4=20, c2h2=0, co=175, co2=1750),
}
TABLE4_RATE = {
    "low": dict(h2=50, ch4=15, c2h6=15, c2h4=10, c2h2=0, co=200, co2=1750),
    "high": dict(h2=25, ch4=4, c2h6=3, c2h4=7, c2h2=0, co=100, co2=1000),
}


def evaluate_dga(row, table1, table2, delta, rate):
    exceeds_table2 = any(row[g] > table2[g] for g in GAS_COLS)
    exceeds_table1 = any(row[g] > table1[g] for g in GAS_COLS)
    delta_exceeds = any(row.get(f"delta_{g}", 0) is not None and abs(row.get(f"delta_{g}", 0)) > delta[g] for g in GAS_COLS)
    rate_exceeds = any(row.get(f"rate_{g}", 0) is not None and abs(row.get(f"rate_{g}", 0)) > rate[g] for g in GAS_COLS)
    if exceeds_table2 or rate_exceeds:
        return 3
    if exceeds_table1 or delta_exceeds:
        return 2
    return 1


def infer_fault_type(row, table2):
    if row["h2"] > table2["h2"]:
        return "Partial Discharge"
    if row["co"] > table2["co"] or row["co2"] > table2["co2"]:
        return "Thermal Cellulose"
    if any(row[g] > table2[g] for g in ["ch4", "c2h6", "c2h4"]):
        return "Thermal Fault (Oil)"
    if any(row[g] > TABLE1[(o2n2_class(row['o2'], row['n2']), age_bucket(row['age']))][g] for g in GAS_COLS):
        return "Stray Gassing"
    return "Normal"


df["age"] = df["sample_date"].dt.year - df["manufacture_year"]
df["o2n2_class"] = df.apply(lambda r: o2n2_class(r["o2"], r["n2"]), axis=1)
df["age_bucket"] = df["age"].apply(age_bucket)

for g in GAS_COLS:
    df[f"delta_{g}"] = df.groupby("asset_id")[g].diff()

results = []
for _, row in df.iterrows():
    key = (row["o2n2_class"], row["age_bucket"])
    t1, t2 = TABLE1[key], TABLE2[key]
    d, r = TABLE3_DELTA[row["o2n2_class"]], TABLE4_RATE[row["o2n2_class"]]
    status = evaluate_dga(row, t1, t2, d, r)
    fault = infer_fault_type(row, t2)
    results.append((status, fault))
df["rule_status"], df["rule_fault_type"] = zip(*results)
df["status_match"] = df["rule_status"] == df["lab_status"]


def moving_average(series, window=3):
    return series.rolling(window=window, min_periods=1).mean()


for g in GAS_COLS:
    df[f"ma_{g}"] = df.groupby("asset_id")[g].transform(lambda s: moving_average(s))
    df[f"worsening_{g}"] = df.apply(
        lambda r: (r[f"delta_{g}"] is not None and not pd.isna(r[f"delta_{g}"])
                   and r[f"delta_{g}"] > TABLE3_DELTA[r["o2n2_class"]][g] * 0.3),
        axis=1,
    )
worsening_cols = [f"worsening_{g}" for g in GAS_COLS]
df["n_gas_worsening"] = df[worsening_cols].sum(axis=1)

pd_raw = pd.read_csv("simulated_pd_data.csv", sep=";")
pd_raw["measured_at"] = pd.to_datetime(pd_raw["measured_at"])
SEV_RANK = {"Normal": 0, "Watch": 1, "Warning": 2, "Critical": 3}
pd_meas = (
    pd_raw.groupby(["asset_id", "measured_at"])
    .agg(pd_value_max=("value", "max"), pd_overall_severity=("overall_severity", "first"))
    .reset_index()
    .sort_values(["asset_id", "measured_at"])
)
pd_meas["pd_severity_rank"] = pd_meas["pd_overall_severity"].map(SEV_RANK)
pd_meas["delta_pd_value"] = pd_meas.groupby("asset_id")["pd_value_max"].diff()
pd_meas["delta_pd_severity_rank"] = pd_meas.groupby("asset_id")["pd_severity_rank"].diff()
PD_THRESH_WATCH = pd_raw["threshold_watch"].iloc[0]
pd_meas["pd_worsening"] = (
    (pd_meas["delta_pd_severity_rank"] > 0) | (pd_meas["delta_pd_value"] > PD_THRESH_WATCH * 0.3)
).fillna(False)

df = df.merge(
    pd_meas[["asset_id", "measured_at", "pd_value_max", "pd_overall_severity", "pd_worsening"]],
    left_on=["asset_id", "sample_date"], right_on=["asset_id", "measured_at"], how="left",
).drop(columns=["measured_at"])
df["pd_worsening"] = df["pd_worsening"].fillna(False).astype(int)
df["n_parameters_worsening"] = df["n_gas_worsening"] + df["pd_worsening"]

FAULT_SEVERITY_RANK = {
    "Normal": 0,
    "Stray Gassing": 1,
    "Thermal Fault (Oil)": 1,
    "Thermal Cellulose": 2,
    "Partial Discharge": 3,
}
df["rule_fault_severity"] = df["rule_fault_type"].map(FAULT_SEVERITY_RANK)

feature_cols = (
    [f"delta_{g}" for g in GAS_COLS]
    + ["rule_status", "n_gas_worsening", "n_parameters_worsening", "rule_fault_severity"]
)
X = df[feature_cols].fillna(0)

model = IsolationForest(n_estimators=200, contamination="auto", random_state=42)
df["anomaly_score"] = model.fit_predict(X)
df["anomaly_score_raw"] = model.decision_function(X)

print("feature_cols order:", feature_cols)
print(f"{df['asset_id'].nunique()} aset, {len(df)} baris -- rebuilt OK")
print(f"status_match: {df['status_match'].mean():.0%}")

# --- export dataset.json for the static dashboard ---
export_cols = [
    "asset_id", "sample_date", "manufacture_year", "age",
    *GAS_COLS, "o2", "n2", "o2n2_class", "age_bucket",
    *[f"delta_{g}" for g in GAS_COLS],
    "rule_status", "rule_fault_type", "rule_fault_severity",
    "lab_status", "lab_fault_type", "status_match",
    "n_gas_worsening", "pd_worsening", "n_parameters_worsening",
    "anomaly_score", "anomaly_score_raw",
]
out_df = df[export_cols].copy()
out_df["sample_date"] = out_df["sample_date"].dt.strftime("%Y-%m-%d")
out_df = out_df.where(pd.notnull(out_df), None)
records = json.loads(out_df.to_json(orient="records"))

import os
os.makedirs("webapp_artifacts", exist_ok=True)
with open("webapp_artifacts/dataset.json", "w", encoding="utf-8") as f:
    json.dump({"feature_cols": feature_cols, "rows": records}, f, ensure_ascii=False, indent=1)

with open("webapp_artifacts/tables.json", "w", encoding="utf-8") as f:
    json.dump({
        "gasCols": GAS_COLS,
        "table1": {f"{k[0]}|{k[1]}": v for k, v in TABLE1.items()},
        "table2": {f"{k[0]}|{k[1]}": v for k, v in TABLE2.items()},
        "table3Delta": TABLE3_DELTA,
        "table4Rate": TABLE4_RATE,
        "faultSeverityRank": FAULT_SEVERITY_RANK,
    }, f, ensure_ascii=False, indent=1)

# --- export ONNX model ---
from skl2onnx import to_onnx

onnx_model = to_onnx(
    model, X.to_numpy().astype(np.float32),
    target_opset={"": 15, "ai.onnx.ml": 3},
)
with open("webapp_artifacts/isolation_forest.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())

# --- verify onnx matches sklearn ---
import onnxruntime as ort

sess = ort.InferenceSession("webapp_artifacts/isolation_forest.onnx", providers=["CPUExecutionProvider"])
input_name = sess.get_inputs()[0].name
outputs = [o.name for o in sess.get_outputs()]
print("onnx outputs:", outputs)
Xf = X.to_numpy().astype(np.float32)
onnx_result = sess.run(None, {input_name: Xf})
sk_scores = model.decision_function(X)
# find the score-like output (float array of shape (n,) or (n,1))
score_out = None
for name, val in zip(outputs, onnx_result):
    arr = np.array(val).reshape(-1)
    if arr.shape[0] == len(X) and np.issubdtype(arr.dtype, np.floating):
        score_out = arr
        break
if score_out is not None:
    diff = np.abs(score_out - sk_scores)
    print(f"max abs diff onnx vs sklearn decision_function: {diff.max():.6f}")
else:
    print("WARNING: could not find matching float score output; outputs were:", [np.array(v).shape for v in onnx_result])

print("done")
