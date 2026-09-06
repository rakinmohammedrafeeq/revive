"""
Prediction script for Revive recovery probability model
Called from Java backend to get recovery probability for a payment
"""

import sys
import json
import pickle
import pandas as pd
import numpy as np

def load_model():
    """Load trained model"""
    with open('ml/models/recovery_model.pkl', 'rb') as f:
        artifacts = pickle.load(f)
    return artifacts

def prepare_features(payment_data, artifacts):
    """Prepare features from payment data"""
    pm_encoder = artifacts['payment_method_encoder']
    ec_encoder = artifacts['error_code_encoder']
    scaler = artifacts['scaler']
    
    # Build feature vector
    features = {
        'amount': float(payment_data.get('amount', 0)),
        'retry_count': int(payment_data.get('retryCount', 0)),
        'prev_successful_payments': int(payment_data.get('prevSuccessfulPayments', 3)),
        'prev_failed_payments': int(payment_data.get('prevFailedPayments', 0)),
        'customer_success_rate': float(payment_data.get('customerSuccessRate', 0.75)),
        'hour_of_day': int(payment_data.get('hourOfDay', 12)),
        'day_of_week': int(payment_data.get('dayOfWeek', 2)),
        'is_business_hours': int(payment_data.get('isBusinessHours', 1)),
        'is_weekend': int(payment_data.get('isWeekend', 0)),
        'time_since_failure_hours': int(payment_data.get('timeSinceFailureHours', 1))
    }
    
    # Encode categoricals
    payment_method = payment_data.get('paymentMethod', 'CARD')
    error_code = payment_data.get('errorCode', 'declined_permanent')
    
    # Handle unknown categories gracefully
    try:
        features['payment_method_encoded'] = pm_encoder.transform([payment_method])[0]
    except:
        features['payment_method_encoded'] = 0
    
    try:
        features['error_code_encoded'] = ec_encoder.transform([error_code])[0]
    except:
        features['error_code_encoded'] = 0
    
    # Create feature array in correct order
    feature_array = np.array([list(features.values())])
    
    # Scale
    feature_scaled = scaler.transform(feature_array)
    
    return feature_scaled

def predict(payment_data):
    """Predict recovery probability"""
    try:
        # Load model
        artifacts = load_model()
        model = artifacts['model']
        
        # Prepare features
        X = prepare_features(payment_data, artifacts)
        
        # Predict
        probability = model.predict_proba(X)[0][1]
        
        return {
            'success': True,
            'probability': float(probability),
            'model': artifacts['model_name']
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'probability': 0.5  # Default fallback
        }

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No input provided'}))
        sys.exit(1)
    
    try:
        # Read JSON input from command line
        payment_data = json.loads(sys.argv[1])
        
        # Predict
        result = predict(payment_data)
        
        # Output JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
