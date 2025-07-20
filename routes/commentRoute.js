const Router = require("express");
const mongoose = require("mongoose");
const router = new Router();
const Comment = require("../models/comment");
const Product = require("../models/product");
const commentController = require("../controllers/commentController");
const validateComment = require("../middlewares/validateComment");
const Authenticate = require("../middlewares/Authenticate");
const validateBought = require("../middlewares/validateBought")
const validateReviewedBefore = require("../middlewares/validateReviewedBefore")
const Order = require("../models/order.model")
router.post("/create",Authenticate ,validateBought,validateReviewedBefore,validateComment, async (req, res) => {
  try {

    
    const comment = new Comment({
        ...req.body,
        userId: res.locals.userid,
    });
    
    const savedComment = await commentController.createComment(comment);
    console.log(savedComment);

    res.status(201).json({
      status: "Success",
      message: "comment created successfully",
      data: savedComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid book ID format" });
  }

  const bookExists = await Product.findById(id);
  if (!bookExists) {
    return res.status(404).json({ error: "book not found" });
  }

  try {
    const comments = await commentController.listComments(id);
    const avgReviewperbook = commentController.getAverageReview(comments);
    res.status(200).json({
      comments: comments,
      count: comments.length,
      avgRate: avgReviewperbook,
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", Authenticate, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid comment ID format" });
  }
  const commentExists = await Comment.findById(id);
  if (!commentExists) {
    return res.status(404).json({ error: "comment not found" });
  }
  try {
    const commentDeleted = await commentController.deleteComment(
      req.params.id,
      req.user._id
    );
    res.json(commentDeleted);
  } catch (error) {
    console.error("Error deleteing comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/comments/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const userComments = await commentController.getUserComments(
      req.params.userId
    );
    res.json(userComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// /comment/check?userId=${userId}&bookId=${bookId}
router.get("/check/:bookId",Authenticate,async (req, res) => {

  const { bookId } = req.params;
  const userId =res.locals.userid;
  
  try {
    
    // Convert IDs
    const userObjId = new mongoose.Types.ObjectId(userId);
    const bookObjId = new mongoose.Types.ObjectId(bookId);

    // Check if book is bought
    const order = await Order.find({
      userId: userObjId,
      "books.book": bookObjId
    });

    const isBought = order.length > 0 &&  order[0].status === 'processing';

    
    // Check if user has commented
    const comment = await Comment.find({
      userId: userObjId,
      bookId: bookObjId
    });

    const isReviewed = comment.length>0;

    res.status(200).json({
      isBought,
      isReviewed
    });

  } catch (err) {
    console.error("Error in /check route:", err.message);
    res.status(500).json({ message: "Server error, try again later" });
  }
});

router.put("/:id", Authenticate, async (req, res) => {
  const commentId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ error: "Invalid comment ID format" });
  }

  try {
    const updated = await commentController.updateComment(commentId, userId, {
      comment: req.body.comment,
      rate: req.body.rate,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Comment not found or not authorized" });
    }

    res.status(200).json({
      status: "Success",
      message: "Comment updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;
