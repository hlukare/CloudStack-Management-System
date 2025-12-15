const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const costService = require('../services/costService');
const logger = require('../utils/logger');
const { cacheMiddleware } = require('../utils/cache');

// All routes require authentication
router.use(authMiddleware);

// Get cost summary
router.get('/summary', cacheMiddleware(300), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const summary = await costService.getCostSummary(req.userId, parseInt(days));
    res.json(summary);
  } catch (error) {
    logger.error('Get cost summary error:', error);
    res.status(500).json({ error: 'Failed to fetch cost summary' });
  }
});

// Get detailed cost data
router.get('/detailed', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    const costs = await costService.getCostData(
      req.userId,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json(costs);
  } catch (error) {
    logger.error('Get detailed costs error:', error);
    res.status(500).json({ error: 'Failed to fetch cost data' });
  }
});

// Get cost optimizations
router.get('/optimizations', async (req, res) => {
  try {
    const recommendations = await costService.getCostOptimizations(req.userId);
    res.json(recommendations);
  } catch (error) {
    logger.error('Get cost optimizations error:', error);
    res.status(500).json({ error: 'Failed to fetch optimizations' });
  }
});

// Fetch fresh cost data from AWS
router.post('/fetch/aws', async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const records = await costService.fetchAWSCosts(req.userId, startDate, endDate);
    
    res.json({
      message: 'AWS costs fetched successfully',
      recordCount: records.length
    });
  } catch (error) {
    logger.error('Fetch AWS costs error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch AWS costs';
    let statusCode = 500;
    
    if (error.message) {
      if (error.message.includes('AccessDenied') || error.message.includes('UnauthorizedOperation')) {
        errorMessage = 'AWS Permission Error: Enable Cost Explorer and add ce:GetCostAndUsage permission to your IAM user';
        statusCode = 403;
      } else if (error.message.includes('not subscribed') || error.message.includes('Cost Explorer')) {
        errorMessage = 'Cost Explorer not enabled in your AWS account. Enable it in AWS Billing console';
        statusCode = 400;
      } else if (error.message.includes('credentials')) {
        errorMessage = 'AWS credentials error. Check your AWS access key and secret';
        statusCode = 401;
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Fetch fresh cost data from Azure
router.post('/fetch/azure', async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // For now, return a message that Azure cost fetching is not implemented
    // In production, you would implement Azure Cost Management API integration
    res.json({
      message: 'Azure cost fetching will be available when Azure credentials are configured',
      recordCount: 0
    });
  } catch (error) {
    logger.error('Fetch Azure costs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Azure costs',
      message: error.message
    });
  }
});

// Fetch fresh cost data from GCP
router.post('/fetch/gcp', async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // For now, return a message that GCP cost fetching is not implemented
    // In production, you would implement GCP Cloud Billing API integration
    res.json({
      message: 'GCP cost fetching will be available when GCP credentials are configured',
      recordCount: 0
    });
  } catch (error) {
    logger.error('Fetch GCP costs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch GCP costs',
      message: error.message
    });
  }
});

// Get cost forecast
router.get('/forecast', async (req, res) => {
  try {
    // Get last 30 days of costs
    const summary = await costService.getCostSummary(req.userId, 30);
    
    // Simple forecast: average daily cost * 30
    const dailyAverage = summary.totalCost / 30;
    const forecastedMonthlyCost = dailyAverage * 30;
    
    // Calculate trend
    const lastWeekSummary = await costService.getCostSummary(req.userId, 7);
    const weeklyAverage = lastWeekSummary.totalCost / 7;
    const trend = ((weeklyAverage - dailyAverage) / dailyAverage) * 100;
    
    res.json({
      currentMonthCost: summary.totalCost,
      forecastedMonthlyCost: parseFloat(forecastedMonthlyCost.toFixed(2)),
      dailyAverage: parseFloat(dailyAverage.toFixed(2)),
      trend: parseFloat(trend.toFixed(1)),
      trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
    });
  } catch (error) {
    logger.error('Get cost forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

module.exports = router;
