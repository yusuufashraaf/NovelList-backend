const express = require("express");
// eslint-disable-next-line import/no-extraneous-dependencies
const morgan = require("morgan");


const errorHandel = require("../middlewares/errorHandel");
const AppError = require("../utils/AppError");
const brandRouter = require("../routes/brand");

const app = express();
app.use(morgan("dev"));

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/brands",brandRouter);
// app.use("/api/v1/users",);
// app.use("/api/v1/users",);
// app.use("/api/v1/users",);
// app.use("/api/v1/users",);
// app.use("/api/v1/users",);

// Error handler


// 404 handler
app.use((req,res,next)=>{
    next(new AppError(404,`can't find this route ${req.originalUrl}`));
})

// Global error handler
app.use(errorHandel)




module.exports = app;
