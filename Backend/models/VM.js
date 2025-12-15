const mongoose = require('mongoose');

const vmSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['aws', 'azure', 'gcp'],
    required: true
  },
  instanceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  zone: String,
  instanceType: String,
  state: {
    type: String,
    enum: ['running', 'stopped', 'pending', 'stopping', 'terminated', 'unknown'],
    default: 'unknown'
  },
  stateTransitionReason: String,
  platform: String,
  launchTime: Date,
  privateIp: String,
  publicIp: String,
  privateDnsName: String,
  publicDnsName: String,
  
  // Network details
  vpcId: String,
  subnetId: String,
  networkInterfaces: [{
    networkInterfaceId: String,
    subnetId: String,
    vpcId: String,
    privateIpAddress: String,
    publicIp: String,
    privateDnsName: String,
    status: String,
    macAddress: String,
    sourceDestCheck: Boolean,
    groups: [{
      id: String,
      name: String
    }]
  }],
  
  // Placement and availability
  availabilityZone: String,
  availabilityZoneId: String,
  tenancy: String,
  
  // Security
  securityGroups: [{
    id: String,
    name: String
  }],
  iamInstanceProfile: {
    arn: String,
    id: String
  },
  keyName: String,
  
  // Storage
  blockDevices: [{
    deviceName: String,
    volumeId: String,
    status: String,
    attachTime: Date,
    deleteOnTermination: Boolean
  }],
  volumeIds: [String],
  rootDeviceName: String,
  rootDeviceType: String,
  ebsOptimized: Boolean,
  
  // Monitoring and other details
  monitoring: String,
  architecture: String,
  virtualizationType: String,
  hibernationOptions: Boolean,
  enaSupport: Boolean,
  sriovNetSupport: String,
  
  // Instance metadata
  imageId: String,
  instanceLifecycle: String,
  spotInstanceRequestId: String,
  
  // Owner and reservation
  ownerId: String,
  requesterId: String,
  reservationId: String,
  
  // Capacity reservation
  capacityReservationId: String,
  capacityReservationSpecification: mongoose.Schema.Types.Mixed,
  
  tags: [{
    key: String,
    value: String
  }],
  
  // Monitoring metrics
  metrics: {
    cpuUtilization: Number,
    memoryUtilization: Number,
    diskUtilization: Number,
    networkIn: Number,
    networkOut: Number,
    lastUpdated: Date
  },
  
  // Cost tracking
  estimatedMonthlyCost: Number,
  actualCost: Number,
  
  // Snapshot configuration
  snapshotConfig: {
    enabled: { type: Boolean, default: true },
    schedule: String, // Cron expression
    retentionDays: { type: Number, default: 30 },
    lastSnapshotTime: Date,
    nextSnapshotTime: Date
  },
  
  // Auto-scaling configuration
  autoScaling: {
    enabled: { type: Boolean, default: false },
    minInstances: { type: Number, default: 1 },
    maxInstances: { type: Number, default: 3 },
    targetCPU: { type: Number, default: 70 },
    scaleUpThreshold: { type: Number, default: 80 },
    scaleDownThreshold: { type: Number, default: 30 }
  },
  
  // Anomaly detection
  anomalies: [{
    type: {
      type: String,
      enum: ['cpu_spike', 'memory_leak', 'cost_spike', 'unusual_traffic', 'performance_degradation']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    detectedAt: Date,
    resolved: { type: Boolean, default: false },
    resolvedAt: Date
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes
vmSchema.index({ userId: 1, provider: 1 });
vmSchema.index({ state: 1 });
vmSchema.index({ 'snapshotConfig.nextSnapshotTime': 1 });

// Update timestamp on save
vmSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('VM', vmSchema);
