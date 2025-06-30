const mongoose =  require("mongoose");

const BrandSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: [3, "Too Short Brnad Name "],
        maxlength: [20, "Too Long Brnad Name "],
        require: [true, "Must Be Require"],
        trim: true,


    },
    slug: {
        type: String,
        lowercase: true
    },
    product:{
        type: mongoose.Schema.ObjectId,
        ref:"Product"
    },

}, { timestamps: true })

BrandSchema.index({ name: 1 }, { unique: true })

const Brand = mongoose.model("Brand", BrandSchema)

module.exports= Brand;