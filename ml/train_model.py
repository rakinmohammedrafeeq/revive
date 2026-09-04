"""
Recovery Probability Model Training for Revive
Trains and evaluates ML models for payment recovery prediction
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    roc_curve, precision_recall_curve, f1_score
)
import json

def load_data():
    """Load training and validation datasets"""
    print("Loading datasets...")
    train_df = pd.read_csv('ml/data/payment_failures_train.csv')
    val_df = pd.read_csv('ml/data/payment_failures_val.csv')
    
    print(f"Train set: {len(train_df)} records")
    print(f"Validation set: {len(val_df)} records")
    
    return train_df, val_df

def prepare_features(df):
    """
    Prepare features for model training
    Returns X (features) and y (target)
    """
    # Numerical features
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
    
    # Categorical features
    categorical_features = ['payment_method', 'error_code']
    
    # Prepare categorical encoding
    payment_method_encoder = LabelEncoder()
    error_code_encoder = LabelEncoder()
    
    # Fit on all data (train + val)
    all_payment_methods = df['payment_method'].unique()
    all_error_codes = df['error_code'].unique()
    
    payment_method_encoder.fit(all_payment_methods)
    error_code_encoder.fit(all_error_codes)
    
    # Create feature matrix
    X = df[numerical_features].copy()
    X['payment_method_encoded'] = payment_method_encoder.transform(df['payment_method'])
    X['error_code_encoded'] = error_code_encoder.transform(df['error_code'])
    
    # Target variable
    y = df['recovered'].values
    
    feature_names = X.columns.tolist()
    
    return X.values, y, feature_names, payment_method_encoder, error_code_encoder

def train_models(X_train, y_train, X_val, y_val):
    """Train multiple models and compare performance"""
    print("\n" + "="*60)
    print("TRAINING MODELS")
    print("="*60)
    
    models = {}
    results = {}
    
    # 1. Logistic Regression (Baseline)
    print("\n1. Training Logistic Regression (baseline)...")
    lr = LogisticRegression(random_state=42, max_iter=1000)
    lr.fit(X_train, y_train)
    models['Logistic Regression'] = lr
    
    y_pred_lr = lr.predict(X_val)
    y_prob_lr = lr.predict_proba(X_val)[:, 1]
    
    results['Logistic Regression'] = {
        'f1': f1_score(y_val, y_pred_lr),
        'roc_auc': roc_auc_score(y_val, y_prob_lr)
    }
    
    print(f"   F1 Score: {results['Logistic Regression']['f1']:.4f}")
    print(f"   ROC-AUC: {results['Logistic Regression']['roc_auc']:.4f}")
    
    # 2. Random Forest
    print("\n2. Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    models['Random Forest'] = rf
    
    y_pred_rf = rf.predict(X_val)
    y_prob_rf = rf.predict_proba(X_val)[:, 1]
    
    results['Random Forest'] = {
        'f1': f1_score(y_val, y_pred_rf),
        'roc_auc': roc_auc_score(y_val, y_prob_rf)
    }
    
    print(f"   F1 Score: {results['Random Forest']['f1']:.4f}")
    print(f"   ROC-AUC: {results['Random Forest']['roc_auc']:.4f}")
    
    # 3. Gradient Boosting
    print("\n3. Training Gradient Boosting...")
    gb = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42
    )
    gb.fit(X_train, y_train)
    models['Gradient Boosting'] = gb
    
    y_pred_gb = gb.predict(X_val)
    y_prob_gb = gb.predict_proba(X_val)[:, 1]
    
    results['Gradient Boosting'] = {
        'f1': f1_score(y_val, y_pred_gb),
        'roc_auc': roc_auc_score(y_val, y_prob_gb)
    }
    
    print(f"   F1 Score: {results['Gradient Boosting']['f1']:.4f}")
    print(f"   ROC-AUC: {results['Gradient Boosting']['roc_auc']:.4f}")
    
    # Select best model
    print("\n" + "="*60)
    print("MODEL COMPARISON")
    print("="*60)
    
    for name, scores in results.items():
        print(f"{name:20s} F1: {scores['f1']:.4f}  ROC-AUC: {scores['roc_auc']:.4f}")
    
    # Select based on F1 score (balanced metric)
    best_model_name = max(results.items(), key=lambda x: x[1]['f1'])[0]
    best_model = models[best_model_name]
    
    print(f"\nBest model: {best_model_name}")
    
    return best_model, best_model_name, results

def evaluate_model(model, X_val, y_val, model_name):
    """Detailed model evaluation"""
    print("\n" + "="*60)
    print(f"DETAILED EVALUATION: {model_name}")
    print("="*60)
    
    y_pred = model.predict(X_val)
    y_prob = model.predict_proba(X_val)[:, 1]
    
    # Classification report
    print("\nClassification Report:")
    print(classification_report(y_val, y_pred, 
                                target_names=['Not Recovered', 'Recovered']))
    
    # Confusion matrix
    cm = confusion_matrix(y_val, y_pred)
    print("\nConfusion Matrix:")
    print(f"                 Predicted")
    print(f"                 Not Rec  Recovered")
    print(f"Actual Not Rec   {cm[0,0]:6d}   {cm[0,1]:6d}")
    print(f"Actual Recovered {cm[1,0]:6d}   {cm[1,1]:6d}")
    
    # Calculate metrics
    tn, fp, fn, tp = cm.ravel()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    print(f"\nKey Metrics:")
    print(f"Precision: {precision:.4f} (of predicted recoverable, {precision:.1%} actually recovered)")
    print(f"Recall:    {recall:.4f} (of actually recoverable, {recall:.1%} identified)")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc_score(y_val, y_prob):.4f}")
    
    return {
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'roc_auc': roc_auc_score(y_val, y_prob),
        'confusion_matrix': cm.tolist()
    }

def get_feature_importance(model, feature_names, model_name):
    """Get feature importance"""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        feature_importance = sorted(zip(feature_names, importances), 
                                   key=lambda x: x[1], reverse=True)
        
        print(f"\nFeature Importance ({model_name}):")
        print("-" * 50)
        for feature, importance in feature_importance[:10]:
            print(f"{feature:30s} {importance:.4f}")
        
        return feature_importance
    else:
        return None

def save_model(model, scaler, feature_names, payment_method_encoder, 
               error_code_encoder, model_name, metrics):
    """Save trained model and preprocessing objects"""
    print("\n" + "="*60)
    print("SAVING MODEL")
    print("="*60)
    
    model_artifacts = {
        'model': model,
        'scaler': scaler,
        'feature_names': feature_names,
        'payment_method_encoder': payment_method_encoder,
        'error_code_encoder': error_code_encoder,
        'model_name': model_name,
        'metrics': metrics
    }
    
    with open('ml/models/recovery_model.pkl', 'wb') as f:
        pickle.dump(model_artifacts, f)
    
    # Save metadata as JSON
    metadata = {
        'model_name': model_name,
        'feature_names': feature_names,
        'metrics': metrics,
        'created_at': pd.Timestamp.now().isoformat()
    }
    
    with open('ml/models/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"[OK] Model saved successfully!")
    print(f"   - Model: ml/models/recovery_model.pkl")
    print(f"   - Metadata: ml/models/model_metadata.json")

def main():
    """Main execution"""
    # Load data
    train_df, val_df = load_data()
    
    # Prepare features
    print("\nPreparing features...")
    X_train, y_train, feature_names, pm_encoder, ec_encoder = prepare_features(train_df)
    X_val, y_val, _, _, _ = prepare_features(val_df)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    # Train models
    best_model, best_model_name, all_results = train_models(
        X_train_scaled, y_train, X_val_scaled, y_val
    )
    
    # Detailed evaluation
    metrics = evaluate_model(best_model, X_val_scaled, y_val, best_model_name)
    
    # Feature importance
    feature_importance = get_feature_importance(best_model, feature_names, best_model_name)
    
    # Save model
    save_model(best_model, scaler, feature_names, pm_encoder, ec_encoder, 
               best_model_name, metrics)
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE")
    print("="*60)
    print(f"\nBest Model: {best_model_name}")
    print(f"F1-Score: {metrics['f1']:.4f}")
    print(f"ROC-AUC: {metrics['roc_auc']:.4f}")
    print("\nNext steps:")
    print("1. Run evaluate_model.py for held-out test set evaluation")
    print("2. Integrate model with Java backend via RecoveryProbabilityService")

if __name__ == '__main__':
    main()
