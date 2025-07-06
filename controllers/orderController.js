const Order = require("../models/order.model");
require("../models/product");
exports.getSuccessfulOrdersByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({
      user: userId,
      status: "delivered",
    });

    // Log book IDs
    orders.forEach((order) => {
      order.books.forEach((item) => {});
    });

    // Now populate
    await Order.populate(orders, {
      path: "books.book",
      select: "title author price imageCover",
    });

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve successful orders",
      error: error.message,
    });
  }
};
