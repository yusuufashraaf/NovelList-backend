const express = require("express");
const AppError = require("../utils/AppError");

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
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use((req,res,next)=>{
    next(new AppError(404,`can't find this route ${req.originalUrl}`));
})


module.exports = app;
