const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validator');
const snapshotService = require('../services/snapshotService');
const logger = require('../utils/logger');

// All routes require authentication
router.use(authMiddleware);

// List snapshots
router.get('/', async (req, res) => {
  try {
    const { vmId, provider, status } = req.query;
    const filters = {};
    
    if (vmId) filters.vmId = vmId;
    if (provider) filters.provider = provider;
    if (status) filters.status = status;
    
    const snapshots = await snapshotService.getSnapshots(req.userId, filters);
    res.json(snapshots);
  } catch (error) {
    logger.error('List snapshots error:', error);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

// Get snapshot by ID
router.get('/:id', async (req, res) => {
  try {
    const Snapshot = require('../models/Snapshot');
    const awsService = require('../services/awsService');
    
    const snapshot = await Snapshot.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).populate('vmId', 'name instanceId provider');
    
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    
    // If snapshot is pending and provider is AWS, fetch latest status
    if (snapshot.status === 'pending' && snapshot.provider === 'aws') {
      try {
        const awsSnapshots = await awsService.listSnapshots(snapshot.instanceId, snapshot.region);
        const awsSnapshot = awsSnapshots.find(s => s.snapshotId === snapshot.snapshotId);
        
        if (awsSnapshot) {
          snapshot.status = awsSnapshot.status === 'completed' ? 'completed' : 'pending';
          snapshot.progress = awsSnapshot.progress || snapshot.progress;
          if (awsSnapshot.status === 'completed') {
            snapshot.completedAt = new Date();
          }
          await snapshot.save();
          logger.info(`Snapshot status updated: ${snapshot.snapshotId} -> ${snapshot.status}`);
        }
      } catch (awsError) {
        logger.warn('Failed to fetch AWS snapshot status:', awsError.message);
      }
    }
    
    res.json(snapshot);
  } catch (error) {
    logger.error('Get snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

// Create snapshot
router.post('/',
  [
    body('vmId').isMongoId(),
    body('description').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const { vmId, description } = req.body;
      
      const snapshots = await snapshotService.createSnapshot(
        vmId,
        req.userId,
        description
      );
      
      res.status(201).json({
        message: 'Snapshots created successfully',
        snapshots
      });
    } catch (error) {
      logger.error('Create snapshot error:', error);
      res.status(500).json({ error: error.message || 'Failed to create snapshot' });
    }
  }
);

// Delete snapshot
router.delete('/:id', async (req, res) => {
  try {
    await snapshotService.deleteSnapshot(req.params.id, req.userId);
    res.json({ message: 'Snapshot deleted successfully' });
  } catch (error) {
    logger.error('Delete snapshot error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete snapshot' });
  }
});

// Get snapshot statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await snapshotService.getSnapshotStats(req.userId);
    res.json(stats);
  } catch (error) {
    logger.error('Get snapshot stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
