const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// All routes require authentication
router.use(authMiddleware);

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { status, severity, alertType, limit = 50 } = req.query;
    const query = { userId: req.userId };
    
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (alertType) query.alertType = alertType;
    
    const alerts = await Alert.find(query)
      .populate('vmId', 'name instanceId provider')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(alerts);
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert counts by status
router.get('/counts', async (req, res) => {
  try {
    const counts = await Alert.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      active: 0,
      acknowledged: 0,
      resolved: 0,
      ignored: 0
    };
    
    counts.forEach(c => {
      result[c._id] = c.count;
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Get alert counts error:', error);
    res.status(500).json({ error: 'Failed to fetch alert counts' });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).populate('vmId', 'name instanceId provider');
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    logger.error('Get alert error:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.userId;
    await alert.save();
    
    res.json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    logger.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve alert
router.post('/:id/resolve', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const alert = await Alert.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.userId;
    if (notes) alert.resolutionNotes = notes;
    await alert.save();
    
    res.json({ message: 'Alert resolved', alert });
  } catch (error) {
    logger.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Bulk update alerts
router.post('/bulk/update', async (req, res) => {
  try {
    const { alertIds, action } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ error: 'alertIds array is required' });
    }
    
    const update = {};
    if (action === 'acknowledge') {
      update.status = 'acknowledged';
      update.acknowledgedAt = new Date();
      update.acknowledgedBy = req.userId;
    } else if (action === 'resolve') {
      update.status = 'resolved';
      update.resolvedAt = new Date();
      update.resolvedBy = req.userId;
    } else if (action === 'ignore') {
      update.status = 'ignored';
    }
    
    const result = await Alert.updateMany(
      { _id: { $in: alertIds }, userId: req.userId },
      update
    );
    
    res.json({ 
      message: `${result.modifiedCount} alerts updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error('Bulk update alerts error:', error);
    res.status(500).json({ error: 'Failed to update alerts' });
  }
});

// Delete old resolved alerts
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const result = await Alert.deleteMany({
      userId: req.userId,
      status: 'resolved',
      resolvedAt: { $lt: cutoffDate }
    });
    
    res.json({
      message: `Deleted ${result.deletedCount} old alerts`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    logger.error('Cleanup alerts error:', error);
    res.status(500).json({ error: 'Failed to cleanup alerts' });
  }
});

module.exports = router;
