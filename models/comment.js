const  mongoose = require("mongoose");

const {Schema} = mongoose;
const { ObjectId } = Schema.Types;

const commentSchema = new Schema({
    userId:{
        type: ObjectId,
        ref: 'User',
        required: true
    },
    bookId:{
        type: ObjectId,
        ref: 'Product',
        required: true
    },
    comment:{
        type:String,
        required: true,
        min:1
    },
    postedAt:{
        type: Date,
        default: Date.now
    }
})
const Comment = mongoose.model("Comment",commentSchema);
module.exports =Comment;



