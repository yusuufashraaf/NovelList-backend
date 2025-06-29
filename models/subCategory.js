const  mongoose = require("mongoose");


const subCategorySchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Sub Category is required"],
        minlength: [3, "Too short sub category name"],
        maxlength: [20, "Too long sub category name"],
        trim: true,
    },

    slug:{
        type:String,
        lowercase: true,
    },
    category: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true , "Category is required"],
    }
},{timestamps: true})

subCategorySchema.index({ name: 1 }, { unique: true })

const SubCategory = mongoose.model("SubCategory", subCategorySchema);


module.exports = SubCategory;