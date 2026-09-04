# Recovery Prediction Model Evaluation

**Model:** Random Forest

**Evaluation Date:** 2026-09-04 19:29:24

**Test Dataset:** `payment_failures_test.csv`

## Performance Metrics

| Metric | Value |
|--------|-------|
| Accuracy | 0.6500 (65.00%) |
| Precision | 0.6744 (67.44%) |
| Recall | 0.8056 (80.56%) |
| F1-Score | 0.7342 |
| ROC-AUC | 0.6895 |

## Confusion Matrix

|  | Predicted Not Recovered | Predicted Recovered |
|---|---|---|
| **Actual Not Recovered** | 20 | 28 |
| **Actual Recovered** | 14 | 58 |

## Interpretation

- **True Positives (58)**: Correctly predicted recoverable payments
- **True Negatives (20)**: Correctly predicted non-recoverable payments
- **False Positives (28)**: Incorrectly predicted as recoverable (wasted effort)
- **False Negatives (14)**: Missed recoverable payments (lost opportunity)

## Model Quality Assessment

[NEEDS IMPROVEMENT] - Consider feature engineering or additional training data.

**Recommendation:** High recall means low false negatives - good for maximizing revenue capture.
