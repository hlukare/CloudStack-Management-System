const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VM',
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['aws', 'azure', 'gcp'],
    required: true
  },
  snapshotId: {
    type: String,
    required: true,
    unique: true
  },
  volumeId: String,
  instanceId: {
    type: String,
    required: true
  },
  name: String,
  description: String,
  region: {
    type: String,
    required: true
  },
  size: Number, // in GB (Full snapshot size)
  volumeSize: Number, // Volume size in GB
  status: {
    type: String,
    enum: ['pending', 'completed', 'error', 'deleted'],
    default: 'pending'
  },
  progress: {
    type: String,
    default: '0%'
  },
  startTime: Date, // When snapshot started
  snapshotType: {
    type: String,
    enum: ['manual', 'scheduled', 'auto'],
    default: 'manual'
  },
  storageTier: {
    type: String,
    enum: ['standard', 'archive'],
    default: 'standard'
  },
  
  // Retention management
  retentionDays: {
    type: Number,
    default: 30
  },
  expiresAt: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Encryption metadata
  encryption: {
    enabled: Boolean,
    keyId: String, // KMS key ID
    keyAlias: String // KMS key alias
  },
  
  // AWS specific fields
  outpostArn: String,
  ownerId: String,
  
  // Metadata
  tags: [{
    key: String,
    value: String
  }],
  
  // Cost tracking
  estimatedCost: Number,
  
  // Restore information
  restores: [{
    restoredAt: Date,
    restoredTo: String, // Instance ID or volume ID
    success: Boolean,
    notes: String
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date,
  deletedAt: Date,
  
  errorMessage: String
});

// Indexes
snapshotSchema.index({ userId: 1, vmId: 1 });
snapshotSchema.index({ instanceId: 1 });
snapshotSchema.index({ expiresAt: 1 });
snapshotSchema.index({ status: 1 });
snapshotSchema.index({ provider: 1, region: 1 });

// Set expiration date before saving
snapshotSchema.pre('save', function(next) {
  if (this.isNew && this.retentionDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + this.retentionDays);
    this.expiresAt = expirationDate;
  }
  next();
});

// Virtual for days until expiration
snapshotSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diff = this.expiresAt - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Snapshot', snapshotSchema);
