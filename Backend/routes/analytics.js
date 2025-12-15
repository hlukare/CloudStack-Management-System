const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const VM = require('../models/VM');
const MetricData = require('../models/MetricData');
const CostRecord = require('../models/CostRecord');
const Snapshot = require('../models/Snapshot');
const Alert = require('../models/Alert');
const axios = require('axios');
const logger = require('../utils/logger');

// All routes require authentication
router.use(authMiddleware);

// Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [vmCount, snapshotCount, alertCount, totalCost] = await Promise.all([
      VM.countDocuments({ userId: req.userId, isActive: true }),
      Snapshot.countDocuments({ userId: req.userId }),
      Alert.countDocuments({ userId: req.userId, createdAt: { $gte: thirtyDaysAgo } }),
      CostRecord.aggregate([
        { $match: { userId: req.userId, periodStart: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    res.json({
      totalVMs: vmCount,
      totalSnapshots: snapshotCount,
      alertsLast30Days: alertCount,
      costLast30Days: totalCost[0]?.total || 0
    });
  } catch (error) {
    logger.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get resource utilization trends
router.get('/utilization-trends', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const trends = await MetricData.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          avgCPU: { $avg: '$metrics.cpuUtilization' },
          avgMemory: { $avg: '$metrics.memoryUtilization' },
          avgDisk: { $avg: '$metrics.diskUtilization' },
          maxCPU: { $max: '$metrics.cpuUtilization' },
          maxMemory: { $max: '$metrics.memoryUtilization' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    res.json(trends);
  } catch (error) {
    logger.error('Get utilization trends error:', error);
    res.status(500).json({ error: 'Failed to fetch utilization trends' });
  }
});

// Get cost trends
router.get('/cost-trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const trends = await CostRecord.aggregate([
      {
        $match: {
          userId: req.userId,
          periodStart: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$periodStart' } },
            provider: '$provider'
          },
          totalCost: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    res.json(trends);
  } catch (error) {
    logger.error('Get cost trends error:', error);
    res.status(500).json({ error: 'Failed to fetch cost trends' });
  }
});

// Predict resource needs (using ML API)
router.post('/predict/resources', async (req, res) => {
  try {
    const { vmId } = req.body;
    
    // Get historical data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const metrics = await MetricData.find({
      vmId: vmId,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: 1 });
    
    if (metrics.length < 50) {
      return res.json({
        message: 'Insufficient data for prediction',
        recommendation: 'Collect more data (at least 7 days) for accurate predictions'
      });
    }
    
    // Prepare data for ML model
    const data = metrics.map(m => ({
      timestamp: m.timestamp,
      cpu: m.metrics.cpuUtilization,
      memory: m.metrics.memoryUtilization,
      disk: m.metrics.diskUtilization
    }));
    
    // Call ML API
    try {
      const mlResponse = await axios.post(`${process.env.ML_API_ENDPOINT}/predict/resources`, {
        data: data
      }, { timeout: 10000 });
      
      res.json(mlResponse.data);
    } catch (mlError) {
      logger.error('ML API call failed:', mlError);
      
      // Fallback to simple statistical prediction
      const avgCPU = data.reduce((sum, d) => sum + d.cpu, 0) / data.length;
      const avgMemory = data.reduce((sum, d) => sum + d.memory, 0) / data.length;
      
      res.json({
        prediction: {
          nextDayCPU: avgCPU,
          nextDayMemory: avgMemory,
          trend: avgCPU > 70 ? 'increasing' : 'stable'
        },
        recommendation: avgCPU > 80 
          ? 'Consider upgrading instance type or scaling out'
          : 'Current resources appear adequate',
        confidence: 'low',
        note: 'ML service unavailable, using statistical fallback'
      });
    }
  } catch (error) {
    logger.error('Predict resources error:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

// Detect anomalies using ML
router.post('/detect/anomalies', async (req, res) => {
  try {
    const { vmId, days = 7 } = req.body;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const metrics = await MetricData.find({
      vmId: vmId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });
    
    if (metrics.length < 20) {
      return res.json({
        anomalies: [],
        message: 'Insufficient data for anomaly detection'
      });
    }
    
    // Call ML API for anomaly detection
    try {
      const mlResponse = await axios.post(`${process.env.ML_API_ENDPOINT}/detect/anomalies`, {
        data: metrics.map(m => ({
          timestamp: m.timestamp,
          cpu: m.metrics.cpuUtilization,
          memory: m.metrics.memoryUtilization,
          disk: m.metrics.diskUtilization
        }))
      }, { timeout: 10000 });
      
      res.json(mlResponse.data);
    } catch (mlError) {
      logger.error('ML API call failed:', mlError);
      res.json({
        anomalies: [],
        message: 'ML service unavailable',
        note: 'Using rule-based anomaly detection in monitoring service'
      });
    }
  } catch (error) {
    logger.error('Detect anomalies error:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// Get performance insights
router.get('/insights/performance', async (req, res) => {
  try {
    const vms = await VM.find({ userId: req.userId, isActive: true });
    
    const insights = [];
    
    for (const vm of vms) {
      const recentMetrics = await MetricData.find({
        vmId: vm._id,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      if (recentMetrics.length > 0) {
        const avgCPU = recentMetrics.reduce((sum, m) => 
          sum + (m.metrics.cpuUtilization || 0), 0) / recentMetrics.length;
        const avgMemory = recentMetrics.reduce((sum, m) => 
          sum + (m.metrics.memoryUtilization || 0), 0) / recentMetrics.length;
        
        const insight = {
          vmId: vm._id,
          vmName: vm.name,
          insights: []
        };
        
        if (avgCPU < 10) {
          insight.insights.push({
            type: 'underutilized',
            metric: 'CPU',
            message: 'VM is significantly underutilized. Consider downsizing or stopping.',
            savings: 'High'
          });
        }
        
        if (avgCPU > 85) {
          insight.insights.push({
            type: 'overutilized',
            metric: 'CPU',
            message: 'VM is consistently overutilized. Consider upgrading instance type.',
            impact: 'Performance degradation likely'
          });
        }
        
        if (avgMemory > 90) {
          insight.insights.push({
            type: 'memory_pressure',
            metric: 'Memory',
            message: 'High memory pressure detected. Upgrade memory or optimize applications.',
            impact: 'Critical'
          });
        }
        
        if (insight.insights.length > 0) {
          insights.push(insight);
        }
      }
    }
    
    res.json(insights);
  } catch (error) {
    logger.error('Get performance insights error:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

module.exports = router;
