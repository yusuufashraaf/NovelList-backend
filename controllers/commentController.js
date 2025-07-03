const Comment = require('../models/comment');

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
        const comments = await Comment.find({ bookId: id });
        return comments

    } catch (error) {
        throw error; 
    }


}
const deleteComment = async(id)=>{
    try {
         const commentDeleted = await Comment.findByIdAndDelete(id);
        return commentDeleted

    } catch (error) {
        throw error; 
    }
}

module.exports ={
    createComment,
    listComments,
    deleteComment
}