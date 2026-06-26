import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

# ── Paths ──────────────────────────────────────────────
INPUT_FILE   = "../ml-models/bills_cleaned.csv"
MODELS_FOLDER = "../ml-models"

# ── 1. Load cleaned data ───────────────────────────────
df = pd.read_csv(INPUT_FILE)
print(f"✅ Loaded: {len(df)} rows\n")

# ── 2. Feature Engineering ─────────────────────────────
# Encode city
le_city = LabelEncoder()
df["city_encoded"] = le_city.fit_transform(df["city"])

# Extract month number from billing period
month_map = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
    "MAY": 5, "JUN": 6, "JUL": 7, "AUG": 8,
    "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12
}
df["month_num"] = df["billing_period"].apply(
    lambda x: month_map.get(str(x).strip()[:3].upper(), 0)
)

# Solar savings target
df["solar_savings"] = df["monthly_units"] * df["per_unit_rate"] * 0.8

print("✅ Features engineered")
print(f"   Columns: {list(df.columns)}\n")

# ── 3. Define Features ─────────────────────────────────
FEATURES = ["monthly_units", "city_encoded", "month_num", "per_unit_rate"]

X_bill     = df[FEATURES]
y_bill     = df["bill_amount"]

X_savings  = df[FEATURES]
y_savings  = df["solar_savings"]

print(f"✅ Features: {FEATURES}")
print(f"   Samples : {len(df)}\n")

# ── 4. Train/Test Split ────────────────────────────────
# Note: with small dataset use cross validation
if len(df) >= 10:
    X_bill_train, X_bill_test, y_bill_train, y_bill_test = train_test_split(
        X_bill, y_bill, test_size=0.2, random_state=42
    )
    X_sav_train, X_sav_test, y_sav_train, y_sav_test = train_test_split(
        X_savings, y_savings, test_size=0.2, random_state=42
    )
else:
    X_bill_train = X_bill_test = X_bill
    y_bill_train = y_bill_test = y_bill
    X_sav_train = X_sav_test = X_savings
    y_sav_train = y_sav_test = y_savings

print(f"✅ Train/Test split: {len(X_bill_train)} train, {len(X_bill_test)} test\n")

# ── 5. Model 1 — Bill Amount Prediction ───────────────
print("=" * 50)
print("MODEL 1 — Bill Amount Prediction")
print("=" * 50)

bill_model = RandomForestRegressor(n_estimators=100, random_state=42)
bill_model.fit(X_bill_train, y_bill_train)

y_pred_bill = bill_model.predict(X_bill_test)
mae_bill    = mean_absolute_error(y_bill_test, y_pred_bill)
r2_bill     = r2_score(y_bill_test, y_pred_bill)

print(f"✅ Random Forest trained")
print(f"   MAE : ₹{mae_bill:.2f}")
print(f"   R²  : {r2_bill:.4f} ({r2_bill*100:.1f}% accuracy)")

# Cross validation score
cv_scores = cross_val_score(bill_model, X_bill, y_bill, cv=min(5, len(df)), scoring="r2")
print(f"   CV R² scores : {[round(s, 3) for s in cv_scores]}")
print(f"   Mean CV R²   : {cv_scores.mean():.4f}\n")

# ── 6. Model 2 — Solar Savings Prediction ─────────────
print("=" * 50)
print("MODEL 2 — Solar Savings Prediction")
print("=" * 50)

savings_model = RandomForestRegressor(n_estimators=100, random_state=42)
savings_model.fit(X_sav_train, y_sav_train)

y_pred_sav = savings_model.predict(X_sav_test)
mae_sav    = mean_absolute_error(y_sav_test, y_pred_sav)
r2_sav     = r2_score(y_sav_test, y_pred_sav)

print(f"✅ Random Forest trained")
print(f"   MAE : ₹{mae_sav:.2f}")
print(f"   R²  : {r2_sav:.4f} ({r2_sav*100:.1f}% accuracy)")

cv_scores_sav = cross_val_score(savings_model, X_savings, y_savings, cv=min(5, len(df)), scoring="r2")
print(f"   CV R² scores : {[round(s, 3) for s in cv_scores_sav]}")
print(f"   Mean CV R²   : {cv_scores_sav.mean():.4f}\n")

# ── 7. Save Models ─────────────────────────────────────
bill_model_path    = os.path.join(MODELS_FOLDER, "bill_model.pkl")
savings_model_path = os.path.join(MODELS_FOLDER, "savings_model.pkl")
encoder_path       = os.path.join(MODELS_FOLDER, "city_encoder.pkl")

with open(bill_model_path, "wb") as f:
    pickle.dump(bill_model, f)

with open(savings_model_path, "wb") as f:
    pickle.dump(savings_model, f)

with open(encoder_path, "wb") as f:
    pickle.dump(le_city, f)

print(f"✅ Models saved:")
print(f"   {bill_model_path}")
print(f"   {savings_model_path}")
print(f"   {encoder_path}")

# ── 8. Test Prediction ─────────────────────────────────
print("\n" + "=" * 50)
print("TEST PREDICTION")
print("=" * 50)

sample = pd.DataFrame([{
    "monthly_units"  : 300,
    "city_encoded"   : 0,
    "month_num"      : 5,
    "per_unit_rate"  : 7.0
}])

predicted_bill    = bill_model.predict(sample)[0]
predicted_savings = savings_model.predict(sample)[0]

print(f"Input  : 300 units, May, ₹7/unit, Lucknow")
print(f"Predicted Bill    : ₹{predicted_bill:.0f}")
print(f"Predicted Savings : ₹{predicted_savings:.0f}/month")
print(f"\n🎉 Task 4 Complete — Models ready!")