const Router = require('express');
const mongoose = require('mongoose');
const router = new Router();
const Comment = require('../models/comment');
const Product = require("../models/product");
const commentController = require('../controllers/commentController');
const validateComment = require('../middlewares/validateComment')
const Authenticate = require('../middlewares/Authenticate')
router.post('/create',validateComment,async(req,res)=>{ 
     try {
        const comment = new Comment(req.body);
        const savedComment = await commentController.createComment(comment);
        console.log(savedComment);
        
        res.status(201).json({
            status: "Success",
            message: "comment created successfully",
            data : savedComment,
        })

     } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
     }

})
router.get('/:id',async (req,res)=>{
   
    const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid book ID format' });
        }

        const bookExists = await Product.findById(id);
        if (!bookExists) {
            return res.status(404).json({ error: 'book not found' });
        }
        
        try {
            const comments = await commentController.listComments(id); 
            const avgReviewperbook = commentController.getAverageReview(comments);      
            res.status(200).json(
                {comments:comments,
                count:comments.length,
                avgRate:avgReviewperbook
            });
        } catch (err) {
            console.error('Error fetching comments:', err);
            res.status(500).json({ error: 'Internal server error' });
        }


})

router.delete('/:id',Authenticate,async(req,res)=>{
        
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid comment ID format' });
        }
        const commentExists = await Comment.findById(id);
        if (!commentExists) {
            return res.status(404).json({ error: 'comment not found' });
        }
        try {
            const commentDeleted = await commentController.deleteComment(req.params.id, req.user._id)
            res.json(commentDeleted);
        } catch (error) {
            console.error('Error deleteing comment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
        

})
module.exports = router;


