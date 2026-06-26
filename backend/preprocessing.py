import pandas as pd
import numpy as np
import os

# ── Paths ──────────────────────────────────────────────
INPUT_FILE  = "../ml-models/bills_dataset.xlsx"
OUTPUT_FILE = "../ml-models/bills_cleaned.csv"
CITY_FOLDER = "../ml-models/city_csvs"

os.makedirs(CITY_FOLDER, exist_ok=True)

# ── 1. Load ────────────────────────────────────────────
df = pd.read_excel(INPUT_FILE)
print(f"✅ Loaded: {len(df)} rows, {len(df.columns)} columns")
print(f"Columns: {list(df.columns)}\n")

# ── 2. Rename columns for easier handling ─────────────
df.columns = [
    "file", "customer_name", "consumer_number", "discom",
    "city", "monthly_units", "bill_amount", "per_unit_rate",
    "billing_period", "recommended_kw", "monthly_savings",
    "system_cost", "payback_years", "savings_25yr"
]

# ── 3. Drop missing values ─────────────────────────────
before = len(df)
df.dropna(subset=["monthly_units", "bill_amount", "city", "billing_period"], inplace=True)
after = len(df)
print(f"✅ Removed missing values: {before - after} rows dropped")
print(f"   Remaining: {after} rows\n")

# ── 4. Remove zero/negative units and amounts ──────────
before = len(df)
df = df[(df["monthly_units"] > 0) & (df["bill_amount"] > 0)]
after = len(df)
print(f"✅ Removed zero/negative values: {before - after} rows dropped")
print(f"   Remaining: {after} rows\n")

# ── 5. Remove outliers using IQR ───────────────────────
def remove_outliers(df, column):
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    before = len(df)
    df_clean = df[(df[column] >= lower) & (df[column] <= upper)]
    after = len(df_clean)
    if before - after > 0:
        print(f"   {column}: removed {before - after} outliers (range: {lower:.1f} - {upper:.1f})")
    return df_clean

print("✅ Removing outliers (manual thresholds for small dataset):")
before = len(df)
df = df[df["monthly_units"] <= 2000]   # max realistic monthly units
df = df[df["bill_amount"] <= 50000]     # max realistic bill amount
df = df[df["per_unit_rate"] >= 1.0]     # min realistic rate
df = df[df["per_unit_rate"] <= 20.0]    # max realistic rate
after = len(df)
print(f"   Removed {before - after} outliers")
print(f"   Remaining: {after} rows\n")

# ── 6. Standardize billing period ─────────────────────
def standardize_period(period):
    if pd.isna(period):
        return period
    period = str(period).strip().upper()
    month_map = {
        "JANUARY": "JAN", "FEBRUARY": "FEB", "MARCH": "MAR",
        "APRIL": "APR", "MAY": "MAY", "JUNE": "JUN",
        "JULY": "JUL", "AUGUST": "AUG", "SEPTEMBER": "SEP",
        "OCTOBER": "OCT", "NOVEMBER": "NOV", "DECEMBER": "DEC"
    }
    for full, short in month_map.items():
        period = period.replace(full, short)
    return period

df["billing_period"] = df["billing_period"].apply(standardize_period)
print(f"✅ Standardized billing periods")
print(f"   Unique periods: {sorted(df['billing_period'].unique())}\n")

# ── 7. Standardize consumer number format ─────────────
df["consumer_number"] = df["consumer_number"].astype(str).str.replace("-", "").str.strip()
print(f"✅ Standardized consumer numbers\n")

# ── 8. Add calculated columns ─────────────────────────
df["per_unit_rate"] = (df["bill_amount"] / df["monthly_units"]).round(2)
print(f"✅ Recalculated per unit rate\n")

# ── 9. Save cleaned dataset ───────────────────────────
df.to_csv(OUTPUT_FILE, index=False)
print(f"✅ Saved cleaned dataset: {OUTPUT_FILE}")
print(f"   Total clean rows: {len(df)}\n")

# ── 10. Save separate CSV per city ────────────────────
print("✅ Saving city-wise CSVs:")
for city, group in df.groupby("city"):
    city_file = os.path.join(CITY_FOLDER, f"{city}_bills.csv")
    group.to_csv(city_file, index=False)
    print(f"   {city}: {len(group)} bills → {city_file}")

print("\n🎉 Preprocessing pipeline complete!")
print(f"   Clean dataset : {OUTPUT_FILE}")
print(f"   City CSVs     : {CITY_FOLDER}/")

# ── 11. Summary stats ─────────────────────────────────
print("\n📊 Dataset Summary:")
print(f"   Total bills       : {len(df)}")
print(f"   Avg monthly units : {df['monthly_units'].mean():.1f} KWH")
print(f"   Avg bill amount   : ₹{df['bill_amount'].mean():.0f}")
print(f"   Avg per unit rate : ₹{df['per_unit_rate'].mean():.2f}")
print(f"   Cities            : {df['city'].unique().tolist()}")
print(f"   Billing periods   : {len(df['billing_period'].unique())} unique months")