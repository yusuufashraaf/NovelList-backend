require("dotenv").config();
const express = require("express");
// eslint-disable-next-line import/no-extraneous-dependencies
const morgan = require("morgan");
// eslint-disable-next-line import/no-extraneous-dependencies
const cors = require('cors');
const paypalRoutes = require ("../routes/paypalRoute");


const errorHandel = require("../middlewares/errorHandel");
const AppError = require("../utils/AppError");
const categoryRouter = require("../routes/category");
const subCategoryRouter = require("../routes/subCategory");
const brandRouter = require("../routes/brand");
const productRouter = require("../routes/product");
const userRouter = require("../routes/userRoute");

const app = express();
app.use(cors());

app.use(morgan("dev"));


// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/users",userRouter);

app.use("/api/v1/categories",categoryRouter);
app.use("/api/v1/subCategories",subCategoryRouter);
app.use("/api/v1/brands",brandRouter);
app.use("/api/v1/products",productRouter);

//paypal
app.use("/buy", paypalRoutes);

// 404 handler
app.use((req,res,next)=>{
    next(new AppError(404,`can't find this route ${req.originalUrl}`));
})

// Global error handler
app.use(errorHandel)




module.exports = app;
