const mongoose =require ("mongoose");


const categorySchma = new mongoose.Schema({
    name: {
        type: String,
        require: [true, "Must Be Require"],
        minlength: [3, "Too short Category Name"],
        maxlength: [30, "Too long Category Name"],
        trim: true,

    },


    slug: {
        type: String,
        lowercase: true
    },

}, { timestamps: true })

categorySchma.index({ name: 1 }, { unique: true })

const Category = mongoose.model("Category", categorySchma)


module.exports=  Category;