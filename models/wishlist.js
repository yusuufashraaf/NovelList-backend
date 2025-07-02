const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    wishlistItems: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
      },
    ],
    totalQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

wishlistSchema.pre("save", async function (next) {
  const wishlistItems = this.wishlistItems;
  const totalQuantity = wishlistItems.length;
  this.totalQuantity = totalQuantity;
  next();
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;
