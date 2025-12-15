const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VM'
  },
  alertType: {
    type: String,
    enum: [
      'cpu_high',
      'memory_high', 
      'disk_high',
      'cost_spike',
      'instance_stopped',
      'instance_terminated',
      'snapshot_failed',
      'anomaly_detected',
      'security_issue',
      'performance_degradation',
      'backup_missed',
      'quota_exceeded'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'ignored'],
    default: 'active'
  },
  acknowledgedAt: Date,
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: String,
  
  // Notification tracking
  notificationsSent: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'webhook']
    },
    sentAt: Date,
    success: Boolean,
    error: String
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes
alertSchema.index({ userId: 1, status: 1 });
alertSchema.index({ vmId: 1, status: 1 });
alertSchema.index({ alertType: 1, severity: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
