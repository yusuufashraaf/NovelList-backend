require("dotenv").config();
const express = require("express");
// eslint-disable-next-line import/no-extraneous-dependencies
const morgan = require("morgan");
const mongoose = require("mongoose");


const errorHandel = require("../middlewares/errorHandel");
const AppError = require("../utils/AppError");
const categoryRouter = require("../routes/category");
const subCategoryRouter = require("../routes/subCategory");
const brandRouter = require("../routes/brand");
const productRouter = require("../routes/product");

const app = express();
const cors = require('cors');
app.use(cors());

app.use(morgan("dev"));

// Database connectionAdd commentMore actions
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/users", require("../routes/userRoute"));
app.use("/api/v1/auth", require("../routes/authRoute"));

app.use("/api/v1/categories",categoryRouter);
app.use("/api/v1/subCategories",subCategoryRouter);
app.use("/api/v1/brands",brandRouter);
app.use("/api/v1/products",productRouter);

//paypal
const paypalRoutes = require ("./../routes/paypalRoute");
app.use("/buy", paypalRoutes);

// 404 handler
app.use((req,res,next)=>{
    next(new AppError(404,`can't find this route ${req.originalUrl}`));
})

// Global error handler
app.use(errorHandel)




module.exports = app;
