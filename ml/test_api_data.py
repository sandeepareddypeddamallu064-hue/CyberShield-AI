from pathlib import Path
import json
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "dataset"
    / "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv"
)

MODEL_PATH = BASE_DIR / "ml" / "models" / "cybershield_model.joblib"
FEATURE_PATH = BASE_DIR / "ml" / "models" / "feature_names.joblib"

# Load the model's exact feature list
feature_names = joblib.load(FEATURE_PATH)

# Load an actual PortScan record
df = pd.read_csv(DATASET_PATH, low_memory=False)
df.columns = df.columns.str.strip()

attack_rows = df[
    df["Label"].astype(str).str.strip().str.upper() == "PORTSCAN"
]

sample = attack_rows.iloc[0]

# Select only the features used during training
features = sample.drop(labels=["Label", "Target"], errors="ignore")
features = pd.to_numeric(features, errors="coerce")
features = features.replace([float("inf"), float("-inf")], float("nan"))
features = features.fillna(0)

# Match the exact 68 feature names and their order
features = features.reindex(feature_names, fill_value=0)

payload = {
    "features": {
        name: float(value)
        for name, value in features.items()
    }
}

output_path = BASE_DIR / "ml" / "api_test_payload.json"

with open(output_path, "w", encoding="utf-8") as file:
    json.dump(payload, file, indent=2)

print("Payload created:", output_path)
print("Feature count:", len(payload["features"]))
print("Actual dataset label:", sample["Label"])