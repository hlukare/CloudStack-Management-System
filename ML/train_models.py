import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
import json

print("="*60)
print("CLOUD VM MANAGEMENT - ML MODEL TRAINING")
print("="*60)

# Create models directory
os.makedirs('models', exist_ok=True)

# ==========================================
# 1. ANOMALY DETECTION MODEL
# ==========================================
print("\n[1/4] Training Anomaly Detection Model...")

# Load VM metrics dataset
vm_metrics = pd.read_csv('datasets/vm_metrics_dataset.csv')
vm_metrics['timestamp'] = pd.to_datetime(vm_metrics['timestamp'])

# Extract features for anomaly detection
feature_cols = ['cpu_utilization', 'memory_utilization', 'disk_utilization', 
                'network_in_mb', 'network_out_mb', 'disk_read_ops', 'disk_write_ops']

X_anomaly = vm_metrics[feature_cols].values

# Normalize features
scaler_anomaly = StandardScaler()
X_anomaly_scaled = scaler_anomaly.fit_transform(X_anomaly)

# Train Isolation Forest for anomaly detection
anomaly_model = IsolationForest(
    contamination=0.15,  # Expect 15% anomalies
    random_state=42,
    n_estimators=100,
    max_samples=256
)

anomaly_model.fit(X_anomaly_scaled)

# Evaluate
predictions = anomaly_model.predict(X_anomaly_scaled)
anomaly_scores = anomaly_model.score_samples(X_anomaly_scaled)

# Convert predictions (-1 for anomaly, 1 for normal)
anomaly_predictions = (predictions == -1).astype(int)
actual_anomalies = vm_metrics['is_anomaly'].values

# Calculate accuracy
accuracy = np.mean(anomaly_predictions == actual_anomalies)
print(f"   ✓ Anomaly Detection Accuracy: {accuracy*100:.2f}%")
print(f"   ✓ Detected Anomalies: {np.sum(anomaly_predictions)}/{len(anomaly_predictions)}")

# Save model and scaler
joblib.dump(anomaly_model, 'models/anomaly_detection_model.pkl')
joblib.dump(scaler_anomaly, 'models/anomaly_scaler.pkl')
print("   ✓ Model saved: models/anomaly_detection_model.pkl")

# ==========================================
# 2. COST PREDICTION MODEL
# ==========================================
print("\n[2/4] Training Cost Prediction Model...")

# Load cost dataset
cost_data = pd.read_csv('datasets/cost_dataset.csv')
cost_data['date'] = pd.to_datetime(cost_data['date'])

# Create features for cost prediction
cost_data['day_of_year'] = cost_data['date'].dt.dayofyear
cost_data['days_since_start'] = (cost_data['date'] - cost_data['date'].min()).dt.days

# Use last 7 days to predict next day
cost_features = []
cost_targets = []

window_size = 7

for i in range(window_size, len(cost_data)):
    # Features: last 7 days of costs + metadata
    window_costs = cost_data['total_cost'].iloc[i-window_size:i].values
    day_of_week = cost_data['day_of_week'].iloc[i]
    month = cost_data['month'].iloc[i]
    is_weekend = cost_data['is_weekend'].iloc[i]
    
    features = list(window_costs) + [day_of_week, month, is_weekend]
    target = cost_data['total_cost'].iloc[i]
    
    cost_features.append(features)
    cost_targets.append(target)

X_cost = np.array(cost_features)
y_cost = np.array(cost_targets)

# Split data
X_train_cost, X_test_cost, y_train_cost, y_test_cost = train_test_split(
    X_cost, y_cost, test_size=0.2, random_state=42
)

# Train Random Forest Regressor
cost_model = RandomForestRegressor(
    n_estimators=100,
    max_depth=15,
    random_state=42,
    n_jobs=-1
)

cost_model.fit(X_train_cost, y_train_cost)

# Evaluate
train_score = cost_model.score(X_train_cost, y_train_cost)
test_score = cost_model.score(X_test_cost, y_test_cost)

print(f"   ✓ Training R² Score: {train_score:.4f}")
print(f"   ✓ Testing R² Score: {test_score:.4f}")

# Save model
joblib.dump(cost_model, 'models/cost_prediction_model.pkl')
print("   ✓ Model saved: models/cost_prediction_model.pkl")

# ==========================================
# 3. RESOURCE USAGE PREDICTION MODEL
# ==========================================
print("\n[3/4] Training Resource Usage Prediction Model...")

# Create sequences for time series prediction
sequence_length = 12  # Use last 12 data points (1 hour)

def create_sequences(data, seq_length):
    sequences = []
    targets = []
    
    for i in range(len(data) - seq_length):
        seq = data[i:i+seq_length]
        target = data[i+seq_length]
        sequences.append(seq)
        targets.append(target)
    
    return np.array(sequences), np.array(targets)

# Predict CPU utilization
cpu_data = vm_metrics['cpu_utilization'].values
X_cpu, y_cpu = create_sequences(cpu_data, sequence_length)

# Reshape for Random Forest (flatten sequences)
X_cpu_flat = X_cpu.reshape(X_cpu.shape[0], -1)

# Split data
X_train_cpu, X_test_cpu, y_train_cpu, y_test_cpu = train_test_split(
    X_cpu_flat, y_cpu, test_size=0.2, random_state=42
)

# Train model
cpu_prediction_model = RandomForestRegressor(
    n_estimators=100,
    max_depth=12,
    random_state=42,
    n_jobs=-1
)

cpu_prediction_model.fit(X_train_cpu, y_train_cpu)

# Evaluate
train_score_cpu = cpu_prediction_model.score(X_train_cpu, y_train_cpu)
test_score_cpu = cpu_prediction_model.score(X_test_cpu, y_test_cpu)

print(f"   ✓ CPU Prediction - Training R² Score: {train_score_cpu:.4f}")
print(f"   ✓ CPU Prediction - Testing R² Score: {test_score_cpu:.4f}")

# Save model
joblib.dump(cpu_prediction_model, 'models/cpu_prediction_model.pkl')
print("   ✓ Model saved: models/cpu_prediction_model.pkl")

# Save metadata
model_metadata = {
    'sequence_length': sequence_length,
    'window_size': window_size,
    'feature_columns': feature_cols,
    'version': '1.0',
    'trained_on': pd.Timestamp.now().isoformat()
}

with open('models/model_metadata.json', 'w') as f:
    json.dump(model_metadata, f, indent=2)

# ==========================================
# 4. INSTANCE RECOMMENDATION MODEL
# ==========================================
print("\n[4/4] Training Instance Recommendation Model...")

# Load recommendation dataset
recommendations = pd.read_csv('datasets/instance_recommendations_dataset.csv')

# Features for recommendation
rec_features = ['current_cpu_count', 'current_memory_gb', 'avg_cpu_utilization', 
                'avg_memory_utilization', 'peak_cpu_utilization', 'peak_memory_utilization']

X_rec = recommendations[rec_features].values
y_rec = recommendations['recommendation_action'].values

# Encode target
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()
y_rec_encoded = le.fit_transform(y_rec)

# Split data
X_train_rec, X_test_rec, y_train_rec, y_test_rec = train_test_split(
    X_rec, y_rec_encoded, test_size=0.2, random_state=42
)

# Train classifier
recommendation_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)

recommendation_model.fit(X_train_rec, y_train_rec)

# Evaluate
train_acc = recommendation_model.score(X_train_rec, y_train_rec)
test_acc = recommendation_model.score(X_test_rec, y_test_rec)

print(f"   ✓ Training Accuracy: {train_acc*100:.2f}%")
print(f"   ✓ Testing Accuracy: {test_acc*100:.2f}%")

# Save model and encoder
joblib.dump(recommendation_model, 'models/instance_recommendation_model.pkl')
joblib.dump(le, 'models/recommendation_label_encoder.pkl')
print("   ✓ Model saved: models/instance_recommendation_model.pkl")

# ==========================================
# TRAINING SUMMARY
# ==========================================
print("\n" + "="*60)
print("MODEL TRAINING COMPLETED SUCCESSFULLY!")
print("="*60)
print("\nTrained Models:")
print("  1. ✓ Anomaly Detection (Isolation Forest)")
print("  2. ✓ Cost Prediction (Random Forest Regressor)")
print("  3. ✓ CPU Usage Prediction (Random Forest Regressor)")
print("  4. ✓ Instance Recommendation (Random Forest Classifier)")
print("\nAll models saved in 'models/' directory")
print("\nNext Steps:")
print("  1. Run 'python ml_api_server.py' to start the ML API server")
print("  2. The backend will connect to this API for predictions")
print("="*60)
