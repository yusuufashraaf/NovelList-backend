const expressAsyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const Wishlist = require("../models/wishlist");
const Product = require("../models/product");

// Add item to wishlist
const addToWishlist = expressAsyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  //   const userId = req.user.id;
  const userId = "6868bb92b26da1d9f5c66586";

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError(404, "Product not found"));
  }

  // Find or create wishlist for user
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    // Create new wishlist
    wishlist = await Wishlist.create({
      user: userId,
      wishlistItems: [productId],
    });
  } else {
    // Check if product already exists in wishlist
    const existingItemIndex = wishlist.wishlistItems.findIndex(
      (item) => item.toString() === productId
    );

    if (existingItemIndex !== -1) {
      return next(new AppError(400, "Product already in wishlist"));
    }

    // Add new item to wishlist
    wishlist.wishlistItems.push(productId);

    await wishlist.save();
  }

  // Populate product details
  await wishlist.populate({
    path: "wishlistItems",
    select: "title imageCover author",
  });

  res.status(200).json({
    status: "success",
    message: "Item added to wishlist successfully",
    data: wishlist,
  });
});

// Get user's wishlist
const getWishlist = expressAsyncHandler(async (req, res, next) => {
  //   const userId = req.user.id;
  const userId = "6868bb92b26da1d9f5c66586";

  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "wishlistItems",
    select: "_id title imageCover author totalQuantity",
  });

  if (!wishlist) {
    return res.status(200).json({
      status: "success",
      data: {
        wishlist: [],
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      wishlistItems: wishlist.wishlistItems.map((item) => ({
        productId: item._id,
        title: item.title,
        author: item.author,
        image: item.imageCover,
      })),
      totalQuantity: wishlist.totalQuantity,
    },
  });
});

// Remove item from wishlist
const removeFromWishlist = expressAsyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  //   const userId = req.user.id;
  const userId = "6868bb92b26da1d9f5c66586";

  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    return next(new AppError(404, "Wishlist not found"));
  }

  const itemToRemove = wishlist.wishlistItems.find(
    (item) => item._id.toString() === productId
  );
  //   console.log("productId:", productId, typeof productId);
  //   console.log(itemToRemove);

  if (!itemToRemove) {
    return next(new AppError(404, "Item not found in wishlist"));
  }

  if (itemToRemove) {
    wishlist.wishlistItems = wishlist.wishlistItems.filter(
      (item) => item._id.toString() !== productId
    );

    // if the wishlist is empty, delete the wishlist
    if (wishlist.wishlistItems.length === 0) {
      await Wishlist.findByIdAndDelete(wishlist._id);
      return res.status(200).json({
        status: "success",
        message: "Wishlist deleted successfully",
      });
    }
    await wishlist.save();
  }

  await wishlist.populate({
    path: "wishlistItems",
    select: "title imageCover author",
  });

  res.status(200).json({
    status: "success",
    message: "Item removed from wishlist successfully",
    data: wishlist,
  });
});

module.exports = { addToWishlist, getWishlist, removeFromWishlist };
