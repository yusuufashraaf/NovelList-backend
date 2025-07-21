const Comment = require("../models/comment");
const mongoose = require("mongoose");
const UserAuth = require("../models/userAuthModel");
const Logger = require('../services/loggerService');
const { log } = require("console");
const logger = new Logger('comment.controller');
const createComment = async (comment) => {
  try {
    logger.info("Creating comment:", comment);
    const savedComment = await comment.save();
    return savedComment;
  } catch (error) {
    logger.error("Error saving comment:", error);
    console.error("Error saving comment in controller:", error);
    throw error;
  }
};

const listComments = async (id) => {
  try {
     logger.info("Listing comments for book ID:", id);
    const comments = await Comment.find({ bookId: id }).populate(
      "userId",
      "name"
    );
    return comments;
  } catch (error) {
    logger.error("Error listing comments:", error);
    throw error;
  }
};
const getAverageReview = (comments) => {
  logger.info("Calculating average review");
  if (!comments || comments.length === 0) return 0;
  const sumReviews = comments.reduce((sum, comment) => sum + comment.rate, 0);
  return sumReviews / comments.length;
};
const deleteComment = async (commentId, userId) => {
  logger.info(`Deleting comment with ID: ${commentId} by user: ${userId}`);
  try {
    const isOwner = await CheckAuthorityOfComment(commentId, userId);

    if (!isOwner) {
      const error = new Error("Not the owner of the comment");
      error.status = 403;
      throw error;
    }

    const deleted = await Comment.findByIdAndDelete(commentId);
    return deleted;
  } catch (error) {
    logger.error(`Error deleting comment with ID: ${commentId}`, error);
    throw error;
  }
};

const CheckAuthorityOfComment = async (commentId, userId) => {
  logger.info(`Checking authority for comment ID: ${commentId} by user: ${userId}`);
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return false;
    console.log(comment);

    // Compare userId with comment.userId (both as strings)
    return comment.userId.toString() === userId.toString();
  } catch (error) {
    logger.error(`Error checking authority for comment ID: ${commentId}`, error);
    console.error("Error in CheckAuthorityOfComment:", error);
    return false;
  }
};

const getUserComments = async (userId) => {
  try {
    logger.info(`Fetching comments for user ID: ${userId}`);
    const comments = await Comment.find({ userId }).populate(
      "bookId",
      "title author imageCover"
    );
    return comments;
  } catch (error) {
    logger.error(`Error fetching comments for user ID: ${userId}`, error);
    throw error;
  }
};

const updateComment = async (commentId, userId, updatedFields) => {
  try {
    logger.info(`Updating comment ID: ${commentId} by user: ${userId}`);
    const isOwner = await CheckAuthorityOfComment(commentId, userId);

    if (!isOwner) {
      const error = new Error("Not the owner of the comment");
      error.status = 403;
      throw error;
    }

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { $set: updatedFields },
      { new: true }
    );

    return updated;
  } catch (error) {
    logger.error(`Error updating comment ID: ${commentId}`, error);
    throw error;
  }
};

module.exports = {
  createComment,
  listComments,
  deleteComment,
  getAverageReview,
  getUserComments,
  updateComment,
};
