const mongoose = require("mongoose");

const itemEntrySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "Product is required"],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
  },
});

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    itemEntry: [itemEntrySchema],
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    subTotalPrice: {
      type: Number,
      default: function () {
        return this.price * this.quantity;
      },
    },
  },
  { timestamps: true }
);

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    cartItems: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

CartSchema.pre("save", async function (next) {
  const cartItems = this.cartItems;
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.subTotalPrice,
    0
  );
  this.totalPrice = totalPrice;
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  this.totalQuantity = totalQuantity;
  next();
});

const Cart = mongoose.model("Cart", CartSchema);

module.exports = Cart;
