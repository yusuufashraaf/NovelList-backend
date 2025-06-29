const express = require("express");
const AppError = require("../utils/AppError");
const errorHandel = require("../middlewares/errorHandel");

const app = express();

// Middleware
app.use(express.json());

// Routes
// app.use("/api/v1/users",);
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
