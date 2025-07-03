const expressAsyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const Cart = require("../models/cart");
const Product = require("../models/product");

// Add item to cart
const addToCart = expressAsyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  //   const userId = req.user.id; // Assuming you have user authentication
  const userId = "686304a6b8fa343b7fd6e3b9";

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError(404, "Product not found"));
  }

  // Check if product has enough stock
  if (product.quantity < quantity) {
    return next(new AppError(400, "Out of stock"));
  }

  // Find or create cart for user
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    // Create new cart
    cart = await Cart.create({
      user: userId,
      cartItems: [
        {
          product: productId,
          quantity: quantity,
          price: product.price,
        },
      ],
    });
  } else {
    // Check if product already exists in cart
    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity of existing item
      cart.cartItems[existingItemIndex].quantity += quantity;
      cart.cartItems[existingItemIndex].subTotalPrice =
        cart.cartItems[existingItemIndex].quantity *
        cart.cartItems[existingItemIndex].price;
    } else {
      // Add new item to cart
      cart.cartItems.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        subTotalPrice: quantity * product.price,
      });
    }

    await cart.save();
  }

  // Populate product details
  await cart.populate({
    path: "cartItems.product",
    select: "title imageCover price priceAfterDiscount author",
  });

  // After cart is saved
  product.quantity -= quantity;
  await product.save();

  res.status(200).json({
    status: "success",
    message: "Item added to cart successfully",
    data: cart,
  });
});

// Get user's cart
const getCart = expressAsyncHandler(async (req, res, next) => {
  //   const userId = req.user.id;
  const userId = "686304a6b8fa343b7fd6e3b9";

  const cart = await Cart.findOne({ user: userId }).populate({
    path: "cartItems.product",
    select: "_id title imageCover price priceAfterDiscount quantity author",
  });

  if (!cart) {
    return res.status(200).json({
      status: "success",
      message: "Cart is empty",
      data: {
        cartItems: [],
        totalPrice: 0,
        totalQuantity: 0,
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      cartItems: cart.cartItems.map((item) => ({
        productId: item.product._id,
        title: item.product.title,
        author: item.product.author,
        image: item.product.imageCover,
        price: item.product.price,
        quantity: item.quantity,
        subTotal: item.subTotalPrice,
      })),
      totalPrice: cart.totalPrice,
      totalQuantity: cart.totalQuantity,
    },
  });
});

// Update cart item quantity
const updateCartItem = expressAsyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  //   const userId = req.user.id;
  const userId = "686304a6b8fa343b7fd6e3b9";

  if (!quantity || quantity < 1) {
    return next(new AppError(400, "Quantity must be at least 1"));
  }

  // Find the cart for the user
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError(404, "Cart not found"));
  }

  // Find the cart item
  const cartItem = cart.cartItems.find(
    (item) => item.product.toString() === productId
  );
  if (!cartItem) {
    return next(new AppError(404, "Item not found in cart"));
  }

  // Find the product
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError(404, "Product not found"));
  }

  // Calculate the difference between new and old quantity
  const oldQuantity = cartItem.quantity;
  const diff = quantity - oldQuantity;

  // If increasing quantity, check stock
  if (diff > 0) {
    if (product.quantity < diff) {
      return next(new AppError(400, "Out of stock"));
    }
    product.quantity -= diff;
  } else if (diff < 0) {
    // If decreasing quantity, return stock
    product.quantity += Math.abs(diff);
  }
  await product.save();

  // Update cart item
  cartItem.quantity = quantity;
  cartItem.subTotalPrice = quantity * cartItem.price;

  await cart.save();

  await cart.populate({
    path: "cartItems.product",
    select: "title imageCover price priceAfterDiscount author",
  });

  res.status(200).json({
    status: "success",
    message: "Cart item updated successfully",
    data: cart,
  });
});

// Remove item from cart
const removeFromCart = expressAsyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  //   const userId = req.user.id;
  const userId = "686304a6b8fa343b7fd6e3b9";

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError(404, "Cart not found"));
  }

  const itemToRemove = cart.cartItems.find(
    (item) => item.product.toString() === productId
  );
  if (itemToRemove) {
    const product = await Product.findById(productId);
    product.quantity += itemToRemove.quantity;
    await product.save();
  }

  cart.cartItems = cart.cartItems.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();

  await cart.populate({
    path: "cartItems.product",
    select: "title imageCover price priceAfterDiscount",
  });

  res.status(200).json({
    status: "success",
    message: "Item removed from cart successfully",
    data: cart,
  });
});

// Clear entire cart
const clearCart = expressAsyncHandler(async (req, res, next) => {
  //   const userId = req.user.id;
  const userId = "686304a6b8fa343b7fd6e3b9";

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError(404, "Cart not found"));
  }

  cart.cartItems = [];
  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Cart cleared successfully",
    data: cart,
  });
});

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
