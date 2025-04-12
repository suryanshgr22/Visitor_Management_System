const redis = require('redis');
const { promisify } = require('util');

// In-memory cache fallback
const memoryCache = new Map();

// Check if Redis should be enabled
const useRedis = process.env.USE_REDIS === 'true';

// Create Redis client if enabled
let client;
let getAsync;
let setexAsync;
let delAsync;

if (useRedis) {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands
          console.error('Redis connection refused. Using memory cache fallback.');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          // End reconnecting with built in error
          return undefined;
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Promisify Redis commands
    getAsync = promisify(client.get).bind(client);
    setexAsync = promisify(client.setex).bind(client);
    delAsync = promisify(client.del).bind(client);

    // Log Redis connection events
    client.on('connect', () => {
      console.log('Redis client connected');
    });

    client.on('error', (err) => {
      console.error('Redis error:', err.message);
      console.log('Falling back to in-memory cache');
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    console.log('Using in-memory cache instead');
  }
} else {
  console.log('Redis disabled by configuration. Using in-memory cache instead.');
}

// Set visitor cache with expiration
const setVisitorCache = async (visitorId, visitorData, expirationInSeconds = 3600) => {
  try {
    if (useRedis && client && client.connected) {
      await setexAsync(
        `visitor:${visitorId}`,
        expirationInSeconds,
        JSON.stringify(visitorData)
      );
      console.log(`Cached visitor in Redis: ${visitorId}`);
    } else {
      // Fallback to in-memory cache
      memoryCache.set(`visitor:${visitorId}`, {
        data: visitorData,
        expiry: Date.now() + (expirationInSeconds * 1000)
      });
      console.log(`Cached visitor in memory: ${visitorId}`);
    }
    return true;
  } catch (error) {
    console.error('Cache setVisitorCache error:', error.message);
    
    // Fallback to in-memory cache on error
    memoryCache.set(`visitor:${visitorId}`, {
      data: visitorData,
      expiry: Date.now() + (expirationInSeconds * 1000)
    });
    console.log(`Fallback: Cached visitor in memory: ${visitorId}`);
    
    return true;
  }
};

// Get visitor from cache
const getVisitorCache = async (visitorId) => {
  try {
    if (useRedis && client && client.connected) {
      const cachedVisitor = await getAsync(`visitor:${visitorId}`);
      if (cachedVisitor) {
        console.log(`Redis cache hit for visitor: ${visitorId}`);
        return JSON.parse(cachedVisitor);
      }
    } else {
      // Check in-memory cache
      const memCached = memoryCache.get(`visitor:${visitorId}`);
      if (memCached && memCached.expiry > Date.now()) {
        console.log(`Memory cache hit for visitor: ${visitorId}`);
        return memCached.data;
      } else if (memCached) {
        // Expired entry
        memoryCache.delete(`visitor:${visitorId}`);
      }
    }
    
    console.log(`Cache miss for visitor: ${visitorId}`);
    return null;
  } catch (error) {
    console.error('Cache getVisitorCache error:', error.message);
    
    // Fallback to in-memory cache on error
    const memCached = memoryCache.get(`visitor:${visitorId}`);
    if (memCached && memCached.expiry > Date.now()) {
      console.log(`Fallback: Memory cache hit for visitor: ${visitorId}`);
      return memCached.data;
    }
    
    return null;
  }
};

// Invalidate visitor cache
const invalidateVisitorCache = async (visitorId) => {
  try {
    if (useRedis && client && client.connected) {
      await delAsync(`visitor:${visitorId}`);
      console.log(`Invalidated Redis cache for visitor: ${visitorId}`);
    }
    
    // Always clear memory cache
    memoryCache.delete(`visitor:${visitorId}`);
    console.log(`Invalidated memory cache for visitor: ${visitorId}`);
    
    return true;
  } catch (error) {
    console.error('Cache invalidateVisitorCache error:', error.message);
    
    // Still try to clear memory cache on error
    memoryCache.delete(`visitor:${visitorId}`);
    
    return false;
  }
};

// Function to flush all cache (for testing)
const flushCache = async () => {
  try {
    if (useRedis && client && client.connected) {
      await promisify(client.flushall).bind(client)();
      console.log('Redis cache flushed');
    }
    
    // Clear memory cache
    memoryCache.clear();
    console.log('Memory cache flushed');
    
    return true;
  } catch (error) {
    console.error('Error flushing cache:', error.message);
    return false;
  }
};

// Function to get cache stats (for monitoring)
const getCacheStats = async () => {
  const stats = {
    type: useRedis && client && client.connected ? 'redis' : 'memory',
    memorySize: memoryCache.size,
    memoryKeys: Array.from(memoryCache.keys())
  };
  
  return stats;
};

module.exports = {
  client,
  setVisitorCache,
  getVisitorCache,
  invalidateVisitorCache,
  flushCache,
  getCacheStats
}; 