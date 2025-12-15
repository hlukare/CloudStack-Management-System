const VM = require('../models/VM');
const MetricData = require('../models/MetricData');
const Alert = require('../models/Alert');
const awsService = require('./awsService');
const azureService = require('./azureService');
const gcpService = require('./gcpService');
const logger = require('../utils/logger');

// Monitor all VMs
const monitorAllVMs = async () => {
  try {
    const vms = await VM.find({ isActive: true });
    
    for (const vm of vms) {
      await monitorVM(vm);
    }
  } catch (error) {
    logger.error('Monitor all VMs error:', error);
  }
};

// Monitor single VM
const monitorVM = async (vm) => {
  try {
    let metrics = {};
    
    // Get metrics based on provider (skip if credentials not configured)
    if (vm.provider === 'aws') {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        return; // Skip if AWS credentials not configured
      }
      const metricsData = await awsService.getComprehensiveMetrics(vm.instanceId, vm.region);
      
      // Get latest data point for each metric
      const getLatest = (data) => data && data.length > 0 ? data[data.length - 1].Average : 0;
      
      metrics = {
        cpuUtilization: getLatest(metricsData.cpu),
        networkIn: getLatest(metricsData.networkIn),
        networkOut: getLatest(metricsData.networkOut),
        diskReadBytes: getLatest(metricsData.diskRead),
        diskWriteBytes: getLatest(metricsData.diskWrite)
      };
    } else if (vm.provider === 'azure') {
      if (!process.env.AZURE_SUBSCRIPTION_ID || !process.env.AZURE_TENANT_ID) {
        return; // Skip if Azure credentials not configured
      }
      // Azure implementation would go here
    } else if (vm.provider === 'gcp') {
      if (!process.env.GCP_PROJECT_ID || !process.env.GCP_KEY_FILE) {
        return; // Skip if GCP credentials not configured
      }
      // GCP implementation would go here
    }
    
    // Update VM metrics
    vm.metrics = {
      ...metrics,
      lastUpdated: new Date()
    };
    await vm.save();
    
    // Save to time-series data
    const metricData = new MetricData({
      vmId: vm._id,
      instanceId: vm.instanceId,
      provider: vm.provider,
      metrics: metrics,
      timestamp: new Date()
    });
    await metricData.save();
    
    // Check thresholds and create alerts
    await checkThresholds(vm, metrics);
    
    // Detect anomalies
    await detectAnomalies(vm, metrics);
  } catch (error) {
    logger.error(`Monitor VM ${vm.name} error:`, error);
  }
};

// Check metric thresholds
const checkThresholds = async (vm, metrics) => {
  try {
    const user = await require('../models/User').findById(vm.userId);
    if (!user) return;
    
    const thresholds = user.preferences?.alertThresholds || {
      cpu: 80,
      memory: 85,
      disk: 90
    };
    
    // CPU threshold
    if (metrics.cpuUtilization && metrics.cpuUtilization > thresholds.cpu) {
      await createAlert({
        userId: vm.userId,
        vmId: vm._id,
        alertType: 'cpu_high',
        severity: metrics.cpuUtilization > 95 ? 'critical' : 'high',
        title: `High CPU usage on ${vm.name}`,
        message: `CPU utilization is ${metrics.cpuUtilization.toFixed(2)}%, which exceeds the threshold of ${thresholds.cpu}%`,
        metadata: {
          currentValue: metrics.cpuUtilization,
          threshold: thresholds.cpu,
          instanceId: vm.instanceId,
          provider: vm.provider
        }
      });
    }
    
    // Memory threshold
    if (metrics.memoryUtilization && metrics.memoryUtilization > thresholds.memory) {
      await createAlert({
        userId: vm.userId,
        vmId: vm._id,
        alertType: 'memory_high',
        severity: metrics.memoryUtilization > 95 ? 'critical' : 'high',
        title: `High memory usage on ${vm.name}`,
        message: `Memory utilization is ${metrics.memoryUtilization.toFixed(2)}%, which exceeds the threshold of ${thresholds.memory}%`,
        metadata: {
          currentValue: metrics.memoryUtilization,
          threshold: thresholds.memory,
          instanceId: vm.instanceId
        }
      });
    }
    
    // Disk threshold
    if (metrics.diskUtilization && metrics.diskUtilization > thresholds.disk) {
      await createAlert({
        userId: vm.userId,
        vmId: vm._id,
        alertType: 'disk_high',
        severity: metrics.diskUtilization > 95 ? 'critical' : 'high',
        title: `High disk usage on ${vm.name}`,
        message: `Disk utilization is ${metrics.diskUtilization.toFixed(2)}%, which exceeds the threshold of ${thresholds.disk}%`,
        metadata: {
          currentValue: metrics.diskUtilization,
          threshold: thresholds.disk,
          instanceId: vm.instanceId
        }
      });
    }
  } catch (error) {
    logger.error('Check thresholds error:', error);
  }
};

// Detect anomalies using simple statistical methods
const detectAnomalies = async (vm, currentMetrics) => {
  try {
    // Get historical data (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const historicalData = await MetricData.find({
      vmId: vm._id,
      timestamp: { $gte: oneDayAgo }
    }).sort({ timestamp: 1 });
    
    if (historicalData.length < 10) {
      return; // Not enough data for anomaly detection
    }
    
    // Calculate mean and standard deviation for CPU
    if (currentMetrics.cpuUtilization) {
      const cpuValues = historicalData.map(d => d.metrics.cpuUtilization).filter(Boolean);
      const { mean, stdDev } = calculateStats(cpuValues);
      
      // Z-score anomaly detection (3 standard deviations)
      const zScore = Math.abs((currentMetrics.cpuUtilization - mean) / stdDev);
      
      if (zScore > 3) {
        await createAlert({
          userId: vm.userId,
          vmId: vm._id,
          alertType: 'anomaly_detected',
          severity: 'medium',
          title: `CPU anomaly detected on ${vm.name}`,
          message: `CPU usage (${currentMetrics.cpuUtilization.toFixed(2)}%) is significantly different from normal behavior (mean: ${mean.toFixed(2)}%)`,
          metadata: {
            metric: 'cpu',
            currentValue: currentMetrics.cpuUtilization,
            mean: mean,
            stdDev: stdDev,
            zScore: zScore
          }
        });
        
        // Add to VM anomalies
        vm.anomalies.push({
          type: 'cpu_spike',
          severity: 'medium',
          description: `Unusual CPU spike detected`,
          detectedAt: new Date()
        });
        await vm.save();
      }
    }
  } catch (error) {
    logger.error('Detect anomalies error:', error);
  }
};

// Helper function to calculate statistics
const calculateStats = (values) => {
  const n = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
};

// Create alert (avoid duplicates)
const createAlert = async (alertData) => {
  try {
    // Check if similar alert already exists and is active
    const existingAlert = await Alert.findOne({
      userId: alertData.userId,
      vmId: alertData.vmId,
      alertType: alertData.alertType,
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Within last hour
    });
    
    if (existingAlert) {
      return; // Don't create duplicate
    }
    
    const alert = new Alert(alertData);
    await alert.save();
    
    // Send notification
    const { sendAlertEmail } = require('../utils/emailService');
    const User = require('../models/User');
    const user = await User.findById(alertData.userId);
    
    if (user && user.preferences?.emailAlerts) {
      await sendAlertEmail(user, alert);
    }
  } catch (error) {
    logger.error('Create alert error:', error);
  }
};

module.exports = {
  monitorAllVMs,
  monitorVM,
  checkThresholds,
  detectAnomalies,
  createAlert
};
