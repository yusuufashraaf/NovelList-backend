const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getSuccessfulOrdersByUser,
  getSoldBooksPerCategory,
} = require("../controllers/orderController");

const { protect } = require("../controllers/authController");
const AuthenticateAdmin = require("../middlewares/AuthenticateAdmin");

//  Get current user's orders
router.get("/my-orders", protect, getSuccessfulOrdersByUser); // safe and clear
router.get("/all-orders",AuthenticateAdmin,getAllOrders)

router.get("/noofordersincategory",AuthenticateAdmin,getSoldBooksPerCategory)
module.exports = router;
