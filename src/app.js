require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const qs = require("qs");
const passport = require("passport");

// Load Passport config
require("../config/passport");

// Cloudinary
const cloudinary = require("cloudinary").v2;

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

// Custom error handling
const errorHandel = require("../middlewares/errorHandel");
const AppError = require("../utils/AppError");

// Routers
const orderRouter = require("../routes/orderRoute");
const paypalRoutes = require("../routes/paypalRoute");
const categoryRouter = require("../routes/category");
const subCategoryRouter = require("../routes/subCategory");
const brandRouter = require("../routes/brand");
const productRouter = require("../routes/product");
const cartRouter = require("../routes/cart");
const wishlistRouter = require("../routes/wishlist");
const commentRouter = require("../routes/commentRoute");
const userRouter = require("../routes/userRoute");
const authRouter = require("../routes/authRoute");

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.set("query parser", (str) => qs.parse(str));
app.use(express.json());
app.use(passport.initialize());

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Swagger API Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/subCategories", subCategoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/buy", paypalRoutes);

// Optional: second route for comments (if needed)
app.use("/api/v1/comment", commentRouter);

// ✅ Health check root route to fix 404 on Replit
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "✅ NovelNest backend is up and running!",
  });
});

// 404 handler (after all routes)
app.use((req, res, next) => {
  next(new AppError(404, `can't find this route ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandel);

module.exports = app;
