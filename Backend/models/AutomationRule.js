const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Trigger conditions
  trigger: {
    type: {
      type: String,
      enum: ['metric_threshold', 'cost_threshold', 'schedule', 'event', 'anomaly'],
      required: true
    },
    conditions: {
      metric: String, // cpu, memory, disk, etc.
      operator: String, // gt, lt, eq
      value: Number,
      duration: Number // minutes
    },
    schedule: String // Cron expression
  },
  
  // Actions to perform
  actions: [{
    type: {
      type: String,
      enum: [
        'stop_instance',
        'start_instance', 
        'restart_instance',
        'create_snapshot',
        'resize_instance',
        'send_alert',
        'scale_up',
        'scale_down',
        'run_script'
      ],
      required: true
    },
    parameters: mongoose.Schema.Types.Mixed
  }],
  
  // Target resources
  targets: {
    vmIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VM'
    }],
    tags: [{
      key: String,
      value: String
    }],
    provider: String,
    region: String
  },
  
  // Rule status
  enabled: {
    type: Boolean,
    default: true
  },
  
  // Execution tracking
  lastExecuted: Date,
  executionCount: {
    type: Number,
    default: 0
  },
  lastExecutionStatus: {
    type: String,
    enum: ['success', 'failed', 'partial']
  },
  lastExecutionError: String,
  
  executionHistory: [{
    executedAt: Date,
    status: String,
    result: mongoose.Schema.Types.Mixed,
    error: String
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
automationRuleSchema.index({ userId: 1, enabled: 1 });
automationRuleSchema.index({ 'trigger.type': 1 });

// Update timestamp
automationRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
