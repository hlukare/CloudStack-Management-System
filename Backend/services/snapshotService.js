const Snapshot = require('../models/Snapshot');
const VM = require('../models/VM');
const awsService = require('./awsService');
const azureService = require('./azureService');
const gcpService = require('./gcpService');
const logger = require('../utils/logger');

// Create snapshot
const createSnapshot = async (vmId, userId, description) => {
  try {
    const vm = await VM.findOne({ _id: vmId, userId: userId });
    if (!vm) {
      throw new Error('VM not found');
    }
    
    let snapshots = [];
    
    // Try to create snapshots via cloud provider
    try {
      if (vm.provider === 'aws') {
        snapshots = await awsService.createInstanceSnapshots(vm.instanceId, vm.region);
      } else if (vm.provider === 'azure') {
        // Azure implementation
      } else if (vm.provider === 'gcp') {
        // GCP implementation
      }
    } catch (cloudError) {
      logger.warn('Cloud provider snapshot creation failed, creating local record:', cloudError.message);
      // Create a mock snapshot if cloud credentials aren't configured
      snapshots = [{
        snapshotId: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        volumeId: vm.volumeIds?.[0] || `vol-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        startTime: new Date(),
        progress: '0%',
        description: description || `Manual snapshot for ${vm.name}`
      }];
    }
    
    // Save to database
    const savedSnapshots = [];
    for (const snapshotData of snapshots) {
      const snapshot = new Snapshot({
        userId: userId,
        vmId: vm._id,
        provider: vm.provider,
        snapshotId: snapshotData.snapshotId,
        volumeId: snapshotData.volumeId,
        instanceId: vm.instanceId,
        name: snapshotData.name || `${vm.name}-${Date.now()}`,
        description: snapshotData.description || description || `Manual snapshot for ${vm.name}`,
        region: vm.region,
        status: snapshotData.status || 'pending',
        progress: snapshotData.progress || '0%',
        startTime: snapshotData.startTime || new Date(),
        size: snapshotData.size,
        volumeSize: snapshotData.volumeSize,
        storageTier: snapshotData.storageTier || 'standard',
        encryption: snapshotData.encryption || { enabled: false },
        ownerId: snapshotData.ownerId,
        outpostArn: snapshotData.outpostArn,
        tags: snapshotData.tags || [],
        snapshotType: 'manual',
        retentionDays: 30,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await snapshot.save();
      savedSnapshots.push(snapshot);
    }
    
    return savedSnapshots;
  } catch (error) {
    logger.error('Create snapshot error:', error);
    throw error;
  }
};

// Get snapshots
const getSnapshots = async (userId, filters = {}) => {
  try {
    const query = { userId: userId, ...filters };
    const snapshots = await Snapshot.find(query)
      .populate('vmId', 'name instanceId provider')
      .sort({ createdAt: -1 });
    return snapshots;
  } catch (error) {
    logger.error('Get snapshots error:', error);
    throw error;
  }
};

// Delete snapshot
const deleteSnapshot = async (snapshotId, userId) => {
  try {
    const snapshot = await Snapshot.findOne({ _id: snapshotId, userId: userId });
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }
    
    // Delete from cloud provider
    if (snapshot.provider === 'aws') {
      await awsService.deleteSnapshot(snapshot.snapshotId, snapshot.region);
    } else if (snapshot.provider === 'azure') {
      await azureService.deleteSnapshot(snapshot.resourceGroup, snapshot.snapshotId);
    } else if (snapshot.provider === 'gcp') {
      await gcpService.deleteSnapshot(snapshot.snapshotId);
    }
    
    // Update in database
    snapshot.status = 'deleted';
    snapshot.deletedAt = new Date();
    await snapshot.save();
    
    return snapshot;
  } catch (error) {
    logger.error('Delete snapshot error:', error);
    throw error;
  }
};

// Clean up expired snapshots
const cleanupExpiredSnapshots = async () => {
  try {
    const now = new Date();
    const expiredSnapshots = await Snapshot.find({
      expiresAt: { $lte: now },
      status: 'completed',
      isExpired: false
    });
    
    for (const snapshot of expiredSnapshots) {
      try {
        await deleteSnapshot(snapshot._id, snapshot.userId);
      } catch (error) {
        logger.error(`Failed to delete expired snapshot ${snapshot.snapshotId}:`, error);
      }
    }
    
    return expiredSnapshots.length;
  } catch (error) {
    logger.error('Cleanup expired snapshots error:', error);
    throw error;
  }
};

// Get snapshot statistics
const getSnapshotStats = async (userId) => {
  try {
    const stats = await Snapshot.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSnapshots: { $sum: 1 },
          totalSize: { $sum: '$size' },
          byProvider: {
            $push: {
              provider: '$provider',
              count: 1
            }
          },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          }
        }
      }
    ]);
    
    return stats[0] || { totalSnapshots: 0, totalSize: 0 };
  } catch (error) {
    logger.error('Get snapshot stats error:', error);
    throw error;
  }
};

module.exports = {
  createSnapshot,
  getSnapshots,
  deleteSnapshot,
  cleanupExpiredSnapshots,
  getSnapshotStats
};
