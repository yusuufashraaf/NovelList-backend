require("dotenv").config();
const app = require("./app");
const connectDB = require("../config/connectDB");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});




//  for any error out of server or express like  lose connection to database or different error in promise functions
process.on("unhandledRejection", (err) => {
  console.error(`unhandledRejection error : ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});