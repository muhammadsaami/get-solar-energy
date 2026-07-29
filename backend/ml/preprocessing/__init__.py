"""
backend/ml/preprocessing/__init__.py
====================================
GET Solar Energy — Preprocessing Package
Phase 13.0A

Compatibility imports for existing training code.
"""

from .common import (
    MONTH_MAP,
    extract_month_num,
    standardize_billing_period,
    calculate_solar_savings,
    remove_outliers_iqr,
    clean_numeric_column,
    validate_features,
    prepare_features,
    DataCleaner,
)

from .bill_features import (
    encode_city,
    add_month_features,
    add_solar_savings_target,
    engineer_bill_features,
    prepare_bill_features,
    prepare_savings_features,
    transform_bill_input,
    get_feature_names,
    get_all_cities,
    FEATURES_BILL,
    FEATURES_SAVINGS,
)

__all__ = [
    "MONTH_MAP",
    "extract_month_num",
    "standardize_billing_period",
    "calculate_solar_savings",
    "remove_outliers_iqr",
    "clean_numeric_column",
    "validate_features",
    "prepare_features",
    "DataCleaner",
    "encode_city",
    "add_month_features",
    "add_solar_savings_target",
    "engineer_bill_features",
    "prepare_bill_features",
    "prepare_savings_features",
    "transform_bill_input",
    "get_feature_names",
    "get_all_cities",
    "FEATURES_BILL",
    "FEATURES_SAVINGS",
]