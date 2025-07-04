const Order = require("../models/order.model");

exports.getSuccessfulOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({
      user: userId,
      status: "success", // or whatever your "completed" status is called
    }).populate("books.book", "title author price imageCover");

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
