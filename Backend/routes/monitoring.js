const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { monitorVM } = require('../services/monitoringService');
const VM = require('../models/VM');
const MetricData = require('../models/MetricData');
const logger = require('../utils/logger');

// All routes require authentication
router.use(authMiddleware);

// Get monitoring dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const vms = await VM.find({ userId: req.userId, isActive: true });
    
    const dashboard = {
      totalVMs: vms.length,
      runningVMs: vms.filter(vm => vm.state === 'running').length,
      stoppedVMs: vms.filter(vm => vm.state === 'stopped').length,
      vmsByProvider: {
        aws: vms.filter(vm => vm.provider === 'aws').length,
        azure: vms.filter(vm => vm.provider === 'azure').length,
        gcp: vms.filter(vm => vm.provider === 'gcp').length
      },
      healthStatus: {
        healthy: vms.filter(vm => vm.metrics?.cpuUtilization < 70).length,
        warning: vms.filter(vm => vm.metrics?.cpuUtilization >= 70 && vm.metrics?.cpuUtilization < 90).length,
        critical: vms.filter(vm => vm.metrics?.cpuUtilization >= 90).length
      },
      activeAnomalies: vms.reduce((sum, vm) => 
        sum + vm.anomalies.filter(a => !a.resolved).length, 0
      )
    };
    
    res.json(dashboard);
  } catch (error) {
    logger.error('Get monitoring dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get real-time metrics for a VM
router.get('/vm/:id/realtime', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    // Trigger fresh monitoring
    await monitorVM(vm);
    
    // Get latest metrics
    const latestMetrics = await MetricData.findOne({ 
      vmId: vm._id 
    }).sort({ timestamp: -1 });
    
    res.json(latestMetrics || { message: 'No metrics available yet' });
  } catch (error) {
    logger.error('Get realtime metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch realtime metrics' });
  }
});

// Get historical metrics
router.get('/vm/:id/history', async (req, res) => {
  try {
    const { hours = 24, metric } = req.query;
    
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    
    const metrics = await MetricData.find({
      vmId: vm._id,
      timestamp: { $gte: startTime, $lte: endTime }
    }).sort({ timestamp: 1 });
    
    // If specific metric requested, extract only that metric
    if (metric) {
      const data = metrics.map(m => ({
        timestamp: m.timestamp,
        value: m.metrics[metric]
      })).filter(d => d.value !== undefined);
      
      return res.json(data);
    }
    
    res.json(metrics);
  } catch (error) {
    logger.error('Get historical metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch historical metrics' });
  }
});

// Get system health summary
router.get('/health/summary', async (req, res) => {
  try {
    const vms = await VM.find({ userId: req.userId, isActive: true });
    
    const healthSummary = vms.map(vm => ({
      vmId: vm._id,
      name: vm.name,
      provider: vm.provider,
      state: vm.state,
      metrics: vm.metrics,
      health: calculateHealthScore(vm.metrics),
      lastUpdated: vm.metrics?.lastUpdated
    }));
    
    res.json(healthSummary);
  } catch (error) {
    logger.error('Get health summary error:', error);
    res.status(500).json({ error: 'Failed to fetch health summary' });
  }
});

// Helper function to calculate health score
const calculateHealthScore = (metrics) => {
  if (!metrics) return { status: 'unknown', score: 0 };
  
  let score = 100;
  const issues = [];
  
  if (metrics.cpuUtilization > 90) {
    score -= 30;
    issues.push('High CPU usage');
  } else if (metrics.cpuUtilization > 70) {
    score -= 15;
    issues.push('Elevated CPU usage');
  }
  
  if (metrics.memoryUtilization > 90) {
    score -= 30;
    issues.push('High memory usage');
  } else if (metrics.memoryUtilization > 80) {
    score -= 15;
    issues.push('Elevated memory usage');
  }
  
  if (metrics.diskUtilization > 90) {
    score -= 25;
    issues.push('High disk usage');
  } else if (metrics.diskUtilization > 80) {
    score -= 10;
    issues.push('Elevated disk usage');
  }
  
  let status = 'healthy';
  if (score < 50) status = 'critical';
  else if (score < 70) status = 'warning';
  
  return { status, score: Math.max(0, score), issues };
};

module.exports = router;
