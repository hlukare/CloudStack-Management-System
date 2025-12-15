const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validator');
const AutomationRule = require('../models/AutomationRule');
const VM = require('../models/VM');
const logger = require('../utils/logger');

// All routes require authentication
router.use(authMiddleware);

// List automation rules
router.get('/', async (req, res) => {
  try {
    const rules = await AutomationRule.find({ userId: req.userId })
      .populate('targets.vmIds', 'name instanceId provider')
      .sort({ createdAt: -1 });
    
    res.json(rules);
  } catch (error) {
    logger.error('List automation rules error:', error);
    res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
});

// Get rule by ID
router.get('/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('targets.vmIds', 'name instanceId provider');
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    logger.error('Get automation rule error:', error);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

// Create automation rule
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('trigger.type').isIn(['metric_threshold', 'cost_threshold', 'schedule', 'event', 'anomaly']),
    body('actions').isArray({ min: 1 })
  ],
  validate,
  async (req, res) => {
    try {
      const rule = new AutomationRule({
        userId: req.userId,
        ...req.body
      });
      
      await rule.save();
      
      logger.info(`Automation rule created: ${rule.name}`);
      
      res.status(201).json({
        message: 'Automation rule created',
        rule
      });
    } catch (error) {
      logger.error('Create automation rule error:', error);
      res.status(500).json({ error: 'Failed to create rule' });
    }
  }
);

// Update automation rule
router.patch('/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    const { name, description, trigger, actions, targets, enabled } = req.body;
    
    if (name) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (trigger) rule.trigger = trigger;
    if (actions) rule.actions = actions;
    if (targets) rule.targets = targets;
    if (enabled !== undefined) rule.enabled = enabled;
    
    await rule.save();
    
    res.json({ message: 'Rule updated', rule });
  } catch (error) {
    logger.error('Update automation rule error:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Delete automation rule
router.delete('/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    logger.error('Delete automation rule error:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Toggle rule enabled/disabled
router.post('/:id/toggle', async (req, res) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    rule.enabled = !rule.enabled;
    await rule.save();
    
    res.json({
      message: `Rule ${rule.enabled ? 'enabled' : 'disabled'}`,
      enabled: rule.enabled
    });
  } catch (error) {
    logger.error('Toggle rule error:', error);
    res.status(500).json({ error: 'Failed to toggle rule' });
  }
});

// Execute rule manually
router.post('/:id/execute', async (req, res) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('targets.vmIds');
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Execute rule actions
    const results = [];
    const awsService = require('../services/awsService');
    
    for (const action of rule.actions) {
      for (const vm of rule.targets.vmIds) {
        try {
          let result;
          
          if (action.type === 'stop_instance') {
            result = await awsService.stopInstance(vm.instanceId, vm.region);
          } else if (action.type === 'start_instance') {
            result = await awsService.startInstance(vm.instanceId, vm.region);
          } else if (action.type === 'restart_instance') {
            result = await awsService.rebootInstance(vm.instanceId, vm.region);
          } else if (action.type === 'create_snapshot') {
            result = await awsService.createInstanceSnapshots(vm.instanceId, vm.region);
          }
          
          results.push({
            vmId: vm._id,
            vmName: vm.name,
            action: action.type,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            vmId: vm._id,
            vmName: vm.name,
            action: action.type,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    // Update rule execution history
    rule.lastExecuted = new Date();
    rule.executionCount += 1;
    rule.lastExecutionStatus = results.every(r => r.success) ? 'success' : 'partial';
    rule.executionHistory.push({
      executedAt: new Date(),
      status: rule.lastExecutionStatus,
      result: results
    });
    
    // Keep only last 10 execution records
    if (rule.executionHistory.length > 10) {
      rule.executionHistory = rule.executionHistory.slice(-10);
    }
    
    await rule.save();
    
    res.json({
      message: 'Rule executed',
      results
    });
  } catch (error) {
    logger.error('Execute rule error:', error);
    res.status(500).json({ error: 'Failed to execute rule' });
  }
});

// Get execution history
router.get('/:id/history', async (req, res) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule.executionHistory);
  } catch (error) {
    logger.error('Get rule history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
