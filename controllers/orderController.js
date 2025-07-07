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
      select: "title author price imageCover pdfLink",
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
exports.getAllOrders = async (req,res)=>{
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
}
exports.getSoldBooksPerCategory = async (req,res) => {
  try {
    const result = await Order.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' } 
      }
    },

    { $unwind: '$books' },

    {
      $lookup: {
        from: 'products',
        localField: 'books.book',
        foreignField: '_id',
        as: 'bookDetails'
      }
    },
    { $unwind: '$bookDetails' },

    {
      $group: {
        _id: '$bookDetails.category',
        totalSold: { $sum: '$books.quantity' }
      }
    },

    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },

    {
      $project: {
        _id: 0,
        categoryid: '$categoryInfo._id', 
        categoryname: '$categoryInfo.name', 
        totalSold: 1
      }
    }
  ]);
    res.status(200).send({data:result})
  } catch (error) {

      res.status(500).json({
      status: "error",
      message: "Failed to retrieve  orders",
      error: error.message,
    })


  }
  
};
