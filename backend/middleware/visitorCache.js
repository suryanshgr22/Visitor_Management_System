const { getVisitorCache, setVisitorCache } = require('../config/redis');

/**
 * Middleware to check if visitor data is in Redis cache
 * If it is, return it; otherwise, proceed to the controller
 */
const checkVisitorCache = async (req, res, next) => {
  try {
    const visitorId = req.params.id;
    
    // Skip cache if explicitly requested
    if (req.query.noCache === 'true') {
      return next();
    }
    
    // Check if data exists in cache
    const cachedVisitor = await getVisitorCache(visitorId);
    
    if (cachedVisitor) {
      return res.status(200).json({
        success: true,
        message: 'Visitor details retrieved from cache',
        visitor: cachedVisitor,
        fromCache: true
      });
    }
    
    // No cache hit, proceed to controller
    next();
  } catch (error) {
    console.error('Cache middleware error:', error);
    // Proceed to controller even if cache check fails
    next();
  }
};

/**
 * Middleware to cache visitor response
 * Used after the controller has fetched the data from the database
 */
const cacheVisitorResponse = async (req, res, next) => {
  // Store the original send function
  const originalSend = res.send;
  
  // Override the send function
  res.send = function(body) {
    try {
      // Parse the body if it's a string
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      
      // Only cache successful responses with visitor data
      if (res.statusCode === 200 && parsedBody.success && parsedBody.visitor) {
        const visitorId = req.params.id;
        const expiration = parseInt(process.env.REDIS_CACHE_EXPIRATION) || 3600;
        
        // Cache the visitor data asynchronously
        setVisitorCache(visitorId, parsedBody.visitor, expiration)
          .catch(err => console.error('Error caching visitor data:', err));
      }
    } catch (error) {
      console.error('Error in cacheVisitorResponse:', error);
    }
    
    // Call the original send function
    originalSend.call(this, body);
  };
  
  next();
};

module.exports = {
  checkVisitorCache,
  cacheVisitorResponse
}; 