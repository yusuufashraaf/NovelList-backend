const Comment = require("../models/comment");
const mongoose =require('mongoose');

async function validateReviewedBefore(req, res, next) {
  const { bookId, userId } = req.body;

  try {
    const comment = await Comment.find({
      userId: new mongoose.Types.ObjectId(userId),
      bookId:new mongoose.Types.ObjectId(bookId)
    });


    if (comment.length !== 0) {
      return res.status(401).json({
        message: "You Reviewed before",
        status: 401
      });
    }
    res.locals.isReviewed = false;
    next();
  } catch (err) {
    console.error("Error in validateBought:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports =validateReviewedBefore;