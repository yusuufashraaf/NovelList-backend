const expressAsyncHandler = require("express-async-handler");
const slugify = require("slugify");
const AppError = require("../utils/AppError");
const Product = require("../models/product");

const addproduct = expressAsyncHandler(async (req, res, next) => {
    const { body } = req;
    if (
        !body.title ||
        !body.price ||
        !body.quantity ||
        !body.category ||
        !body.imageCover ||
        !body.author
    ) {
        return next(new AppError(400, "All required fields must be provided"));
    }

    body.slug = slugify(body.title);
    const product = await Product.create(body);

    await product.populate([
        {
            path: "category",
            select: "name -_id",
        },
        {
            path: "subcategory",
            select: "name -_id",
        },
        {
            path: "brand",
            select: "name -_id",
        },
    ]);
    if (!product) next(new AppError(400, "Product Not Added"));

    res.status(201).json({
        status: "success",
        massage: "Product Added Successfully",
        data: product,
    });
});

const getAllProducts = expressAsyncHandler(async (req, res, next) => {
    //filtering
    const queryStrObject = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryStrObject[el]);

    //advanced filtering for getter than and less than because we are using mongoose query
    let queryStr = JSON.stringify(queryStrObject);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    const mongoQuery = {};
    for (const key in queryStrObject) {
        if (key.includes("[")) {
            const [field, operator] = key.split(/\[|\]/); // e.g., price[gte] → field = price, operator = gte
            if (!mongoQuery[field]) mongoQuery[field] = {};
            mongoQuery[field][`$${operator}`] = queryStrObject[key];
        } else {
            mongoQuery[key] = queryStrObject[key];
        }
    }
    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    console.log("Query String Object Query:", mongoQuery);

    //mongoose query
    const mongooseQuery = Product.find(mongoQuery)
        .skip(skip)
        .limit(limit)
        .populate({ path: "category", select: "name -_id" });

    //sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        mongooseQuery.sort(sortBy);
    } else {
        mongooseQuery.sort("-createdAt"); //default sorting by createdAt
    }

    //execute query
    const product = await mongooseQuery;

    if (product.length === 0) {
        return next(new AppError(404, "No products Found"));
    }

    res.status(200).json({
        status: "Success",
        message: "Get All Brands",
        data: product,
    });
});

const getproduct = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id }).populate({
        path: "category",
        select: "name -_id",
    });
    if (!product) {
        return next(new AppError(404, "Product Not Found "));
    }

    res.status(200).json({
        status: "Success",
        message: "Get Single Brand",
        data: product,
    });
});

const UpdateProduct = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { body } = req;
    if (body.title) {
        body.slug = slugify(body.title);
    }

    const product = await Product.findOneAndUpdate({ _id: id }, body, {
        new: true,
    }).populate({
        path: "category",
        select: "name -_id",
    });

    if (!product) next(new AppError(404, "product Not Found"));

    res.status(200).json({
        status: "Success",
        message: "product Updated",
        data: product,
    });
});

const deleteProduct = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id });

    if (!product) {
        return next(new AppError(404, "product Not Found"));
    }

    res.status(200).json({
        status: "Success",
        message: "product  Deleted Successfully",
    });
});

module.exports = {
    addproduct,
    getAllProducts,
    getproduct,
    UpdateProduct,
    deleteProduct,
};
