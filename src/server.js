const http = require("http");
const User = require("../models/userAuthModel");
const app = require("./app");
const server = http.createServer(app);
const connectDB = require("../config/connectDB");
require("dotenv").config();

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:4200',
    credentials: true
  }
});
app.set('io', io);

const adminSocketMap = new Map();

io.on("connection", async (socket) => {

  socket.on("connectToserver", async (token,data) => {
    const user = await User.verifyUser(token);
    if (!user) {
      socket.emit("unauthorized");
      return;
    }

    //  Admin logic
    if (user.role === 'admin') {
      const userId = user._id.toString();
      adminSocketMap.set(userId, socket.id);
      socket.userId = userId; 
      console.log("added the socket id to admin");
    }
    //  User logic
    if (user.role === 'user') {
      if(adminSocketMap.size >0){
        for(const [key, value] of adminSocketMap){
          if(data){
            io.to(value).emit("newNotification",data);
          }
        }
      }
    }
  });

  
  socket.on("disconnect", () => {
    if (socket.userId && adminSocketMap.has(socket.userId)) {
      adminSocketMap.delete(socket.userId);
      console.log(`Admin with ID ${socket.userId} disconnected and removed from map.`);
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