import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# Generate synthetic VM metrics dataset
def generate_vm_metrics_dataset(num_samples=10000):
    """
    Generate synthetic VM performance metrics data
    """
    np.random.seed(42)
    
    # Generate timestamps (last 30 days, every 5 minutes)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    timestamps = pd.date_range(start=start_date, end=end_date, freq='5min')
    
    # Select random timestamps
    selected_timestamps = np.random.choice(timestamps, size=min(num_samples, len(timestamps)), replace=False)
    selected_timestamps.sort()
    
    data = []
    
    for timestamp in selected_timestamps:
        # Normal operation most of the time
        if np.random.random() < 0.85:
            cpu = np.random.normal(45, 15)  # Mean 45%, std 15%
            memory = np.random.normal(55, 12)  # Mean 55%, std 12%
            disk = np.random.normal(60, 10)  # Mean 60%, std 10%
            is_anomaly = 0
        # Spike scenarios
        elif np.random.random() < 0.5:
            cpu = np.random.normal(85, 10)  # High CPU
            memory = np.random.normal(65, 8)
            disk = np.random.normal(62, 8)
            is_anomaly = 1
        # Memory leak scenario
        elif np.random.random() < 0.7:
            cpu = np.random.normal(50, 10)
            memory = np.random.normal(92, 5)  # Very high memory
            disk = np.random.normal(63, 8)
            is_anomaly = 1
        # Disk issue
        else:
            cpu = np.random.normal(48, 12)
            memory = np.random.normal(58, 10)
            disk = np.random.normal(95, 3)  # Very high disk
            is_anomaly = 1
        
        # Clip values to valid range
        cpu = np.clip(cpu, 0, 100)
        memory = np.clip(memory, 0, 100)
        disk = np.clip(disk, 0, 100)
        
        # Calculate derived metrics
        network_in = np.random.gamma(2, 50) if cpu > 70 else np.random.gamma(2, 20)
        network_out = np.random.gamma(2, 30) if cpu > 70 else np.random.gamma(2, 15)
        disk_read = np.random.gamma(3, 100) if disk > 80 else np.random.gamma(2, 50)
        disk_write = np.random.gamma(3, 80) if disk > 80 else np.random.gamma(2, 40)
        
        # Hour of day effect (higher usage during business hours)
        hour = timestamp.hour
        if 9 <= hour <= 17:
            cpu *= 1.2
            memory *= 1.1
            network_in *= 1.3
            network_out *= 1.3
        
        cpu = np.clip(cpu, 0, 100)
        memory = np.clip(memory, 0, 100)
        
        data.append({
            'timestamp': timestamp,
            'cpu_utilization': round(cpu, 2),
            'memory_utilization': round(memory, 2),
            'disk_utilization': round(disk, 2),
            'network_in_mb': round(network_in, 2),
            'network_out_mb': round(network_out, 2),
            'disk_read_ops': int(disk_read),
            'disk_write_ops': int(disk_write),
            'is_anomaly': is_anomaly
        })
    
    df = pd.DataFrame(data)
    return df

# Generate cost dataset
def generate_cost_dataset(num_samples=365):
    """
    Generate synthetic cost data for cloud resources
    """
    np.random.seed(42)
    
    # Last year of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=num_samples)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    data = []
    base_compute_cost = 150  # Base monthly compute cost
    
    for i, date in enumerate(dates):
        # Seasonal variation
        month_factor = 1 + 0.2 * np.sin(2 * np.pi * date.month / 12)
        
        # Growth trend
        growth_factor = 1 + (i / len(dates)) * 0.3
        
        # Random variation
        random_factor = np.random.normal(1, 0.1)
        
        # Calculate daily costs
        compute_cost = (base_compute_cost / 30) * month_factor * growth_factor * random_factor
        storage_cost = np.random.normal(30, 5) / 30
        network_cost = np.random.gamma(2, 5)
        snapshot_cost = np.random.normal(10, 2) / 30
        
        # Weekend discount (lower usage)
        if date.dayofweek >= 5:
            compute_cost *= 0.7
            network_cost *= 0.5
        
        total_cost = compute_cost + storage_cost + network_cost + snapshot_cost
        
        # Cost spike scenarios (5% of the time)
        if np.random.random() < 0.05:
            spike_factor = np.random.uniform(1.5, 3.0)
            total_cost *= spike_factor
            is_spike = 1
        else:
            is_spike = 0
        
        data.append({
            'date': date,
            'compute_cost': round(compute_cost, 2),
            'storage_cost': round(storage_cost, 2),
            'network_cost': round(network_cost, 2),
            'snapshot_cost': round(snapshot_cost, 2),
            'total_cost': round(total_cost, 2),
            'day_of_week': date.dayofweek,
            'month': date.month,
            'is_weekend': 1 if date.dayofweek >= 5 else 0,
            'is_spike': is_spike
        })
    
    df = pd.DataFrame(data)
    return df

# Generate instance type recommendations dataset
def generate_instance_recommendation_dataset(num_samples=1000):
    """
    Generate dataset for instance type recommendations
    """
    np.random.seed(42)
    
    instance_types = ['t2.micro', 't2.small', 't2.medium', 't2.large', 't2.xlarge', 
                     't3.micro', 't3.small', 't3.medium', 't3.large',
                     'm5.large', 'm5.xlarge', 'm5.2xlarge',
                     'c5.large', 'c5.xlarge', 'c5.2xlarge']
    
    instance_specs = {
        't2.micro': {'cpu': 1, 'memory': 1, 'cost': 0.0116},
        't2.small': {'cpu': 1, 'memory': 2, 'cost': 0.023},
        't2.medium': {'cpu': 2, 'memory': 4, 'cost': 0.0464},
        't2.large': {'cpu': 2, 'memory': 8, 'cost': 0.0928},
        't2.xlarge': {'cpu': 4, 'memory': 16, 'cost': 0.1856},
        't3.micro': {'cpu': 2, 'memory': 1, 'cost': 0.0104},
        't3.small': {'cpu': 2, 'memory': 2, 'cost': 0.0208},
        't3.medium': {'cpu': 2, 'memory': 4, 'cost': 0.0416},
        't3.large': {'cpu': 2, 'memory': 8, 'cost': 0.0832},
        'm5.large': {'cpu': 2, 'memory': 8, 'cost': 0.096},
        'm5.xlarge': {'cpu': 4, 'memory': 16, 'cost': 0.192},
        'm5.2xlarge': {'cpu': 8, 'memory': 32, 'cost': 0.384},
        'c5.large': {'cpu': 2, 'memory': 4, 'cost': 0.085},
        'c5.xlarge': {'cpu': 4, 'memory': 8, 'cost': 0.17},
        'c5.2xlarge': {'cpu': 8, 'memory': 16, 'cost': 0.34}
    }
    
    data = []
    
    for _ in range(num_samples):
        # Current instance type
        current_type = np.random.choice(instance_types)
        current_specs = instance_specs[current_type]
        
        # Usage patterns
        avg_cpu = np.random.uniform(10, 95)
        avg_memory = np.random.uniform(15, 90)
        peak_cpu = min(100, avg_cpu + np.random.uniform(5, 20))
        peak_memory = min(100, avg_memory + np.random.uniform(5, 15))
        
        # Determine optimal instance type
        cpu_needed = current_specs['cpu'] * (peak_cpu / 100)
        memory_needed = current_specs['memory'] * (peak_memory / 100)
        
        # Find best fit
        best_type = current_type
        best_score = float('inf')
        
        for itype, specs in instance_specs.items():
            if specs['cpu'] >= cpu_needed and specs['memory'] >= memory_needed:
                # Score based on cost efficiency
                score = specs['cost'] + abs(specs['cpu'] - cpu_needed) + abs(specs['memory'] - memory_needed)
                if score < best_score:
                    best_score = score
                    best_type = itype
        
        # Determine if downgrade, same, or upgrade
        current_cost = current_specs['cost']
        recommended_cost = instance_specs[best_type]['cost']
        
        if recommended_cost < current_cost * 0.9:
            recommendation = 'downgrade'
        elif recommended_cost > current_cost * 1.1:
            recommendation = 'upgrade'
        else:
            recommendation = 'keep'
        
        potential_savings = (current_cost - recommended_cost) * 730  # Monthly savings
        
        data.append({
            'current_instance_type': current_type,
            'current_cpu_count': current_specs['cpu'],
            'current_memory_gb': current_specs['memory'],
            'avg_cpu_utilization': round(avg_cpu, 2),
            'avg_memory_utilization': round(avg_memory, 2),
            'peak_cpu_utilization': round(peak_cpu, 2),
            'peak_memory_utilization': round(peak_memory, 2),
            'recommended_instance_type': best_type,
            'recommendation_action': recommendation,
            'potential_monthly_savings': round(potential_savings, 2)
        })
    
    df = pd.DataFrame(data)
    return df

if __name__ == '__main__':
    # Create datasets directory
    os.makedirs('datasets', exist_ok=True)
    
    print("Generating VM Metrics Dataset...")
    vm_metrics = generate_vm_metrics_dataset(10000)
    vm_metrics.to_csv('datasets/vm_metrics_dataset.csv', index=False)
    print(f"✓ VM Metrics Dataset saved: {len(vm_metrics)} samples")
    
    print("\nGenerating Cost Dataset...")
    cost_data = generate_cost_dataset(365)
    cost_data.to_csv('datasets/cost_dataset.csv', index=False)
    print(f"✓ Cost Dataset saved: {len(cost_data)} samples")
    
    print("\nGenerating Instance Recommendation Dataset...")
    recommendations = generate_instance_recommendation_dataset(1000)
    recommendations.to_csv('datasets/instance_recommendations_dataset.csv', index=False)
    print(f"✓ Instance Recommendation Dataset saved: {len(recommendations)} samples")
    
    print("\n" + "="*50)
    print("All datasets generated successfully!")
    print("="*50)
    print("\nDataset Summary:")
    print(f"1. VM Metrics: {len(vm_metrics)} samples, {vm_metrics.shape[1]} features")
    print(f"2. Cost Data: {len(cost_data)} samples, {cost_data.shape[1]} features")
    print(f"3. Recommendations: {len(recommendations)} samples, {recommendations.shape[1]} features")
