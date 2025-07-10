const Order = require("../models/order.model");
require("../models/product");
exports.getSuccessfulOrdersByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get delivered orders for this user
    const orders = await Order.find({
      userId,
      status: "delivered",
    }).populate({
      path: "books.book",
      select: "title author price imageCover pdfLink",
    });

    // Extract and flatten all books
    const allBooks = orders.flatMap(
      (order) => order.books.map((b) => b.book).filter((book) => book) 
    );

    // Remove duplicates using Map by book ID
    const uniqueBooksMap = new Map();
    allBooks.forEach((book) => {
      if (!uniqueBooksMap.has(book._id.toString())) {
        uniqueBooksMap.set(book._id.toString(), book);
      }
    });

    const distinctBooks = Array.from(uniqueBooksMap.values());

    res.status(200).json({
      status: "success",
      results: distinctBooks.length,
      data: distinctBooks,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve successful orders",
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({});

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
exports.getSoldBooksPerCategory = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },

      { $unwind: "$books" },

      {
        $lookup: {
          from: "products",
          localField: "books.book",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },

      {
        $group: {
          _id: "$bookDetails.category",
          totalSold: { $sum: "$books.quantity" },
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },

      {
        $project: {
          _id: 0,
          categoryid: "$categoryInfo._id",
          categoryname: "$categoryInfo.name",
          totalSold: 1,
        },
      },
    ]);
    res.status(200).send({ data: result });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve  orders",
      error: error.message,
    });
  }
};
