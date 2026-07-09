"""
backend/ml/preprocessing/bill_features.py
==========================================
GET Solar Energy — Bill Feature Engineering
Phase 13.0A

Feature engineering specific to electricity bill prediction.
Compatible with existing train_models.py implementation.
"""

import pandas as pd
import numpy as np
from typing import Optional, List
from sklearn.preprocessing import LabelEncoder

from .common import (
    extract_month_num,
    standardize_billing_period,
    calculate_solar_savings,
    MONTH_MAP,
    FEATURES_BILL,
    FEATURES_SAVINGS,
)


def encode_city(df: pd.DataFrame, city_column: str = "city", encoder: Optional[LabelEncoder] = None):
    if encoder is None:
        encoder = LabelEncoder()
        df["city_encoded"] = encoder.fit_transform(df[city_column])
    else:
        df["city_encoded"] = encoder.transform(df[city_column])
    return df, encoder


def add_month_features(df: pd.DataFrame, period_column: str = "billing_period") -> pd.DataFrame:
    df["month_num"] = df[period_column].apply(extract_month_num)
    return df


def add_solar_savings_target(df: pd.DataFrame, units_column: str = "monthly_units", rate_column: str = "per_unit_rate") -> pd.DataFrame:
    df["solar_savings"] = calculate_solar_savings(
        df[units_column].values,
        df[rate_column].values
    )
    return df


def engineer_bill_features(df: pd.DataFrame, city_encoder: Optional[LabelEncoder] = None) -> tuple:
    df = df.copy()
    df, city_encoder = encode_city(df, encoder=city_encoder)
    df = add_month_features(df)
    df = add_solar_savings_target(df)
    return df, city_encoder


def prepare_bill_features(df: pd.DataFrame) -> pd.DataFrame:
    return df[FEATURES_BILL].copy()


def prepare_savings_features(df: pd.DataFrame) -> pd.DataFrame:
    return df[FEATURES_SAVINGS].copy()


def transform_bill_input(
    monthly_units: float,
    city: str,
    billing_period: str,
    per_unit_rate: float,
    city_encoder: LabelEncoder
) -> dict:
    city_encoded = city_encoder.transform([city])[0] if city in city_encoder.classes_ else 0
    month_num = extract_month_num(billing_period)

    return {
        "monthly_units": monthly_units,
        "city_encoded": city_encoded,
        "month_num": month_num,
        "per_unit_rate": per_unit_rate,
    }


def get_feature_names() -> dict:
    return {
        "bill": FEATURES_BILL.copy(),
        "savings": FEATURES_SAVINGS.copy(),
    }


def get_all_cities(df: pd.DataFrame, city_column: str = "city") -> List[str]:
    return sorted(df[city_column].unique().tolist())