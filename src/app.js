const express = require("express");
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/user.routes"));

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

module.exports = app;
