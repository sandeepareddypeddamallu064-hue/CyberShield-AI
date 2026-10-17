import os
import glob
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "ml", "models")

os.makedirs(MODEL_DIR, exist_ok=True)

# Find the CSV dataset
csv_files = glob.glob(os.path.join(DATASET_DIR, "*.csv"))

if not csv_files:
    raise FileNotFoundError(
        f"No CSV file found in: {DATASET_DIR}"
    )

csv_path = csv_files[0]

print("Loading dataset:", os.path.basename(csv_path))

# Read dataset
df = pd.read_csv(csv_path, low_memory=False)

# Normalize column names
df.columns = df.columns.str.strip()

# Identify target column
if "Label" not in df.columns:
    raise ValueError("The dataset does not contain a Label column.")

# Clean labels
df["Label"] = df["Label"].astype(str).str.strip()

# Convert labels into two classes:
# BENIGN = normal traffic; all other labels = attack traffic
df = df[df["Label"].ne("")].copy()
df["Target"] = df["Label"].apply(
    lambda label: "BENIGN" if label.upper() == "BENIGN" else "ATTACK"
)

# Prepare features
X = df.drop(columns=["Label", "Target"])
X = X.apply(pd.to_numeric, errors="coerce")
X = X.replace([float("inf"), float("-inf")], float("nan"))

# Fill missing values using column medians
X = X.fillna(X.median()).fillna(0)

# Remove constant columns
X = X.loc[:, X.nunique(dropna=False) > 1]

y = df["Target"]

if y.nunique() < 2:
    raise ValueError(
        "Dataset must contain both BENIGN and ATTACK rows."
    )

print("\nDataset shape:", X.shape)
print("\nClass distribution:")
print(y.value_counts())

# Split data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

# Train Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1,
)

print("\nTraining Random Forest model...")
model.fit(X_train, y_train)

# Evaluate model
predictions = model.predict(X_test)

print("\nAccuracy:", round(accuracy_score(y_test, predictions), 4))
print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

print("\nConfusion matrix:")
print(confusion_matrix(y_test, predictions))

# Save model and feature names
model_path = os.path.join(MODEL_DIR, "cybershield_model.joblib")
features_path = os.path.join(MODEL_DIR, "feature_names.joblib")

joblib.dump(model, model_path)
joblib.dump(list(X.columns), features_path)

print("\nModel saved to:", model_path)
print("Feature names saved to:", features_path)
print("\nTraining completed successfully!")