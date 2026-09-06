"""
Synthetic Payment Failure Dataset Generator for Revive
Generates realistic payment failure scenarios with recovery outcomes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Configuration
NUM_RECORDS = 800  # Total records to generate
TRAIN_SPLIT = 0.70
VAL_SPLIT = 0.15
# TEST_SPLIT = 0.15 (remaining)

# Payment methods and their typical failure rates
PAYMENT_METHODS = {
    'UPI': 0.15,
    'CARD': 0.20,
    'NET_BANKING': 0.25,
    'WALLET': 0.10
}

# Failure types with recovery rates
FAILURE_TYPES = {
    'issuer_declined_temp': {'recovery_rate': 0.82, 'avg_retries': 1.2},
    'gateway_timeout': {'recovery_rate': 0.88, 'avg_retries': 1.1},
    'insufficient_funds': {'recovery_rate': 0.58, 'avg_retries': 2.1},
    'card_expired': {'recovery_rate': 0.45, 'avg_retries': 1.8},
    'declined_permanent': {'recovery_rate': 0.12, 'avg_retries': 0.5},
    'fraud_suspected': {'recovery_rate': 0.08, 'avg_retries': 0.2},
    'disputed': {'recovery_rate': 0.15, 'avg_retries': 0.6},
    'authentication_failed': {'recovery_rate': 0.65, 'avg_retries': 1.5},
}

def generate_customer_history():
    """Generate realistic customer payment history"""
    # Some customers have good history, some don't
    if random.random() < 0.7:  # 70% have good history
        successful_payments = random.randint(3, 20)
        failed_payments = random.randint(0, 2)
    else:
        successful_payments = random.randint(0, 5)
        failed_payments = random.randint(1, 8)
    
    total_payments = successful_payments + failed_payments
    success_rate = successful_payments / total_payments if total_payments > 0 else 0.0
    
    return successful_payments, failed_payments, success_rate

def generate_amount():
    """Generate realistic payment amounts"""
    # Use log-normal distribution for realistic payment amounts
    # Most payments are small, few are large
    amount = np.random.lognormal(mean=8.5, sigma=1.0)
    # Clip to reasonable range
    amount = np.clip(amount, 500, 100000)
    return round(amount, 2)

def generate_time_features():
    """Generate time-based features"""
    hour = random.randint(0, 23)
    day_of_week = random.randint(0, 6)  # 0=Monday, 6=Sunday
    
    # Business hours (9 AM - 6 PM) have higher success
    is_business_hours = 1 if 9 <= hour <= 18 else 0
    
    # Weekends have slightly lower success
    is_weekend = 1 if day_of_week >= 5 else 0
    
    return hour, day_of_week, is_business_hours, is_weekend

def determine_recovery(error_code, payment_method, amount, customer_success_rate, 
                       retry_count, is_business_hours, time_since_failure_hours):
    """
    Determine if payment is likely to be recovered based on features
    Uses realistic business logic
    """
    base_recovery_rate = FAILURE_TYPES[error_code]['recovery_rate']
    
    # Adjust based on customer history
    if customer_success_rate > 0.9:
        base_recovery_rate += 0.10
    elif customer_success_rate < 0.3:
        base_recovery_rate -= 0.15
    
    # Adjust based on payment method reliability
    if payment_method == 'UPI':
        base_recovery_rate += 0.05
    elif payment_method == 'NET_BANKING':
        base_recovery_rate -= 0.05
    
    # Adjust based on amount (very high amounts are riskier)
    if amount > 50000:
        base_recovery_rate -= 0.08
    elif amount < 2000:
        base_recovery_rate += 0.03
    
    # Adjust based on retry count (diminishing returns)
    if retry_count == 0:
        pass  # No adjustment
    elif retry_count == 1:
        base_recovery_rate -= 0.05
    elif retry_count >= 2:
        base_recovery_rate -= 0.15
    
    # Adjust based on timing
    if is_business_hours:
        base_recovery_rate += 0.03
    
    # Quick retries work better for temporary issues
    if error_code in ['issuer_declined_temp', 'gateway_timeout']:
        if time_since_failure_hours < 2:
            base_recovery_rate += 0.08
        elif time_since_failure_hours > 48:
            base_recovery_rate -= 0.10
    
    # Clip to valid probability range
    recovery_probability = np.clip(base_recovery_rate, 0.0, 0.98)
    
    # Stochastic decision
    recovered = 1 if random.random() < recovery_probability else 0
    
    return recovered, recovery_probability

def generate_dataset():
    """Generate complete synthetic dataset"""
    print("Generating synthetic payment failure dataset...")
    
    records = []
    
    for i in range(NUM_RECORDS):
        # Basic features
        payment_method = random.choices(
            list(PAYMENT_METHODS.keys()),
            weights=list(PAYMENT_METHODS.values())
        )[0]
        
        error_code = random.choices(
            list(FAILURE_TYPES.keys()),
            weights=[f['recovery_rate'] for f in FAILURE_TYPES.values()]
        )[0]
        
        amount = generate_amount()
        
        # Customer history
        prev_successful, prev_failed, customer_success_rate = generate_customer_history()
        
        # Time features
        hour, day_of_week, is_business_hours, is_weekend = generate_time_features()
        
        # Retry features
        max_retries = int(FAILURE_TYPES[error_code]['avg_retries'] + random.uniform(-0.5, 0.5))
        retry_count = max(0, min(max_retries, random.randint(0, 3)))
        
        # Time since failure
        time_since_failure_hours = random.randint(1, 168)  # 1 hour to 1 week
        
        # Determine recovery outcome
        recovered, recovery_probability = determine_recovery(
            error_code, payment_method, amount, customer_success_rate,
            retry_count, is_business_hours, time_since_failure_hours
        )
        
        record = {
            'payment_id': f'pay_{i+1:05d}',
            'amount': amount,
            'payment_method': payment_method,
            'error_code': error_code,
            'retry_count': retry_count,
            'prev_successful_payments': prev_successful,
            'prev_failed_payments': prev_failed,
            'customer_success_rate': round(customer_success_rate, 3),
            'hour_of_day': hour,
            'day_of_week': day_of_week,
            'is_business_hours': is_business_hours,
            'is_weekend': is_weekend,
            'time_since_failure_hours': time_since_failure_hours,
            'recovery_probability': round(recovery_probability, 3),
            'recovered': recovered
        }
        
        records.append(record)
    
    df = pd.DataFrame(records)
    
    # Print statistics
    print(f"\nDataset Statistics:")
    print(f"Total records: {len(df)}")
    print(f"Recovered: {df['recovered'].sum()} ({df['recovered'].mean():.1%})")
    print(f"Not recovered: {(1 - df['recovered']).sum()} ({(1 - df['recovered']).mean():.1%})")
    print(f"\nRecovery rate by error code:")
    print(df.groupby('error_code')['recovered'].agg(['count', 'mean']).round(3))
    print(f"\nRecovery rate by payment method:")
    print(df.groupby('payment_method')['recovered'].agg(['count', 'mean']).round(3))
    
    return df

def split_dataset(df):
    """Split dataset into train, validation, and test sets"""
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    n = len(df)
    train_end = int(n * TRAIN_SPLIT)
    val_end = int(n * (TRAIN_SPLIT + VAL_SPLIT))
    
    train_df = df[:train_end]
    val_df = df[train_end:val_end]
    test_df = df[val_end:]
    
    print(f"\nDataset splits:")
    print(f"Train: {len(train_df)} ({len(train_df)/n:.1%})")
    print(f"Validation: {len(val_df)} ({len(val_df)/n:.1%})")
    print(f"Test: {len(test_df)} ({len(test_df)/n:.1%})")
    
    return train_df, val_df, test_df

def main():
    """Main execution"""
    # Generate dataset
    df = generate_dataset()
    
    # Split dataset
    train_df, val_df, test_df = split_dataset(df)
    
    # Save datasets
    df.to_csv('ml/data/payment_failures_full.csv', index=False)
    train_df.to_csv('ml/data/payment_failures_train.csv', index=False)
    val_df.to_csv('ml/data/payment_failures_val.csv', index=False)
    test_df.to_csv('ml/data/payment_failures_test.csv', index=False)
    
    print(f"\n✅ Datasets saved successfully!")
    print(f"   - Full dataset: ml/data/payment_failures_full.csv")
    print(f"   - Training set: ml/data/payment_failures_train.csv")
    print(f"   - Validation set: ml/data/payment_failures_val.csv")
    print(f"   - Test set: ml/data/payment_failures_test.csv")

if __name__ == '__main__':
    main()
