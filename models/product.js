const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
        minlength: [3, "Too Short Product Name"],
        maxlength: [80, "Too Long Product Name"]
    },
    slug: {
        type: String,
        lowercase: true,
    },
    description: {
        type: String,
        required: [true, "Description Is Required"],
        trim: true,
        minlength: [20, "Too Short Product Description"]
    },
    author: {
        type: String,
        required: [true, "Author Is Required"],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, "Quantity For Product Is Required"],
    },
   
    price: {
        type: Number,
        required: [true, "Price For Product Is Required"],
        trim: true,
        max: [150000, "Too Long Product Price"]
    },
    priceAfterDiscount: {
        type: Number,
    },
    imageCover: {
        type: String,
        required: [true, "Product Image Cover Is Required"]
    },
    images: [String],

    pdfLink: {
        type: String,
        required: [true, "Product PDF File Is Required"]
    },

    category: {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
        required: [true, "Product Must Belong To Category"],
        trim: true
    },

    subcategory: [{
        type: mongoose.Schema.ObjectId,
        ref: "SubCategory",
        trim: true
    }],

    ratingAverage: {
        type: Number,
        min: [1, "Rating Must Be ≥ 1.0"],
        max: [5, "Rating Must Be ≤ 5.0"],
    },

    ratingQuantity: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

productSchema.index({ title: 1 }, { unique: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
