const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getSuccessfulOrdersByUser,
} = require("../controllers/orderController");

const { protect } = require("../controllers/authController");

//  Get current user's orders
router.get("/my-orders", protect, getSuccessfulOrdersByUser); // safe and clear

module.exports = router;
