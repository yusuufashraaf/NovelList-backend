
const mongoose = require("mongoose");
const  dotenv = require("dotenv");

dotenv.config();


const  connectDB = async ()=> {
  try {
    const conn = await mongoose.connect(process.env.DB_URL);
    console.log(`Connected to DB: ${conn.connection.name}`);
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1);
  }
}
 module.exports = connectDB;