# Redis Cache Implementation

This document explains the Redis caching strategy used in the Visitor Management System to improve performance and reduce database load.

## Overview

Redis is used to cache visitor details to:
- Reduce database load
- Improve response times for frequently accessed data
- Maintain data consistency across the application

## Configuration

Redis connection settings are defined in the `.env` file:

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CACHE_EXPIRATION=3600
USE_REDIS=true|false  # Set to false to use in-memory fallback
```

## Cache Structure

The cache stores visitor details using the following key pattern:
- `visitor:{visitorId}` - Contains visitor information serialized as JSON

## Cache Operations

### 1. Caching Process

The system caches visitor details in the following scenarios:
- When a visitor checks in
- When a visitor checks out
- When visitor details are explicitly requested via API

### 2. Cache Invalidation

The cache is invalidated in the following scenarios:
- When a visitor's status is updated (approval, decline)
- When a visitor's badge is generated
- When a new visitor is added
- When visitor information is modified

### 3. Cache TTL (Time to Live)

Cached data has a default expiration time of 3600 seconds (1 hour), configurable via the `REDIS_CACHE_EXPIRATION` environment variable.

## Graceful Fallback

The system includes a graceful fallback mechanism when Redis is unavailable:

1. **Automatic Detection**: The system automatically detects if Redis is unavailable
2. **In-Memory Cache**: Falls back to an in-memory cache implementation
3. **Transparent Operation**: API continues to work without interruption
4. **Configuration Option**: Can be explicitly configured to use in-memory cache with `USE_REDIS=false`

This provides several benefits:
- Development without Redis installation
- Resilience against Redis outages
- Seamless operation in environments without Redis

## Implementation Details

### Files and Components

1. **Redis Configuration**
   - Located at: `config/redis.js`
   - Handles Redis client setup and connection management
   - Provides helper functions for cache operations
   - Includes fallback mechanism for in-memory caching

2. **Caching Middleware**
   - Located at: `middleware/visitorCache.js`
   - `checkVisitorCache`: Checks if visitor data exists in cache
   - `cacheVisitorResponse`: Captures and caches API responses

3. **Controller Integration**
   - Updated controllers to:
     - Invalidate cache when visitor data changes
     - Update cache with fresh data after operations

## API Endpoints with Caching

- `GET /api/gate/visitor/:id` - Retrieves visitor details with caching

## Test Endpoints

The following endpoints are available for testing the cache functionality:

### Public Endpoints (No Authentication Required)

- `GET /api/gate/cache/public/status` - Get cache status and statistics
- `POST /api/gate/cache/public/test` - Add test data to the cache

### Protected Endpoints (Authentication Required)

- `GET /api/gate/cache/status` - Get cache status and statistics
- `POST /api/gate/cache/flush` - Flush the entire cache
- `POST /api/gate/cache/test/:id` - Cache a specific visitor's data

## Monitoring and Debugging

The implementation includes detailed logging for cache operations:
- Cache hits and misses
- Cache invalidation events
- Cache errors
- Redis connection events

Example log messages:
```
Redis disabled by configuration. Using in-memory cache instead.
Cached visitor in memory: test-key
Memory cache hit for visitor: test-key
```

## Performance Considerations

- Cache expiration is set to balance data freshness and performance
- Cache is bypassed when requesting fresh data with the `?noCache=true` query parameter
- Asynchronous cache operations ensure API response times aren't affected by caching operations
- In-memory cache provides good performance for single-server deployments 