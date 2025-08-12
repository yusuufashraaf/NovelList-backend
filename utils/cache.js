const redisClient = require("../config/redisClient"); // Adjust path as needed

const invalidateProductCache = async () => {
  try {
    const keys = await redisClient.keys("products:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`✅ Redis cache invalidated: ${keys.length} keys removed.`);
    }
  } catch (err) {
    console.error("❌ Redis cache invalidation failed:", err);
  }
};

const clearProductCache = async () => {
  try {
    const keys = await redisClient.keys("products:*");
    if (keys.length) {
      await redisClient.del(keys);
      console.log(`✅ Cleared ${keys.length} product cache key(s).`);
    }
  } catch (err) {
    console.error("❌ Redis cache clearing error:", err);
  }
};

module.exports = { clearProductCache };

module.exports = { invalidateProductCache };
