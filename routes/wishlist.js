const { Router } = require("express");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const wishlistRouter = Router();

wishlistRouter
  .route("/")
  .post(addToWishlist)
  .get(getWishlist)
  .delete(removeFromWishlist);

module.exports = wishlistRouter;
