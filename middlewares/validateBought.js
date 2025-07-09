const Order = require("../models/order.model");
const mongoose =require('mongoose')
async function validateBought(req, res, next) {
  const { bookId, userId } = req.body;

  try {
    const order = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
      "books.book": new mongoose.Types.ObjectId(bookId)
    });

    if (order.length === 0) {
      return res.status(401).json({
        message: "You haven't bought this book",
        status: 401
      });
    }
    res.locals.isbought= true;
    next();
  } catch (err) {
    console.error("Error in validateBought:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports =validateBought;