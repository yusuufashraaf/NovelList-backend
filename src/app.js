require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const qs = require("qs");
const helmet = require("helmet");
const sanitizeMongoInput = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const limiter = require("express-rate-limit");

const cloudinary = require("cloudinary").v2;
const orderRouter = require("../routes/orderRoute");

const paypalRoutes = require("../routes/paypalRoute");
const errorHandel = require("../middlewares/errorHandel");
const AppError = require("../utils/AppError");
const categoryRouter = require("../routes/category");
const subCategoryRouter = require("../routes/subCategory");
const brandRouter = require("../routes/brand");
const productRouter = require("../routes/product");
const cartRouter = require("../routes/cart");
const wishlistRouter = require("../routes/wishlist");
const commentRouter = require("../routes/commentRoute");
const userRouter = require("../routes/userRoute");

// swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

const app = express();

app.use(cors());
app.use(limiter);
app.use(helmet());
app.use(sanitizeMongoInput);
app.use(xss());
app.use(hpp());

app.use(morgan("dev"));

app.set("query parser", (str) => qs.parse(str));

// Middleware
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
//
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Routes
app.use("/api/v1/users", require("../routes/userRoute"));
app.use("/api/v1/auth", require("../routes/authRoute"));
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/subCategories", subCategoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/comments", commentRouter);

//paypal
app.use("/buy", paypalRoutes);

// comment
app.use("/comment", commentRouter);
app.use("/api/v1/comment", commentRouter);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(404, `can't find this route ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandel);

module.exports = app;
