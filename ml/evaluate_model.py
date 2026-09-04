"""
Model Evaluation on Held-Out Test Set
Generates final performance metrics for the recovery prediction model
"""

import pandas as pd
import pickle
import json
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, f1_score,
    precision_score, recall_score
)

def load_model():
    """Load trained model"""
    print("Loading trained model...")
    with open('ml/models/recovery_model.pkl', 'rb') as f:
        artifacts = pickle.load(f)
    return artifacts

def load_test_data():
    """Load held-out test set"""
    print("Loading test dataset...")
    test_df = pd.read_csv('ml/data/payment_failures_test.csv')
    print(f"Test set: {len(test_df)} records")
    return test_df

def prepare_test_features(df, artifacts):
    """Prepare test features using saved preprocessing"""
    feature_names = artifacts['feature_names']
    pm_encoder = artifacts['payment_method_encoder']
    ec_encoder = artifacts['error_code_encoder']
    scaler = artifacts['scaler']
    
    # Numerical features (matching training)
    numerical_features = [
        'amount',
        'retry_count',
        'prev_successful_payments',
        'prev_failed_payments',
        'customer_success_rate',
        'hour_of_day',
        'day_of_week',
        'is_business_hours',
        'is_weekend',
        'time_since_failure_hours'
    ]
    
    # Create feature matrix
    X = df[numerical_features].copy()
    X['payment_method_encoded'] = pm_encoder.transform(df['payment_method'])
    X['error_code_encoded'] = ec_encoder.transform(df['error_code'])
    
    # Scale
    X_scaled = scaler.transform(X.values)
    
    # Target
    y = df['recovered'].values
    
    return X_scaled, y

def evaluate_on_test_set(model, X_test, y_test, model_name):
    """Evaluate model on held-out test set"""
    print("\n" + "="*70)
    print("HELD-OUT TEST SET EVALUATION")
    print("="*70)
    print(f"Model: {model_name}")
    print(f"Test samples: {len(y_test)}")
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Classification report
    print("\n" + "-"*70)
    print("CLASSIFICATION REPORT")
    print("-"*70)
    print(classification_report(y_test, y_pred, 
                                target_names=['Not Recovered', 'Recovered'],
                                digits=4))
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\n" + "-"*70)
    print("CONFUSION MATRIX")
    print("-"*70)
    print(f"                     Predicted")
    print(f"                     Not Recovered  |  Recovered")
    print(f"                     --------------|------------")
    print(f"Actual Not Recovered      {cm[0,0]:4d}       |     {cm[0,1]:4d}")
    print(f"Actual Recovered          {cm[1,0]:4d}       |     {cm[1,1]:4d}")
    
    # Calculate detailed metrics
    tn, fp, fn, tp = cm.ravel()
    
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    
    print("\n" + "-"*70)
    print("KEY PERFORMANCE METRICS")
    print("-"*70)
    print(f"Accuracy:    {accuracy:.4f}  ({accuracy:.2%})")
    print(f"Precision:   {precision:.4f}  ({precision:.2%}) - Of predicted recoverable, how many recovered?")
    print(f"Recall:      {recall:.4f}  ({recall:.2%}) - Of actually recoverable, how many identified?")
    print(f"Specificity: {specificity:.4f}  ({specificity:.2%}) - Of actual non-recoverable, how many correctly identified?")
    print(f"F1-Score:    {f1:.4f}  (Harmonic mean of precision and recall)")
    print(f"ROC-AUC:     {roc_auc:.4f}  (Area under ROC curve)")
    
    print("\n" + "-"*70)
    print("BUSINESS INTERPRETATION")
    print("-"*70)
    print(f"True Positives (TP):  {tp:4d} - Correctly identified recoverable payments")
    print(f"True Negatives (TN):  {tn:4d} - Correctly identified non-recoverable payments")
    print(f"False Positives (FP): {fp:4d} - Predicted recoverable but failed (wasted effort)")
    print(f"False Negatives (FN): {fn:4d} - Predicted non-recoverable but could recover (missed opportunity)")
    
    # Cost analysis (example)
    avg_recovery_cost = 10  # ₹10 average cost per recovery attempt
    avg_payment_value = 5000  # ₹5000 average payment value
    avg_recovery_cost = 10  # Rs.10 average cost per recovery attempt
    avg_payment_value = 5000  # Rs.5000 average payment value
    
    cost_wasted = fp * avg_recovery_cost
    revenue_missed = fn * avg_payment_value
    revenue_captured = tp * avg_payment_value
    
    print(f"\nExample Cost Analysis (Estimated):")
    print(f"  Wasted recovery cost (FP): Rs.{cost_wasted:,.0f}")
    print(f"  Missed revenue (FN): Rs.{revenue_missed:,.0f}")
    print(f"  Captured revenue (TP): Rs.{revenue_captured:,.0f}")
    
    metrics = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'specificity': float(specificity),
        'f1_score': float(f1),
        'roc_auc': float(roc_auc),
        'confusion_matrix': {
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'true_positives': int(tp)
        }
    }
    
    return metrics

def save_evaluation_report(metrics, model_name):
    """Save evaluation report"""
    report = {
        'model_name': model_name,
        'evaluation_date': pd.Timestamp.now().isoformat(),
        'test_set': 'payment_failures_test.csv',
        'metrics': metrics
    }
    
    with open('ml/reports/test_evaluation.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Generate markdown report
    with open('ml/reports/model_evaluation.md', 'w') as f:
        f.write(f"# Recovery Prediction Model Evaluation\n\n")
        f.write(f"**Model:** {model_name}\n\n")
        f.write(f"**Evaluation Date:** {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Test Dataset:** `payment_failures_test.csv`\n\n")
        
        f.write(f"## Performance Metrics\n\n")
        f.write(f"| Metric | Value |\n")
        f.write(f"|--------|-------|\n")
        f.write(f"| Accuracy | {metrics['accuracy']:.4f} ({metrics['accuracy']:.2%}) |\n")
        f.write(f"| Precision | {metrics['precision']:.4f} ({metrics['precision']:.2%}) |\n")
        f.write(f"| Recall | {metrics['recall']:.4f} ({metrics['recall']:.2%}) |\n")
        f.write(f"| F1-Score | {metrics['f1_score']:.4f} |\n")
        f.write(f"| ROC-AUC | {metrics['roc_auc']:.4f} |\n")
        
        f.write(f"\n## Confusion Matrix\n\n")
        cm = metrics['confusion_matrix']
        f.write(f"|  | Predicted Not Recovered | Predicted Recovered |\n")
        f.write(f"|---|---|---|\n")
        f.write(f"| **Actual Not Recovered** | {cm['true_negatives']} | {cm['false_positives']} |\n")
        f.write(f"| **Actual Recovered** | {cm['false_negatives']} | {cm['true_positives']} |\n")
        
        f.write(f"\n## Interpretation\n\n")
        f.write(f"- **True Positives ({cm['true_positives']})**: Correctly predicted recoverable payments\n")
        f.write(f"- **True Negatives ({cm['true_negatives']})**: Correctly predicted non-recoverable payments\n")
        f.write(f"- **False Positives ({cm['false_positives']})**: Incorrectly predicted as recoverable (wasted effort)\n")
        f.write(f"- **False Negatives ({cm['false_negatives']})**: Missed recoverable payments (lost opportunity)\n")
        
        f.write(f"\n## Model Quality Assessment\n\n")
        
        if metrics['f1_score'] >= 0.75 and metrics['roc_auc'] >= 0.80:
            f.write(f"[EXCELLENT] - Model performance exceeds production quality thresholds.\n\n")
        elif metrics['f1_score'] >= 0.65 and metrics['roc_auc'] >= 0.70:
            f.write(f"[GOOD] - Model performance is suitable for production use.\n\n")
        else:
            f.write(f"[NEEDS IMPROVEMENT] - Consider feature engineering or additional training data.\n\n")
        
        f.write(f"**Recommendation:** ")
        if metrics['precision'] > 0.80:
            f.write(f"High precision means low false positives - good for minimizing wasted recovery efforts.\n")
        if metrics['recall'] > 0.80:
            f.write(f"High recall means low false negatives - good for maximizing revenue capture.\n")
    
    print(f"\n[OK] Evaluation report saved:")
    print(f"   - JSON: ml/reports/test_evaluation.json")
    print(f"   - Markdown: ml/reports/model_evaluation.md")

def main():
    """Main execution"""
    # Load model
    artifacts = load_model()
    model = artifacts['model']
    model_name = artifacts['model_name']
    
    # Load test data
    test_df = load_test_data()
    
    # Prepare features
    X_test, y_test = prepare_test_features(test_df, artifacts)
    
    # Evaluate
    metrics = evaluate_on_test_set(model, X_test, y_test, model_name)
    
    # Save report
    save_evaluation_report(metrics, model_name)
    
    print("\n" + "="*70)
    print("EVALUATION COMPLETE")
    print("="*70)
    print(f"\nF1-Score:  {metrics['f1_score']:.4f}")
    print(f"ROC-AUC:  {metrics['roc_auc']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")

if __name__ == '__main__':
    main()
