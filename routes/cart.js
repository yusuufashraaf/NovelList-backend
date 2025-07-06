const { Router } = require("express");
const Authenticate = require("../middlewares/Authenticate");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

const cartRouter = Router();

cartRouter
  .route("/")
  .post(Authenticate, addToCart)
  .get(Authenticate, getCart)
  .delete(Authenticate, clearCart);

cartRouter
  .route("/:productId")
  .patch(Authenticate, updateCartItem)
  .delete(Authenticate, removeFromCart);

module.exports = cartRouter;
