from datetime import datetime, timezone
from pathlib import Path
import json
import sqlite3

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# --------------------------------------------------
# 1. APPLICATION SETUP
# --------------------------------------------------

app = FastAPI(
    title="CyberShield AI API",
    description="Security event monitoring and ML-based threat detection",
    version="1.2.1",
)


# --------------------------------------------------
# 2. CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://stately-pastelito-d53cf3.netlify.app",
        "https://shiny-sable-775251.netlify.app",
        "https://cybershield-ai-beats.netlify.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# 3. PROJECT PATHS AND DATABASE
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_PATH = MODEL_DIR / "cybershield_model.joblib"
FEATURE_PATH = MODEL_DIR / "feature_names.joblib"
DATABASE_PATH = BASE_DIR / "cybershield.db"


def initialize_database():
    """Create the prediction-history table if it does not exist."""

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction TEXT NOT NULL,
                is_attack INTEGER NOT NULL,
                confidence REAL NOT NULL,
                severity TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                model TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
            """
        )
        connection.commit()


initialize_database()
print(f"Prediction database ready: {DATABASE_PATH}")


# --------------------------------------------------
# 4. LOAD TRAINED MACHINE LEARNING MODEL
# --------------------------------------------------

model = None
feature_names = None

try:
    if MODEL_PATH.exists() and FEATURE_PATH.exists():
        model = joblib.load(MODEL_PATH)
        feature_names = joblib.load(FEATURE_PATH)

        print("Random Forest model loaded successfully!")

    else:
        print("WARNING: Trained model files were not found.")

except Exception as exc:
    print(f"WARNING: Could not load model: {exc}")


# --------------------------------------------------
# 5. HELPER FUNCTIONS
# --------------------------------------------------

def calculate_risk_score(severity: str) -> int:
    risk_scores = {
        "Critical": 95,
        "High": 80,
        "Medium": 55,
        "Low": 25,
    }

    return risk_scores.get(severity.capitalize(), 55)


def save_prediction(result: dict) -> int:
    """Save a successful model prediction and return its database ID."""

    with sqlite3.connect(DATABASE_PATH) as connection:
        cursor = connection.execute(
            """
            INSERT INTO predictions (
                prediction,
                is_attack,
                confidence,
                severity,
                risk_score,
                model,
                timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result["prediction"],
                int(result["is_attack"]),
                result["confidence"],
                result["severity"],
                result["risk_score"],
                result["model"],
                result["timestamp"],
            ),
        )

        connection.commit()

        return cursor.lastrowid


# --------------------------------------------------
# 6. REQUEST MODELS
# --------------------------------------------------

class SecurityEvent(BaseModel):
    event_type: str
    source_ip: str
    description: str
    severity: str = "Medium"


class PredictionRequest(BaseModel):
    features: dict[str, float]


# --------------------------------------------------
# 7. SECURITY EVENT STORAGE
# --------------------------------------------------

# Events reset when the backend restarts.
# Prediction history is stored in SQLite.

events = []


# --------------------------------------------------
# 8. BASIC ENDPOINTS
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "CyberShield AI backend is running!",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "database_path": str(DATABASE_PATH),
    }


# --------------------------------------------------
# 9. GET SECURITY EVENTS
# --------------------------------------------------

@app.get("/api/events")
def get_events():
    return {
        "total": len(events),
        "events": events,
    }


# --------------------------------------------------
# 10. CREATE SECURITY EVENT
# --------------------------------------------------

@app.post("/api/events")
def create_event(event: SecurityEvent):
    new_event = event.model_dump()

    new_event["id"] = len(events) + 1
    new_event["timestamp"] = datetime.now(timezone.utc).isoformat()
    new_event["risk_score"] = calculate_risk_score(
        new_event["severity"]
    )

    events.insert(0, new_event)

    return {
        "message": "Security event received",
        "event": new_event,
    }


# --------------------------------------------------
# 11. MACHINE LEARNING PREDICTION
# --------------------------------------------------

@app.post("/api/predict")
def predict_attack(request: PredictionRequest):

    if model is None or feature_names is None:
        raise HTTPException(
            status_code=503,
            detail="ML model is not loaded. Check the model files.",
        )

    missing_features = [
        name
        for name in feature_names
        if name not in request.features
    ]

    if missing_features:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Required features are missing.",
                "missing_features": missing_features,
                "required_feature_count": len(feature_names),
            },
        )

    try:
        input_data = pd.DataFrame(
            [
                [
                    request.features[name]
                    for name in feature_names
                ]
            ],
            columns=feature_names,
        )

        prediction = str(model.predict(input_data)[0])

        probabilities = model.predict_proba(input_data)[0]
        classes = list(model.classes_)

        confidence = float(
            probabilities[classes.index(prediction)]
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Prediction failed: {str(exc)}",
        )

    is_attack = prediction.upper() != "BENIGN"

    if is_attack:
        severity = "High"
        risk_score = 80
    else:
        severity = "Low"
        risk_score = 10

    result = {
        "prediction": prediction,
        "is_attack": is_attack,
        "confidence": round(confidence * 100, 2),
        "severity": severity,
        "risk_score": risk_score,
        "model": "Random Forest",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Save each successful prediction in SQLite.
    result["id"] = save_prediction(result)

    return result


# --------------------------------------------------
# 12. GET DATASET TEST PAYLOAD
# --------------------------------------------------

@app.get("/api/test-payload")
def get_test_payload():
    payload_path = BASE_DIR / "ml" / "api_test_payload.json"

    if not payload_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Test payload file not found.",
        )

    try:
        with open(payload_path, "r", encoding="utf-8") as file:
            return json.load(file)

    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read test payload: {str(exc)}",
        )


# --------------------------------------------------
# 13. GET PREDICTION HISTORY
# --------------------------------------------------

@app.get("/api/predictions")
def get_prediction_history(limit: int = 100):

    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 500.",
        )

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row

        rows = connection.execute(
            """
            SELECT
                id,
                prediction,
                is_attack,
                confidence,
                severity,
                risk_score,
                model,
                timestamp
            FROM predictions
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    predictions = []

    for row in rows:
        item = dict(row)
        item["is_attack"] = bool(item["is_attack"])
        predictions.append(item)

    return {
        "total": len(predictions),
        "predictions": predictions,
    }