const http = require("http");
const User = require("../models/userAuthModel");
const app = require("./app");
const server = http.createServer(app);
const connectDB = require("../config/connectDB");
require("dotenv").config();
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

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

app.set("io", io);

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Redis adapter connected.");
  })
  .catch((err) => {
    console.error("❌ Redis connection failed:", err);
  });

const adminSocketMap = new Map();
app.set("adminSocketMap", adminSocketMap);

io.on("connection", async (socket) => {
  socket.on("connectToserver", async (token, data) => {
    const user = await User.verifyUser(token);
    if (!user) {
      socket.emit("unauthorized");
      return;
    }

    //  Admin logic
    if (user.role === "admin") {
      const userId = user._id.toString();
      adminSocketMap.set(userId, socket.id);
      socket.userId = userId;
      console.log("added the socket id to admin");
    }
    //  User logic
    if (user.role === "user") {
      console.log("client connected");
      console.log("added the socket id to user");
      if (adminSocketMap.size > 0) {
        for (const [key, value] of adminSocketMap) {
          if (data) {
            console.log("data sent to admin");
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
        `Admin with ID ${socket.userId} disconnected and removed from map.`
      );
    }
  });
});

const PORT = process.env.PORT || 3000;

const Server = server.listen(PORT, () => {
  connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});

//  for any error out of server or express like  lose connection to database or different error in promise functions
process.on("unhandledRejection", (err) => {
  console.error(`unhandledRejection error : ${err.message}`);
  Server.close(() => {
    process.exit(1);
  });
});
