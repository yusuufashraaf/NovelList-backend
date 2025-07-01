require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const paypalRoutes = require("../routes/paypalRoute");
const mongoose = require("mongoose");
const cors = require('cors');





const app = express();
app.use(cors());

const errorHandel = require("../middlewares/errorHandel");
const AppError = require("../utils/AppError");
const categoryRouter = require("../routes/category");
const subCategoryRouter = require("../routes/subCategory");
const brandRouter = require("../routes/brand");
const productRouter = require("../routes/product");

const paypalRoutes = require ("../routes/paypalRoute");


const userRouter = require("../routes/userRoute");
const qs = require("qs");





app.use(morgan("dev"));

app.set("query parser", (str) => qs.parse(str));

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/subCategories", subCategoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/products", productRouter);

//paypal
app.use("/buy", paypalRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(404, `can't find this route ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandel);

module.exports = app;
