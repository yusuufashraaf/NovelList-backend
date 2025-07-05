const Comment = require('../models/comment');
const mongoose = require('mongoose');
const UserAuth =require('../models/userAuthModel'); 
const createComment = async(comment)=>{
    try { 
         const savedComment = await comment.save();
        return savedComment; 
    } catch (error) {
        console.error("Error saving comment in controller:", error);
        throw error; 
    }
}



const listComments = async (id)=>{
    try {
        const comments = await Comment.find({ bookId: id })
        .populate('userId','name');
        return comments
    } catch (error) {
        throw error; 
    }


}
const getAverageReview =(comments)=>{
    if (!comments || comments.length === 0) return 0;
    const sumReviews = comments.reduce((sum, comment) => sum + comment.rate, 0);
    return sumReviews/comments.length;
}
const deleteComment = async (commentId, userId) => {
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
    throw error;
  }
};

const CheckAuthorityOfComment = async (commentId, userId) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return false;
    console.log(comment);
    
    // Compare userId with comment.userId (both as strings)
    return comment.userId.toString() === userId.toString();
  } catch (error) {
    console.error("Error in CheckAuthorityOfComment:", error);
    return false;
  }
};
module.exports ={
    createComment,
    listComments,
    deleteComment,
    getAverageReview
}