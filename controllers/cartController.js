const expressAsyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const Cart = require("../models/cart");
const Product = require("../models/product");
const expiryDuration = 60 * 1000;

// Add item to cart
const addToCart = expressAsyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  console.log("Received body:", req.body);

  const userId = req.user.id;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError(404, "Product not found"));
  }

  if (product.quantity < quantity) {
    return next(new AppError(400, "Out of stock"));
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      cartItems: [
        {
          product: productId,
          quantity: quantity,
          price: product.price,
          itemEntry: Array.from({ length: quantity }, () => ({
            productId,
            addedAt: Date.now(),
            expiresAt: new Date(Date.now() + expiryDuration),
          })),
        },
      ],
    });
  } else {
    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.cartItems[existingItemIndex].quantity += quantity;
      cart.cartItems[existingItemIndex].subTotalPrice =
        cart.cartItems[existingItemIndex].quantity *
        cart.cartItems[existingItemIndex].price;

      cart.cartItems[existingItemIndex].itemEntry.push({
        productId: productId,
        addedAt: Date.now(),
        expiresAt: new Date(Date.now() + expiryDuration),
      });
    } else {
      const itemEntries = Array.from({ length: quantity }, () => ({
        productId: productId,
        addedAt: Date.now(),
        expiresAt: new Date(Date.now() + expiryDuration),
      }));

      cart.cartItems.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        subTotalPrice: quantity * product.price,
        itemEntry: itemEntries,
      });
    }

    await cart.save();
  }

  // IMPORTANT: populate here after save to reflect changes clearly
  await cart.populate({
    path: "cartItems.product",
    select: "title imageCover price priceAfterDiscount author",
  });

  res.status(200).json({
    status: "success",
    message: "Item added to cart successfully",
    data: {
      cartItems: cart.cartItems.map((item) => ({
        productId: item.product._id,
        title: item.product.title,
        author: item.product.author,
        image: item.product.imageCover,
        price: item.product.price,
        quantity: item.quantity,
        subTotal: item.subTotalPrice,
        itemEntries: item.itemEntry, // <-- Clearly included
      })),
      totalPrice: cart.totalPrice,
      totalQuantity: cart.totalQuantity,
    },
  });

  product.quantity -= quantity;
  await product.save();
});

// Get user's cart ─ cleans expired entries on the fly
const getCart = expressAsyncHandler(async (req, res, next) => {
  // In production replace with: const userId = req.user.id;
  const userId = req.user.id;

  // 1) Fetch cart + product data
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "cartItems.product",
    select: "_id title imageCover price priceAfterDiscount quantity author",
  });

  // If user has no cart yet
  if (!cart) {
    return res.status(200).json({
      status: "success",
      message: "Cart is empty",
      data: { cartItems: [], totalPrice: 0, totalQuantity: 0 },
    });
  }

  // 2) Remove expired entries & recalc quantities/sub-totals
  let cartChanged = false;

  for (const item of cart.cartItems) {
    const before = item.itemEntry.length;

    // keep only still-valid entries
    item.itemEntry = item.itemEntry.filter(
      (entry) => entry.expiresAt > Date.now()
    );

    const expiredCount = before - item.itemEntry.length;

    if (expiredCount > 0) {
      cartChanged = true;
      item.quantity = item.itemEntry.length;
      item.subTotalPrice = item.quantity * item.price;

      // Restore product quantity for expired entries
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += expiredCount;
        await product.save();
      }
    }
  }

  // Remove items whose quantity became 0
  if (cartChanged) {
    cart.cartItems = cart.cartItems.filter((item) => item.quantity > 0);
    await cart.save();
    await cart.populate({
      path: "cartItems.product",
      select: "_id title imageCover price priceAfterDiscount quantity author",
    });
  }

  // 4) Send cleaned-up cart to client
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
        itemEntries: item.itemEntry,
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
  const userId = req.user.id;

  if (!productId) {
    return next(new AppError(400, "ProductId is required"));
  }

  if (!quantity || quantity < 1) {
    return next(new AppError(400, "Quantity must be at least 1"));
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError(404, "Cart not found"));
  }

  const cartItem = cart.cartItems.find(
    (item) => item.product.toString() === productId
  );
  if (!cartItem) {
    return next(new AppError(404, "Item not found in cart"));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError(404, "Product not found"));
  }

  const oldQuantity = cartItem.quantity;
  const diff = quantity - oldQuantity;

  if (diff > 0) {
    if (product.quantity < diff) {
      return next(new AppError(400, "Out of stock"));
    }
    product.quantity -= diff;

    // Add new itemEntries explicitly when increasing quantity
    for (let i = 0; i < diff; i++) {
      cartItem.itemEntry.push({
        productId: productId,
        addedAt: new Date(),
        expiresAt: new Date(Date.now() + expiryDuration),
      });
    }
  } else if (diff < 0) {
    product.quantity += Math.abs(diff);

    // Remove itemEntries explicitly when decreasing quantity
    cartItem.itemEntry.splice(diff); // removes |diff| entries from the end
  }

  await product.save();

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
    data: {
      cartItems: cart.cartItems.map((item) => ({
        productId: item.product._id,
        title: item.product.title,
        author: item.product.author,
        image: item.product.imageCover,
        price: item.product.price,
        quantity: item.quantity,
        subTotal: item.subTotalPrice,
        itemEntries: item.itemEntry, // Clearly show updated itemEntries
      })),
      totalPrice: cart.totalPrice,
      totalQuantity: cart.totalQuantity,
    },
  });
});

// Remove item from cart
const removeFromCart = expressAsyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!productId) {
    return next(new AppError(400, "ProductId is required"));
  }
  //   const userId = req.user.id;
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError(404, "Cart not found"));
  }

  const itemToRemove = cart.cartItems.find(
    (item) => item.product.toString() === productId
  );
  if (itemToRemove) {
    const product = await Product.findById(productId);
    if (product) {
      product.quantity += itemToRemove.quantity;
      await product.save();
    }
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
  const userId = req.user.id;

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
