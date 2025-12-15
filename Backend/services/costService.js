const CostRecord = require('../models/CostRecord');
const VM = require('../models/VM');
const awsService = require('./awsService');
const logger = require('../utils/logger');
const { createAlert } = require('./monitoringService');

// Get cost data for user
const getCostData = async (userId, startDate, endDate, groupBy = 'day') => {
  try {
    const query = {
      userId: userId,
      periodStart: { $gte: new Date(startDate) },
      periodEnd: { $lte: new Date(endDate) }
    };
    
    let costs = await CostRecord.find(query)
      .populate('vmId', 'name instanceId')
      .sort({ periodStart: 1 });
    
    // If no data, return mock data for demo
    if (costs.length === 0) {
      const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      costs = [];
      for (let i = 0; i < Math.min(daysDiff, 30); i++) {
        const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
        costs.push({
          date: date.toISOString().split('T')[0],
          cost: (Math.random() * 50 + 100).toFixed(2),
          provider: 'aws'
        });
      }
    }
    
    return costs;
  } catch (error) {
    logger.error('Get cost data error:', error);
    throw error;
  }
};

// Fetch and store AWS cost data
const fetchAWSCosts = async (userId, startDate, endDate) => {
  try {
    const costData = await awsService.getCostData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    const records = [];
    for (const result of costData) {
      for (const group of result.Groups) {
        const record = new CostRecord({
          userId: userId,
          provider: 'aws',
          resourceType: 'compute', // Map service to resource type
          amount: parseFloat(group.Metrics.UnblendedCost.Amount),
          currency: group.Metrics.UnblendedCost.Unit,
          periodStart: new Date(result.TimePeriod.Start),
          periodEnd: new Date(result.TimePeriod.End),
          metadata: {
            service: group.Keys[0]
          }
        });
        records.push(record);
      }
    }
    
    await CostRecord.insertMany(records);
    return records;
  } catch (error) {
    logger.error('Fetch AWS costs error:', error);
    throw error;
  }
};

// Calculate cost summary
const getCostSummary = async (userId, days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const summary = await CostRecord.aggregate([
      {
        $match: {
          userId: userId,
          periodStart: { $gte: startDate },
          periodEnd: { $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$amount' },
          byProvider: {
            $push: {
              provider: '$provider',
              amount: '$amount'
            }
          },
          byResourceType: {
            $push: {
              resourceType: '$resourceType',
              amount: '$amount'
            }
          }
        }
      }
    ]);
    
    if (summary.length === 0) {
      // Return zero cost for users with no cost data
      return {
        totalCost: 0,
        dailyAverage: 0,
        trend: 'stable',
        trendPercentage: 0,
        byProvider: [],
        byResourceType: [],
        period: { start: startDate, end: endDate }
      };
    }
    
    // Aggregate by provider
    const byProviderMap = {};
    summary[0].byProvider.forEach(item => {
      byProviderMap[item.provider] = (byProviderMap[item.provider] || 0) + item.amount;
    });
    
    // Convert to array format for frontend charts
    const byProvider = Object.keys(byProviderMap).map(provider => ({
      provider,
      cost: Math.round(byProviderMap[provider] * 100) / 100 // Round to 2 decimal places
    }));
    
    // Aggregate by resource type
    const byResourceTypeMap = {};
    summary[0].byResourceType.forEach(item => {
      byResourceTypeMap[item.resourceType] = (byResourceTypeMap[item.resourceType] || 0) + item.amount;
    });
    
    // Convert to array format for frontend charts
    const byResourceType = Object.keys(byResourceTypeMap).map(resourceType => ({
      resourceType,
      cost: Math.round(byResourceTypeMap[resourceType] * 100) / 100 // Round to 2 decimal places
    }));
    
    return {
      totalCost: Math.round(summary[0].totalCost * 100) / 100,
      dailyAverage: Math.round((summary[0].totalCost / days) * 100) / 100,
      byProvider,
      byResourceType,
      period: { start: startDate, end: endDate }
    };
  } catch (error) {
    logger.error('Get cost summary error:', error);
    throw error;
  }
};

// Check for cost anomalies
const checkCostAnomalies = async () => {
  try {
    const users = await require('../models/User').find({ isActive: true });
    
    for (const user of users) {
      // Get current month cost
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentCost = await CostRecord.aggregate([
        {
          $match: {
            userId: user._id,
            periodStart: { $gte: monthStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      // Get last month cost
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthCost = await CostRecord.aggregate([
        {
          $match: {
            userId: user._id,
            periodStart: { $gte: lastMonthStart },
            periodEnd: { $lte: lastMonthEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const current = currentCost[0]?.total || 0;
      const lastMonth = lastMonthCost[0]?.total || 0;
      
      if (lastMonth > 0) {
        const percentageIncrease = ((current - lastMonth) / lastMonth) * 100;
        const threshold = user.preferences?.alertThresholds?.cost || 30;
        
        if (percentageIncrease > threshold) {
          await createAlert({
            userId: user._id,
            alertType: 'cost_spike',
            severity: percentageIncrease > 50 ? 'high' : 'medium',
            title: 'Unusual cost increase detected',
            message: `Your costs have increased by ${percentageIncrease.toFixed(1)}% compared to last month`,
            metadata: {
              currentCost: current,
              lastMonthCost: lastMonth,
              percentageIncrease: percentageIncrease
            }
          });
        }
      }
    }
  } catch (error) {
    logger.error('Check cost anomalies error:', error);
  }
};

// Get cost optimization recommendations
const getCostOptimizations = async (userId) => {
  try {
    const recommendations = [];
    
    // Find idle VMs
    const idleVMs = await VM.find({
      userId: userId,
      state: 'running',
      'metrics.cpuUtilization': { $lt: 5 }
    });
    
    for (const vm of idleVMs) {
      recommendations.push({
        type: 'idle_vm',
        severity: 'medium',
        resource: vm.name,
        message: `VM ${vm.name} has low CPU usage (< 5%). Consider stopping it to save costs.`,
        potentialSavings: vm.estimatedMonthlyCost || 45
      });
    }
    
    // Find over-provisioned VMs
    const overProvisionedVMs = await VM.find({
      userId: userId,
      state: 'running',
      'metrics.cpuUtilization': { $lt: 20 },
      'metrics.memoryUtilization': { $lt: 30 }
    });
    
    for (const vm of overProvisionedVMs) {
      recommendations.push({
        type: 'over_provisioned',
        severity: 'low',
        resource: vm.name,
        message: `VM ${vm.name} appears over-provisioned. Consider downsizing the instance type.`,
        potentialSavings: (vm.estimatedMonthlyCost || 90) * 0.3
      });
    }
    
    // Find old snapshots
    const oldSnapshots = await require('../models/Snapshot').find({
      userId: userId,
      createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      status: 'completed'
    });
    
    if (oldSnapshots.length > 0) {
      const estimatedCost = oldSnapshots.length * 0.05; // Rough estimate
      recommendations.push({
        type: 'old_snapshots',
        severity: 'low',
        resource: 'Snapshots',
        message: `You have ${oldSnapshots.length} snapshots older than 90 days. Consider deleting unused snapshots.`,
        potentialSavings: estimatedCost
      });
    }
    
    // If no recommendations found, return mock ones for demo
    if (recommendations.length === 0) {
      recommendations.push(
        {
          type: 'idle_vm',
          severity: 'high',
          resource: 'Demo-VM-1',
          message: 'VM has been idle for 7 days. Consider stopping to save $45/month.',
          potentialSavings: 45
        },
        {
          type: 'over_provisioned',
          severity: 'medium',
          resource: 'Demo-VM-2',
          message: 'Instance appears over-provisioned (avg CPU < 20%). Downsize to save $30/month.',
          potentialSavings: 30
        },
        {
          type: 'reserved_instances',
          severity: 'low',
          resource: 'All VMs',
          message: 'Purchase reserved instances for steady workloads to save up to 40%.',
          potentialSavings: 120
        }
      );
    }
    
    return recommendations;
  } catch (error) {
    logger.error('Get cost optimizations error:', error);
    throw error;
  }
};

module.exports = {
  getCostData,
  fetchAWSCosts,
  getCostSummary,
  checkCostAnomalies,
  getCostOptimizations
};
