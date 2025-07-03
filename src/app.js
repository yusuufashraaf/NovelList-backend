require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const qs = require("qs");
const cloudinary = require("cloudinary").v2;

const paypalRoutes = require("../routes/paypalRoute");
const errorHandel = require("../middlewares/errorHandel");
const AppError = require("../utils/AppError");
const categoryRouter = require("../routes/category");
const subCategoryRouter = require("../routes/subCategory");
const brandRouter = require("../routes/brand");
const productRouter = require("../routes/product");
const cartRouter = require("../routes/cart");
const wishlistRouter = require("../routes/wishlist");
const commentRouter= require("../routes/commentRoute");
const userRouter = require("../routes/userRoute");

const app = express();
app.use(cors());

app.use(morgan("dev"));

app.set("query parser", (str) => qs.parse(str));

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
app.use("/buy", paypalRoutes);

// comment
app.use("/comment",commentRouter);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(404, `can't find this route ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandel);

module.exports = app;
