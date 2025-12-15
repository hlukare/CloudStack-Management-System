const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
    minlength: 6
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local',
  },
  providerId: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: null
  },
  cloudAccounts: [{
    provider: {
      type: String,
      enum: ['aws', 'azure', 'gcp'],
      required: true
    },
    accountName: String,
    accountId: String,
    credentials: {
      type: mongoose.Schema.Types.Mixed,
      select: false // Don't return credentials by default
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  preferences: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    alertThresholds: {
      cpu: { type: Number, default: 80 },
      memory: { type: Number, default: 85 },
      disk: { type: Number, default: 90 },
      cost: { type: Number, default: 30 }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Skip hashing if password is not modified or provider is not local
  if (!this.isModified('password') || !this.password || this.provider !== 'local') {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to remove sensitive data
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.cloudAccounts;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
