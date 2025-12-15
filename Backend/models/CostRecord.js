const mongoose = require('mongoose');

const costRecordSchema = new mongoose.Schema({
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
  provider: {
    type: String,
    enum: ['aws', 'azure', 'gcp'],
    required: true
  },
  resourceType: {
    type: String,
    enum: ['compute', 'storage', 'network', 'snapshot', 'lambda', 'other'],
    required: true
  },
  resourceId: String,
  
  // Cost details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Time period
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  
  // Usage metrics
  usage: {
    hours: Number,
    dataTransferGB: Number,
    storageGB: Number,
    requests: Number
  },
  
  // Optimization suggestions
  optimization: {
    potentialSavings: Number,
    recommendations: [String]
  },
  
  // Tags for categorization
  tags: [{
    key: String,
    value: String
  }],
  
  metadata: mongoose.Schema.Types.Mixed,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes
costRecordSchema.index({ userId: 1, provider: 1 });
costRecordSchema.index({ vmId: 1, periodStart: 1 });
costRecordSchema.index({ periodStart: 1, periodEnd: 1 });
costRecordSchema.index({ resourceType: 1 });

module.exports = mongoose.model('CostRecord', costRecordSchema);
