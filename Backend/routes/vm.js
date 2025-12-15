const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validator');
const VM = require('../models/VM');
const awsService = require('../services/awsService');
const azureService = require('../services/azureService');
const gcpService = require('../services/gcpService');
const { monitorVM } = require('../services/monitoringService');
const logger = require('../utils/logger');
const { cacheMiddleware } = require('../utils/cache');

// All routes require authentication
router.use(authMiddleware);

// List VMs
router.get('/', async (req, res) => {
  try {
    const { provider, state } = req.query;
    const query = { userId: req.userId, isActive: true };
    
    if (provider) query.provider = provider;
    if (state) query.state = state;
    
    const vms = await VM.find(query).sort({ createdAt: -1 });
    res.json(vms);
  } catch (error) {
    logger.error('List VMs error:', error);
    res.status(500).json({ error: 'Failed to fetch VMs' });
  }
});

// Get VM by ID
router.get('/:id', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    res.json(vm);
  } catch (error) {
    logger.error('Get VM error:', error);
    res.status(500).json({ error: 'Failed to fetch VM' });
  }
});

// Sync VMs from cloud provider
router.post('/sync',
  [
    body('provider').isIn(['aws', 'azure', 'gcp']),
    body('region').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const { provider, region } = req.body;
      let instances = [];
      
      // Try to fetch from cloud provider
      try {
        if (provider === 'aws') {
          instances = await awsService.listInstances(region);
        } else if (provider === 'azure') {
          instances = await azureService.listInstances();
        } else if (provider === 'gcp') {
          instances = await gcpService.listInstances();
        }
      } catch (cloudError) {
        logger.error('Cloud provider sync error:', cloudError);
        return res.status(400).json({ 
          error: `Cloud provider credentials not configured for ${provider.toUpperCase()}. Please configure your cloud credentials in the backend .env file or add VMs manually using "Add VM by ID".` 
        });
      }
      
      // Save or update VMs in database
      const savedVMs = [];
      for (const instance of instances) {
        let vm = await VM.findOne({ 
          instanceId: instance.instanceId,
          userId: req.userId 
        });
        
        if (vm) {
          // Update existing
          Object.assign(vm, instance);
          vm.updatedAt = new Date();
        } else {
          // Create new
          vm = new VM({
            userId: req.userId,
            provider: provider,
            region: region,
            ...instance
          });
        }
        
        await vm.save();
        savedVMs.push(vm);
      }
      
      res.json({
        message: `Synced ${savedVMs.length} VMs`,
        vms: savedVMs
      });
    } catch (error) {
      logger.error('Sync VMs error:', error);
      res.status(500).json({ error: 'Failed to sync VMs' });
    }
  }
);

// Normalize AWS region (remove availability zone suffix)
const normalizeRegion = (region, provider) => {
  if (provider === 'aws') {
    // Remove zone suffix (e.g., eu-north-1a -> eu-north-1)
    return region.replace(/[a-z]$/, '');
  }
  return region;
};

// Add VM by Instance ID
router.post('/add-by-id',
  [
    body('provider').isIn(['aws', 'azure', 'gcp']),
    body('instanceId').notEmpty().trim(),
    body('region').notEmpty().trim(),
    body('name').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      let { provider, instanceId, region, name } = req.body;
      
      // Normalize region and extract zone
      const originalRegion = region;
      region = normalizeRegion(region, provider);
      const zone = provider === 'aws' ? originalRegion : null;
      
      // Check if VM already exists
      const existingVM = await VM.findOne({ 
        instanceId, 
        userId: req.userId 
      });
      
      if (existingVM && existingVM.isActive) {
        return res.status(400).json({ error: 'VM already exists in your list' });
      }
      
      // If VM was soft-deleted, reactivate it
      if (existingVM && !existingVM.isActive) {
        existingVM.isActive = true;
        existingVM.name = name || existingVM.name;
        existingVM.region = region;
        existingVM.zone = zone;
        existingVM.updatedAt = new Date();
        await existingVM.save();
        
        logger.info(`VM reactivated: ${instanceId} for user ${req.userId}`);
        
        return res.status(200).json({
          message: 'VM reactivated successfully',
          vm: existingVM
        });
      }
      
      let vmData = {};
      
      // Try to fetch VM details from cloud provider, but don't fail if credentials aren't configured
      try {
        if (provider === 'aws') {
          const instances = await awsService.listInstances(region);
          const found = instances.find(i => i.instanceId === instanceId);
          if (found) {
            vmData = found;
          }
        } else if (provider === 'azure') {
          const instances = await azureService.listInstances();
          const found = instances.find(i => i.instanceId === instanceId);
          if (found) {
            vmData = found;
          }
        } else if (provider === 'gcp') {
          const instances = await gcpService.listInstances();
          const found = instances.find(i => i.name === instanceId);
          if (found) {
            vmData = found;
          }
        }
      } catch (cloudError) {
        logger.warn('Could not fetch from cloud provider:', cloudError.message);
        // Continue with basic VM data
      }
      
      // Create VM record with provided or fetched data
      const vm = new VM({
        userId: req.userId,
        provider,
        region, // Normalized region (e.g., eu-north-1)
        zone, // Original zone if provided (e.g., eu-north-1a)
        instanceId,
        name: name || vmData.name || `VM-${instanceId}`,
        ...vmData, // Spread all fetched data including new fields
        // Override specific fields if provided
        ...(name && { name }),
      });
      
      await vm.save();
      
      logger.info(`VM added by ID: ${instanceId} for user ${req.userId}`);
      
      res.status(201).json({
        message: 'VM added successfully',
        vm
      });
    } catch (error) {
      logger.error('Add VM by ID error:', error);
      res.status(500).json({ error: error.message || 'Failed to add VM' });
    }
  }
);

// Refresh VM details from cloud provider
router.post('/:id/refresh', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    let vmData;
    
    // Fetch latest details from cloud provider
    if (vm.provider === 'aws') {
      const instances = await awsService.listInstances(vm.region);
      vmData = instances.find(i => i.instanceId === vm.instanceId);
    } else if (vm.provider === 'azure') {
      const instances = await azureService.listInstances();
      vmData = instances.find(i => i.instanceId === vm.instanceId);
    } else if (vm.provider === 'gcp') {
      const instances = await gcpService.listInstances();
      vmData = instances.find(i => i.name === vm.instanceId);
    }
    
    if (!vmData) {
      return res.status(404).json({ error: 'VM not found in cloud provider' });
    }
    
    // Update VM with latest data
    Object.assign(vm, vmData);
    vm.updatedAt = new Date();
    await vm.save();
    
    logger.info(`VM refreshed: ${vm.instanceId} for user ${req.userId}`);
    
    res.json({
      message: 'VM details refreshed successfully',
      vm
    });
  } catch (error) {
    logger.error('Refresh VM error:', error);
    res.status(500).json({ error: error.message || 'Failed to refresh VM details' });
  }
});

// Start VM
router.post('/:id/start', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    let result;
    if (vm.provider === 'aws') {
      result = await awsService.startInstance(vm.instanceId, vm.region);
    } else if (vm.provider === 'azure') {
      result = await azureService.startInstance(vm.resourceGroup, vm.name);
    } else if (vm.provider === 'gcp') {
      result = await gcpService.startInstance(vm.zone, vm.name);
    }
    
    vm.state = 'pending';
    await vm.save();
    
    res.json({ message: 'VM start initiated', result });
  } catch (error) {
    logger.error('Start VM error:', error);
    res.status(500).json({ error: 'Failed to start VM' });
  }
});

// Stop VM
router.post('/:id/stop', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    let result;
    if (vm.provider === 'aws') {
      result = await awsService.stopInstance(vm.instanceId, vm.region);
    } else if (vm.provider === 'azure') {
      result = await azureService.stopInstance(vm.resourceGroup, vm.name);
    } else if (vm.provider === 'gcp') {
      result = await gcpService.stopInstance(vm.zone, vm.name);
    }
    
    vm.state = 'stopping';
    await vm.save();
    
    res.json({ message: 'VM stop initiated', result });
  } catch (error) {
    logger.error('Stop VM error:', error);
    res.status(500).json({ error: 'Failed to stop VM' });
  }
});

// Restart VM
router.post('/:id/restart', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    let result;
    if (vm.provider === 'aws') {
      result = await awsService.rebootInstance(vm.instanceId, vm.region);
    } else if (vm.provider === 'azure') {
      result = await azureService.restartInstance(vm.resourceGroup, vm.name);
    } else if (vm.provider === 'gcp') {
      result = await gcpService.resetInstance(vm.zone, vm.name);
    }
    
    res.json({ message: 'VM restart initiated', result });
  } catch (error) {
    logger.error('Restart VM error:', error);
    res.status(500).json({ error: 'Failed to restart VM' });
  }
});

// Update VM configuration
router.patch('/:id', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    const { snapshotConfig, autoScaling, tags } = req.body;
    
    if (snapshotConfig) {
      vm.snapshotConfig = { ...vm.snapshotConfig, ...snapshotConfig };
    }
    
    if (autoScaling) {
      vm.autoScaling = { ...vm.autoScaling, ...autoScaling };
    }
    
    if (tags) {
      vm.tags = tags;
    }
    
    await vm.save();
    
    res.json({ message: 'VM updated', vm });
  } catch (error) {
    logger.error('Update VM error:', error);
    res.status(500).json({ error: 'Failed to update VM' });
  }
});

// Get VM metrics
router.get('/:id/metrics', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    const { hours = 24 } = req.query;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    
    const MetricData = require('../models/MetricData');
    const metrics = await MetricData.find({
      vmId: vm._id,
      timestamp: { $gte: startTime, $lte: endTime }
    }).sort({ timestamp: 1 });
    
    res.json(metrics);
  } catch (error) {
    logger.error('Get VM metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Delete VM from tracking
router.delete('/:id', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }
    
    vm.isActive = false;
    await vm.save();
    
    res.json({ message: 'VM removed from tracking' });
  } catch (error) {
    logger.error('Delete VM error:', error);
    res.status(500).json({ error: 'Failed to delete VM' });
  }
});

module.exports = router;
