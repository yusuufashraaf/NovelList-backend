const  mongoose = require("mongoose")


const productSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        require: true,
        minlength: [3, "Too Short Product Name"],
        maxlength: [80, "Too long Product Name"]
    },
    slug: {
        type: String,
        lowercase: true,
    },
    description: {
        type: String,
        require: [true, "Description Is Required"],
        trim: true,
        minlength: [20, "Too short Product Description"]
    },
    quantity: {
        type: Number,
        require: [true, " Quantity For Product Is Requied"],
    },
    stock: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        require: [true, "Price For product Is Required"],
        trim: true,
        max: [150000, " Too Lang product Price  "]
    },
    priceAfterDiscount: {
        type: Number,
    },
    imageCover: {
        type: String,
        require: [true, "Product Image Cover Is Required"]
    },
    images: [String],


    category: {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
        require: [true, "Product Must Be Long To Category"],
        trim: true
    },

    subcategory: [{
        type: mongoose.Schema.ObjectId,
        ref: "SubCategory",
        trim: true
    }],
   

    ratingAverage: {
        type: Number,
        min: [1, "Rating Must be Above Or Equal 1.0"],
        max: [5, "Rating Must be Below Or Equal 5.5"],
    },

    ratingQuantity: {
        type: Number,
        default: 0
    }

}, {timestamps: true})


const Product = mongoose.model("Product", productSchema);


module.exports =  Product;