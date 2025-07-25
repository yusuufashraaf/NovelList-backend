require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const qs = require("qs");
const passport = require("passport");
require("../config/passport");
// const helmet = require("helmet");
// const sanitizeMongoInput = require("express-mongo-sanitize");
// const xss = require("xss-clean");
// const hpp = require("hpp");
// const limiter = require("express-rate-limit");

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
const aiRouter = require("../routes/aiRoute");
const commentRouter = require("../routes/commentRoute");
const userRouter = require("../routes/userRoute");
const contact = require("../routes/contactRoute");

// swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

const app = express();

// app.use(limiter);
// app.use(helmet());
// app.use(sanitizeMongoInput);
// app.use(xss());
// app.use(hpp());

const allowedOrigins = [
  "http://localhost:4200",
  "https://novel-nest-two.vercel.app", // ✅ your actual frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(morgan("dev"));

app.set("query parser", (str) => qs.parse(str));

// Middleware
app.use(express.json());
app.use(passport.initialize());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//
// swagger docs
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
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/contactUs", contact);

// paypal
app.use("/buy", paypalRoutes);

// comment
app.use("/api/v1/comment", commentRouter);

//  Root route to fix 404 when visiting /
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: " NovelNest backend is up and running!",
  });
});

// 404 handler
app.use((req, res, next) => {
  next(new AppError(404, `can't find this route ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandel);

module.exports = app;