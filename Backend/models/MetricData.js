const mongoose = require('mongoose');

const metricDataSchema = new mongoose.Schema({
  vmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VM',
    required: true,
    index: true
  },
  instanceId: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['aws', 'azure', 'gcp'],
    required: true
  },
  
  // Performance metrics
  metrics: {
    cpuUtilization: Number,
    memoryUtilization: Number,
    memoryUsed: Number,
    memoryTotal: Number,
    diskReadOps: Number,
    diskWriteOps: Number,
    diskReadBytes: Number,
    diskWriteBytes: Number,
    networkIn: Number,
    networkOut: Number,
    diskUtilization: Number,
    activeConnections: Number,
    processCount: Number
  },
  
  // Health indicators
  health: {
    status: {
      type: String,
      enum: ['healthy', 'warning', 'critical', 'unknown'],
      default: 'unknown'
    },
    score: Number, // 0-100
    issues: [String]
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes
metricDataSchema.index({ vmId: 1, timestamp: -1 });
metricDataSchema.index({ instanceId: 1, timestamp: -1 });
metricDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

module.exports = mongoose.model('MetricData', metricDataSchema);
