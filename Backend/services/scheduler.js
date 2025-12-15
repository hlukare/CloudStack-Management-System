const cron = require('cron');
const VM = require('../models/VM');
const Snapshot = require('../models/Snapshot');
const awsService = require('./awsService');
const azureService = require('./azureService');
const gcpService = require('./gcpService');
const { monitorAllVMs } = require('./monitoringService');
const { checkCostAnomalies } = require('./costService');
const { cleanupExpiredSnapshots } = require('./snapshotService');
const logger = require('../utils/logger');

// Initialize all scheduled tasks
const initScheduledTasks = () => {
  // Monitor VMs every 5 minutes
  const monitoringJob = new cron.CronJob('*/5 * * * *', async () => {
    await monitorAllVMs();
  });
  monitoringJob.start();
  logger.info('VM monitoring task scheduled (every 5 minutes)');
  
  // Check for automated snapshots every hour
  const snapshotJob = new cron.CronJob('0 * * * *', async () => {
    await processAutomatedSnapshots();
  });
  snapshotJob.start();
  logger.info('Automated snapshot task scheduled (every hour)');
  
  // Clean up expired snapshots daily at 3 AM
  const cleanupJob = new cron.CronJob('0 3 * * *', async () => {
    await cleanupExpiredSnapshots();
  });
  cleanupJob.start();
  logger.info('Snapshot cleanup task scheduled (daily at 3 AM)');
  
  // Check cost anomalies daily at 6 AM
  const costCheckJob = new cron.CronJob('0 6 * * *', async () => {
    await checkCostAnomalies();
  });
  costCheckJob.start();
  logger.info('Cost anomaly check scheduled (daily at 6 AM)');
  
  // Sync VM states every 10 minutes
  const syncJob = new cron.CronJob('*/10 * * * *', async () => {
    await syncVMStates();
  });
  syncJob.start();
  logger.info('VM state sync scheduled (every 10 minutes)');
};

// Process automated snapshots
const processAutomatedSnapshots = async () => {
  try {
    const now = new Date();
    
    // Find VMs that need snapshots
    const vms = await VM.find({
      isActive: true,
      'snapshotConfig.enabled': true,
      $or: [
        { 'snapshotConfig.nextSnapshotTime': { $lte: now } },
        { 'snapshotConfig.nextSnapshotTime': null }
      ]
    });
    
    for (const vm of vms) {
      try {
        await createAutomatedSnapshot(vm);
      } catch (error) {
        logger.error(`Failed to create snapshot for VM ${vm.name}:`, error);
      }
    }
  } catch (error) {
    logger.error('Process automated snapshots error:', error);
  }
};

// Create automated snapshot for a VM
const createAutomatedSnapshot = async (vm) => {
  try {
    let snapshots = [];
    
    if (vm.provider === 'aws') {
      snapshots = await awsService.createInstanceSnapshots(vm.instanceId, vm.region);
    } else if (vm.provider === 'azure') {
      // Azure snapshot creation logic
    } else if (vm.provider === 'gcp') {
      // GCP snapshot creation logic
    }
    
    // Save snapshots to database
    for (const snapshotData of snapshots) {
      const snapshot = new Snapshot({
        userId: vm.userId,
        vmId: vm._id,
        provider: vm.provider,
        snapshotId: snapshotData.snapshotId,
        volumeId: snapshotData.volumeId,
        instanceId: vm.instanceId,
        name: `auto-${vm.name}-${Date.now()}`,
        description: `Automated snapshot for ${vm.name}`,
        region: vm.region,
        status: 'completed',
        snapshotType: 'auto',
        retentionDays: vm.snapshotConfig.retentionDays || 30
      });
      await snapshot.save();
    }
    
    // Update VM snapshot configuration
    vm.snapshotConfig.lastSnapshotTime = new Date();
    vm.snapshotConfig.nextSnapshotTime = calculateNextSnapshotTime(vm.snapshotConfig.schedule);
    await vm.save();
  } catch (error) {
    logger.error(`Create automated snapshot error for ${vm.name}:`, error);
    throw error;
  }
};

// Calculate next snapshot time based on schedule
const calculateNextSnapshotTime = (schedule) => {
  if (!schedule) {
    // Default: daily at 2 AM
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);
    return next;
  }
  
  // Parse cron schedule and calculate next time
  try {
    const cronJob = new cron.CronJob(schedule, () => {});
    return cronJob.nextDate().toDate();
  } catch (error) {
    logger.error('Calculate next snapshot time error:', error);
    // Fallback to 24 hours from now
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
};

// Sync VM states with cloud providers
const syncVMStates = async () => {
  try {
    const vms = await VM.find({ isActive: true });
    
    for (const vm of vms) {
      try {
        let currentState = 'unknown';
        
        // Skip sync if cloud credentials are not configured
        if (vm.provider === 'aws') {
          if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            continue; // Skip AWS VMs if credentials not configured
          }
          const details = await awsService.getInstanceDetails(vm.instanceId, vm.region);
          currentState = details.state;
        } else if (vm.provider === 'azure') {
          if (!process.env.AZURE_SUBSCRIPTION_ID || !process.env.AZURE_TENANT_ID) {
            continue; // Skip Azure VMs if credentials not configured
          }
          const details = await azureService.getInstanceDetails(vm.resourceGroup, vm.name);
          currentState = details.state;
        } else if (vm.provider === 'gcp') {
          if (!process.env.GCP_PROJECT_ID || !process.env.GCP_KEY_FILE) {
            continue; // Skip GCP VMs if credentials not configured
          }
          const details = await gcpService.getInstanceDetails(vm.zone, vm.name);
          currentState = details.status.toLowerCase();
        }
        
        // Update if state changed
        if (vm.state !== currentState) {
          vm.state = currentState;
          await vm.save();
          
          // Create alert if instance stopped or terminated
          if (currentState === 'stopped' || currentState === 'terminated') {
            const { createAlert } = require('./monitoringService');
            await createAlert({
              userId: vm.userId,
              vmId: vm._id,
              alertType: currentState === 'stopped' ? 'instance_stopped' : 'instance_terminated',
              severity: currentState === 'terminated' ? 'high' : 'medium',
              title: `VM ${vm.name} ${currentState}`,
              message: `Your VM ${vm.name} is now ${currentState}`,
              metadata: {
                instanceId: vm.instanceId,
                provider: vm.provider,
                previousState: vm.state,
                currentState: currentState
              }
            });
          }
        }
      } catch (error) {
        logger.error(`Sync state error for VM ${vm.name}:`, error);
      }
    }
  } catch (error) {
    logger.error('Sync VM states error:', error);
  }
};

module.exports = {
  initScheduledTasks,
  processAutomatedSnapshots,
  createAutomatedSnapshot,
  syncVMStates
};
