from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load models
print("Loading ML models...")

try:
    anomaly_model = joblib.load('models/anomaly_detection_model.pkl')
    anomaly_scaler = joblib.load('models/anomaly_scaler.pkl')
    cost_model = joblib.load('models/cost_prediction_model.pkl')
    cpu_model = joblib.load('models/cpu_prediction_model.pkl')
    recommendation_model = joblib.load('models/instance_recommendation_model.pkl')
    recommendation_encoder = joblib.load('models/recommendation_label_encoder.pkl')
    
    with open('models/model_metadata.json', 'r') as f:
        metadata = json.load(f)
    
    print("✓ All models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    print("Please run 'python generate_datasets.py' and 'python train_models.py' first")
    exit(1)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'ML API Server is running',
        'models_loaded': True,
        'version': metadata.get('version', '1.0'),
        'trained_on': metadata.get('trained_on', 'unknown')
    })

@app.route('/detect/anomalies', methods=['POST'])
def detect_anomalies():
    """
    Detect anomalies in VM metrics
    Expected input: { "data": [{"cpu": float, "memory": float, "disk": float, ...}] }
    """
    try:
        data = request.json.get('data', [])
        
        if not data or len(data) == 0:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract features
        features = []
        for point in data:
            features.append([
                point.get('cpu', 0),
                point.get('memory', 0),
                point.get('disk', 0),
                point.get('networkIn', 0),
                point.get('networkOut', 0),
                point.get('diskRead', 0),
                point.get('diskWrite', 0)
            ])
        
        X = np.array(features)
        X_scaled = anomaly_scaler.transform(X)
        
        # Predict anomalies
        predictions = anomaly_model.predict(X_scaled)
        anomaly_scores = anomaly_model.score_samples(X_scaled)
        
        # Convert predictions (-1 for anomaly, 1 for normal)
        anomalies = []
        for i, (pred, score) in enumerate(zip(predictions, anomaly_scores)):
            if pred == -1:
                anomalies.append({
                    'index': i,
                    'timestamp': data[i].get('timestamp'),
                    'score': float(score),
                    'severity': 'high' if score < -0.5 else 'medium',
                    'metrics': {
                        'cpu': data[i].get('cpu'),
                        'memory': data[i].get('memory'),
                        'disk': data[i].get('disk')
                    }
                })
        
        return jsonify({
            'anomalies': anomalies,
            'total_checked': len(data),
            'anomaly_count': len(anomalies),
            'anomaly_percentage': round(len(anomalies) / len(data) * 100, 2)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/cost', methods=['POST'])
def predict_cost():
    """
    Predict future costs
    Expected input: { "historical_costs": [float, float, ...], "days": int }
    """
    try:
        historical_costs = request.json.get('historical_costs', [])
        days_to_predict = request.json.get('days', 7)
        day_of_week = request.json.get('day_of_week', 0)
        month = request.json.get('month', 1)
        is_weekend = request.json.get('is_weekend', 0)
        
        if len(historical_costs) < 7:
            return jsonify({'error': 'At least 7 days of historical data required'}), 400
        
        # Use last 7 days for prediction
        last_7_days = historical_costs[-7:]
        
        predictions = []
        current_features = last_7_days.copy()
        
        for i in range(days_to_predict):
            # Create feature vector
            features = current_features[-7:] + [
                (day_of_week + i) % 7,
                month,
                1 if ((day_of_week + i) % 7) >= 5 else 0
            ]
            
            # Predict next day
            X = np.array([features])
            predicted_cost = cost_model.predict(X)[0]
            predictions.append(float(predicted_cost))
            
            # Update sliding window
            current_features.append(predicted_cost)
        
        total_predicted = sum(predictions)
        avg_predicted = total_predicted / len(predictions)
        
        return jsonify({
            'predictions': predictions,
            'total_predicted': round(total_predicted, 2),
            'average_daily': round(avg_predicted, 2),
            'days': days_to_predict
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/resources', methods=['POST'])
def predict_resources():
    """
    Predict future resource usage
    Expected input: { "data": [{"cpu": float, "memory": float, ...}] }
    """
    try:
        data = request.json.get('data', [])
        
        if len(data) < metadata['sequence_length']:
            return jsonify({
                'error': f'At least {metadata["sequence_length"]} data points required'
            }), 400
        
        # Extract CPU values
        cpu_values = [point.get('cpu', 0) for point in data]
        
        # Use last sequence_length points
        last_sequence = cpu_values[-metadata['sequence_length']:]
        
        # Predict next value
        X = np.array([last_sequence])
        next_cpu = cpu_model.predict(X)[0]
        
        # Predict next 24 hours (assuming 5-minute intervals)
        predictions = []
        current_sequence = last_sequence.copy()
        
        for i in range(12):  # Predict next hour (12 * 5min intervals)
            X = np.array([current_sequence])
            pred = cpu_model.predict(X)[0]
            predictions.append(float(pred))
            current_sequence.append(pred)
            current_sequence.pop(0)
        
        # Calculate trend
        recent_avg = np.mean(cpu_values[-12:])
        predicted_avg = np.mean(predictions)
        trend = 'increasing' if predicted_avg > recent_avg else 'decreasing' if predicted_avg < recent_avg else 'stable'
        
        # Generate recommendation
        if predicted_avg > 85:
            recommendation = 'High resource usage predicted. Consider scaling up or load balancing.'
            confidence = 'high'
        elif predicted_avg < 20:
            recommendation = 'Low resource usage predicted. Consider downsizing to save costs.'
            confidence = 'medium'
        else:
            recommendation = 'Resource usage appears optimal.'
            confidence = 'medium'
        
        return jsonify({
            'prediction': {
                'nextHourAvg': round(predicted_avg, 2),
                'nextHourMax': round(max(predictions), 2),
                'nextHourMin': round(min(predictions), 2),
                'predictions': [round(p, 2) for p in predictions],
                'trend': trend
            },
            'recommendation': recommendation,
            'confidence': confidence
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommend/instance', methods=['POST'])
def recommend_instance():
    """
    Recommend instance type based on usage
    Expected input: { "current_type": str, "cpu_count": int, "memory_gb": int, "avg_cpu": float, ... }
    """
    try:
        cpu_count = request.json.get('cpu_count', 2)
        memory_gb = request.json.get('memory_gb', 4)
        avg_cpu = request.json.get('avg_cpu', 50)
        avg_memory = request.json.get('avg_memory', 60)
        peak_cpu = request.json.get('peak_cpu', 70)
        peak_memory = request.json.get('peak_memory', 80)
        
        # Create feature vector
        features = np.array([[cpu_count, memory_gb, avg_cpu, avg_memory, peak_cpu, peak_memory]])
        
        # Predict recommendation
        prediction_encoded = recommendation_model.predict(features)[0]
        probabilities = recommendation_model.predict_proba(features)[0]
        
        recommendation = recommendation_encoder.inverse_transform([prediction_encoded])[0]
        confidence = max(probabilities)
        
        # Generate message
        if recommendation == 'downgrade':
            message = 'Your instance appears over-provisioned. Consider downsizing to save costs.'
        elif recommendation == 'upgrade':
            message = 'Your instance shows signs of resource constraints. Consider upgrading for better performance.'
        else:
            message = 'Your current instance type appears well-suited for your workload.'
        
        return jsonify({
            'recommendation': recommendation,
            'confidence': round(float(confidence) * 100, 2),
            'message': message,
            'metrics': {
                'avg_cpu': avg_cpu,
                'avg_memory': avg_memory,
                'peak_cpu': peak_cpu,
                'peak_memory': peak_memory
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze/pattern', methods=['POST'])
def analyze_pattern():
    """
    Analyze usage patterns and provide insights
    """
    try:
        data = request.json.get('data', [])
        
        if len(data) < 24:
            return jsonify({'error': 'At least 24 data points required'}), 400
        
        cpu_values = [point.get('cpu', 0) for point in data]
        memory_values = [point.get('memory', 0) for point in data]
        
        patterns = {
            'cpu': {
                'mean': round(np.mean(cpu_values), 2),
                'std': round(np.std(cpu_values), 2),
                'min': round(np.min(cpu_values), 2),
                'max': round(np.max(cpu_values), 2),
                'percentile_95': round(np.percentile(cpu_values, 95), 2)
            },
            'memory': {
                'mean': round(np.mean(memory_values), 2),
                'std': round(np.std(memory_values), 2),
                'min': round(np.min(memory_values), 2),
                'max': round(np.max(memory_values), 2),
                'percentile_95': round(np.percentile(memory_values, 95), 2)
            }
        }
        
        # Detect patterns
        insights = []
        
        if patterns['cpu']['std'] > 20:
            insights.append('High CPU variability detected. Consider implementing auto-scaling.')
        
        if patterns['cpu']['mean'] < 20:
            insights.append('Consistently low CPU usage. Resource optimization recommended.')
        
        if patterns['memory']['percentile_95'] > 85:
            insights.append('Memory usage frequently exceeds 85%. Risk of performance issues.')
        
        return jsonify({
            'patterns': patterns,
            'insights': insights,
            'analyzed_points': len(data)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("ML API SERVER - Cloud VM Management")
    print("="*60)
    print("Server starting on http://localhost:8000")
    print("Available endpoints:")
    print("  - POST /detect/anomalies")
    print("  - POST /predict/cost")
    print("  - POST /predict/resources")
    print("  - POST /recommend/instance")
    print("  - POST /analyze/pattern")
    print("  - GET  /health")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=False)
