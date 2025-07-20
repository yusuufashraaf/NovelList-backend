// backend/config/redisClient.js

const redis = require("redis");

// Create Redis client
const redisClient = redis.createClient();

// Handle errors
redisClient.on("error", (err) => console.error("Redis error:", err));

// Connect immediately
(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
