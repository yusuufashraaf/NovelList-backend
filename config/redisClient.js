const { createClient } = require("redis");

let pubClient, subClient;

// Pub/Sub for Socket.IO
async function createRedisAdapterClients() {
  pubClient = createClient({ url: process.env.REDIS_URL });
  subClient = pubClient.duplicate();

  try {
    await pubClient.connect();
    await subClient.connect();
    console.log(" Redis pub/sub clients connected");
  } catch (err) {
    console.error(" Redis pub/sub connection failed:", err.message);
  }

  return { pubClient, subClient };
}

// Regular key-value Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on("error", (err) => console.error("Redis error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis key-value client connected");
  } catch (err) {
    console.error(" Redis key-value connection failed:", err.message);
  }
})();

module.exports = {
  createRedisAdapterClients,
  redisClient,
};
