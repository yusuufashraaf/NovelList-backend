const http = require("http");
const User = require("../models/userAuthModel");
const app = require("./app");
const server = http.createServer(app);
const connectDB = require("../config/connectDB");
require("dotenv").config();

const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

// --- Socket.IO setup ---
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:4200",
      "https://novel-nest-two.vercel.app",
      "https://1d8f222f-e6cd-4b30-8295-eee3fc85c4bc-00-x25a0w5n7axr.janeway.replit.dev",
    ],
    credentials: true,
  },
});

// Attach io to app (for controllers to emit events if needed)
app.set("io", io);

// --- Redis Pub/Sub (for Socket.IO adapter) ---
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Redis adapter connected.");
  })
  .catch((err) => {
    console.error("❌ Redis connection failed:", err.message);
  });

// --- Redis Key-Value client (for caching) ---
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on("error", (err) => console.error("Redis error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis key-value client connected");
  } catch (err) {
    console.error("❌ Redis key-value connection failed:", err.message);
  }
})();

// Store admin sockets
const adminSocketMap = new Map();
app.set("adminSocketMap", adminSocketMap);

// --- Socket.IO events ---
io.on("connection", async (socket) => {
  socket.on("connectToserver", async (token, data) => {
    const user = await User.verifyUser(token);
    if (!user) {
      socket.emit("unauthorized");
      return;
    }

    // Admin logic
    if (user.role === "admin") {
      const userId = user._id.toString();
      adminSocketMap.set(userId, socket.id);
      socket.userId = userId;
      console.log("✅ Added admin socket:", userId);
    }

    // User logic
    if (user.role === "user") {
      console.log("✅ User connected:", user._id.toString());
      if (adminSocketMap.size > 0) {
        for (const [key, value] of adminSocketMap) {
          if (data) {
            console.log("📢 Sending notification to admin:", key);
            io.to(value).emit("newNotification", data);
          }
        }
      }
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId && adminSocketMap.has(socket.userId)) {
      adminSocketMap.delete(socket.userId);
      console.log(
        `⚠️ Admin with ID ${socket.userId} disconnected and removed from map.`
      );
    }
  });
});

// --- Server start ---
const PORT = process.env.PORT || 3000;
const Server = server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// --- Global error handling ---
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  Server.close(() => {
    process.exit(1);
  });
});

// Export redisClient for controllers
module.exports = { redisClient };
