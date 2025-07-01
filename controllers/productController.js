const expressAsyncHandler = require("express-async-handler");
const slugify = require("slugify");
const ApiFeatures = require('../utils/apiFeature'); 
const AppError = require("../utils/AppError");
const Product = require("../models/product");
const Category = require("../models/category");

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


// const getAllProducts = expressAsyncHandler(async (req, res, next) => {
//     const finalQueryConditions = {}; 

//     // 1. Clone the query object and remove control fields
//     const queryObj = { ...req.query };
//     const excludedFields = ["page", "sort", "limit", "fields", "keyword"]; // Add 'keyword' to excluded
//     excludedFields.forEach((field) => delete queryObj[field]);

//     // 2. Handle genre -> convert genre name to category ID
//     if (queryObj.genre) {
//         const category = await Category.findOne({ name: queryObj.genre });
//         if (!category) {
//             return res.status(200).json({
//                 status: "success",
//                 message: "No products found for this genre",
//                 currentPage: 1,
//                 totalPages: 0,
//                 results: 0,
//                 data: [],
//             });
//         }
//         finalQueryConditions.category = category._id.toString();
//         delete queryObj.genre; // Already moved to finalQueryConditions
//     }

//     // 3. Handle rating filter
//     if (queryObj.rating) {
//         finalQueryConditions.ratingAverage = { $gte: Number(queryObj.rating) };
//         delete queryObj.rating; // Already moved to finalQueryConditions
//     }

//     // 4. Advanced filtering: convert gt/gte/lt/lte
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
//     const parsedQueryObj = JSON.parse(queryStr);

//     // Merge parsedQueryObj into finalQueryConditions
//     Object.assign(finalQueryConditions, parsedQueryObj);


//     // 9-search by title and author (YOUR REVISED CODE HERE)
//     if (req.query.keyword) {
//         const keyword = req.query.keyword;
//         const keywordSearchConditions = []; // Conditions specific to keyword search

//         // 1. Search for the entire keyword phrase (case-insensitive)
//         keywordSearchConditions.push(
//             { title: { $regex: keyword, $options: "i" } },
//             { author: { $regex: keyword, $options: "i" } }
//         );

//         // 2. Split the keyword into individual words and search for each word
//         const words = keyword.split(/\s+/).filter(Boolean);
//         if (words.length > 1) {
//             words.forEach(word => {
//                 keywordSearchConditions.push(
//                     { title: { $regex: word, $options: "i" } },
//                     { author: { $regex: word, $options: "i" } }
//                 );
//             });
//         }

//         // Add the keyword search conditions to the final query using $and with $or
//         // This ensures that if other filters exist, they are ANDed with the keyword search.
//         if (keywordSearchConditions.length > 0) {
//             finalQueryConditions.$and = finalQueryConditions.$and || [];
//             finalQueryConditions.$and.push({ $or: keywordSearchConditions });
//         }
//     }

//     // 5. Pagination setup
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 8;
//     const skip = (page - 1) * limit;

//     // 6. Build the mongoose query with all combined conditions
//     let mongooseQuery = Product.find(finalQueryConditions) // <--- Use the combined conditions here
//         .skip(skip)
//         .limit(limit)
//         .populate({ path: "category", select: "name -_id" });

//     // 7. Sorting
//     if (req.query.sort) {
//         const sortBy = req.query.sort.split(",").join(" ");
//         mongooseQuery = mongooseQuery.sort(sortBy);
//     } else {
//         mongooseQuery = mongooseQuery.sort("-createdAt"); // Default sort
//     }

//     // 8. Field selection
//     if (req.query.fields) {
//         const fields = req.query.fields.split(",").join(" ");
//         mongooseQuery = mongooseQuery.select(fields);
//     } else {
//         mongooseQuery = mongooseQuery.select("-__v");
//     }

//     // 10. Execute the query
//     const products = await mongooseQuery;

//     // 11. Count total documents for pagination
//     // Count based on the same finalQueryConditions
//     const totalDocuments = await Product.countDocuments(finalQueryConditions);
//     const totalPages = Math.ceil(totalDocuments / limit);

//     // 12. Send response
//     res.status(200).json({
//         status: "success",
//         message:
//             products.length === 0
//                 ? "No products match your filters"
//                 : "Products fetched successfully",
//         currentPage: page,
//         totalPages,
//         results: products.length,
//         data: products,
//     });
// });



const getAllProducts = expressAsyncHandler(async (req, res, next) => {
    // 1. Build query
    const features = new ApiFeatures(Product.find(), req.query);

    // Apply filters (including genre and rating)
    await features.filter(); 

    // Apply search
    features.search('Product'); 

    // Count documents *before* pagination to get total for pagination
    // You need to clone the query to count without limit/skip
    const totalDocuments = await features.mongooseQuery.clone().countDocuments();

    // Apply pagination
    features.paginate(totalDocuments);

    // Apply sorting
    features.sort();

    // Apply field limiting
    features.limitFields();

    // 2. Execute query
    const products = await features.mongooseQuery.populate({ path: "category", select: "name -_id" });

    // 3. Send response
    res.status(200).json({
        status: "success",
        message:
            products.length === 0
                ? "No products match your filters"
                : "Products fetched successfully",
        currentPage: features.paginationResult.currentPage,
        totalPages: features.paginationResult.numberOfPages,
        results: products.length,
        data: products,
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

const getUniqueGenres = expressAsyncHandler(async (req, res, next) => {
    // Get unique category IDs from products
    const categoryIds = await Product.distinct("category");

    // Fetch category documents matching those IDs and select only name
    const categories = await Category.find({ _id: { $in: categoryIds } }).select(
        "name"
    );

    // Extract just the names
    const genres = categories.map((cat) => cat.name);

    res.status(200).json({
        genres,
    });
});

const getUniqueAuthors = expressAsyncHandler(async (req, res, next) => {
    const authors = await Product.distinct("author");

    res.status(200).json({
        authors,
    });
});

module.exports = {
    addproduct,
    getAllProducts,
    getproduct,
    UpdateProduct,
    deleteProduct,
    getUniqueGenres,
    getUniqueAuthors,
};
