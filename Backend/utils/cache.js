const NodeCache = require('node-cache');

// Create cache instance with TTL
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false
});

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json function to cache response
    res.json = (body) => {
      cache.set(key, body, duration || parseInt(process.env.CACHE_TTL) || 300);
      return originalJson(body);
    };

    next();
  };
};

// Helper functions
const getCachedData = (key) => {
  return cache.get(key);
};

const setCachedData = (key, data, ttl) => {
  return cache.set(key, data, ttl || parseInt(process.env.CACHE_TTL) || 300);
};

const deleteCachedData = (key) => {
  return cache.del(key);
};

const clearCache = () => {
  return cache.flushAll();
};

module.exports = {
  cache,
  cacheMiddleware,
  getCachedData,
  setCachedData,
  deleteCachedData,
  clearCache
};
