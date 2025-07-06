const { Router } = require("express");
const Authenticate = require("../middlewares/Authenticate");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const wishlistRouter = Router();

wishlistRouter
  .route("/")
  .post(Authenticate, addToWishlist)
  .get(Authenticate, getWishlist)
  .delete(Authenticate, removeFromWishlist);

module.exports = wishlistRouter;
