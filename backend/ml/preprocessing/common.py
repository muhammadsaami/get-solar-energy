"""
backend/ml/preprocessing/common.py
===================================
GET Solar Energy — Common Preprocessing Utilities
Phase 13.0A

Reusable preprocessing functions extracted from existing implementation.
Compatible with existing train_models.py and preprocessing.py.
"""

import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Any


MONTH_MAP: Dict[str, int] = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
    "MAY": 5, "JUN": 6, "JUL": 7, "AUG": 8,
    "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12
}


def extract_month_num(billing_period: Any) -> int:
    if pd.isna(billing_period):
        return 0
    period_str = str(billing_period).strip()[:3].upper()
    return MONTH_MAP.get(period_str, 0)


def standardize_billing_period(period: Any) -> str:
    if pd.isna(period):
        return ""
    period = str(period).strip().upper()
    full_to_short = {
        "JANUARY": "JAN", "FEBRUARY": "FEB", "MARCH": "MAR",
        "APRIL": "APR", "MAY": "MAY", "JUNE": "JUN",
        "JULY": "JUL", "AUGUST": "AUG", "SEPTEMBER": "SEP",
        "OCTOBER": "OCT", "NOVEMBER": "NOV", "DECEMBER": "DEC"
    }
    for full, short in full_to_short.items():
        period = period.replace(full, short)
    return period


def calculate_solar_savings(monthly_units: float, per_unit_rate: float, efficiency: float = 0.8) -> float:
    return monthly_units * per_unit_rate * efficiency


def remove_outliers_iqr(df: pd.DataFrame, column: str, factor: float = 1.5) -> pd.DataFrame:
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - factor * IQR
    upper = Q3 + factor * IQR
    return df[(df[column] >= lower) & (df[column] <= upper)]


def clean_numeric_column(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").fillna(0)


def validate_features(df: pd.DataFrame, required_features: List[str]) -> bool:
    return all(f in df.columns for f in required_features)


def prepare_features(df: pd.DataFrame, features: List[str]) -> pd.DataFrame:
    if not validate_features(df, features):
        missing = [f for f in features if f not in df.columns]
        raise ValueError(f"Missing features: {missing}")
    return df[features].copy()


class DataCleaner:
    def __init__(self, max_units: float = 2000, max_bill: float = 50000, min_rate: float = 1.0, max_rate: float = 20.0):
        self.max_units = max_units
        self.max_bill = max_bill
        self.min_rate = min_rate
        self.max_rate = max_rate

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        before = len(df)
        df = df[(df["monthly_units"] > 0) & (df["bill_amount"] > 0)]
        df = df[df["monthly_units"] <= self.max_units]
        df = df[df["bill_amount"] <= self.max_bill]
        df = df[df["per_unit_rate"] >= self.min_rate]
        df = df[df["per_unit_rate"] <= self.max_rate]
        after = len(df)
        return df