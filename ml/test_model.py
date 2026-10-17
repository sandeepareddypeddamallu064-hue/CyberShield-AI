from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR / "dataset"
    / "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv"
)

MODEL_PATH = BASE_DIR / "ml" / "models" / "cybershield_model.joblib"
FEATURE_PATH = BASE_DIR / "ml" / "models" / "feature_names.joblib"

model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURE_PATH)

df = pd.read_csv(DATASET_PATH, low_memory=False)
df.columns = df.columns.str.strip()

# Select 20 PortScan records
attack_rows = df[
    df["Label"].astype(str).str.strip().str.upper() == "PORTSCAN"
].head(20).copy()

if attack_rows.empty:
    raise SystemExit("No PortScan records found.")

actual = attack_rows["Label"].astype(str).str.strip()

X = attack_rows.drop(columns=["Label", "Target"], errors="ignore")
X = X.apply(pd.to_numeric, errors="coerce")
X = X.replace([float("inf"), float("-inf")], float("nan"))
X = X.fillna(0)
X = X.reindex(columns=feature_names, fill_value=0)

predictions = pd.Series(model.predict(X), index=attack_rows.index)

# Training converted every non-BENIGN label to ATTACK
expected = actual.apply(
    lambda label: "BENIGN" if label.upper() == "BENIGN" else "ATTACK"
)

correct = (predictions.str.upper() == expected.str.upper()).sum()

print("\n===== PORTSCAN MODEL TEST =====")
print("PortScan records tested:", len(attack_rows))
print("Correct predictions:", correct)
print("Incorrect predictions:", len(attack_rows) - correct)
print("Accuracy on these 20 samples:", round(correct / len(attack_rows) * 100, 2), "%")

print("\nActual labels:", expected.unique().tolist())
print("Predicted labels:", predictions.unique().tolist())

print("\nConfusion matrix:")
print(confusion_matrix(expected, predictions, labels=["ATTACK", "BENIGN"]))

print("\nClassification report:")
print(
    classification_report(
        expected,
        predictions,
        labels=["ATTACK", "BENIGN"],
        zero_division=0,
    )
)