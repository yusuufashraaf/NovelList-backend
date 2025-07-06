const { Router } = require("express");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartEntryById,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

const cartRouter = Router();

cartRouter.route("/").post(addToCart).get(getCart).delete(clearCart);

cartRouter.route("/:productId").patch(updateCartItem).delete(removeFromCart);

cartRouter.delete("/entry/:entryId", removeCartEntryById);

module.exports = cartRouter;
