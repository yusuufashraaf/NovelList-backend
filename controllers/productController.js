const expressAsyncHandler = require("express-async-handler");
const slugify = require("slugify");
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

const getAllProducts = expressAsyncHandler(async (req, res, next) => {
  const queryStrObject = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryStrObject[el]);

  // Handle genre conversion
  if (queryStrObject.genre) {
    const category = await Category.findOne({ name: queryStrObject.genre });
    if (category) {
      queryStrObject.category = category._id.toString();
    } else {
      return res.status(200).json({
        status: "success",
        message: "No products found for this genre",
        currentPage: 1,
        totalPages: 0,
        results: 0,
        data: [],
      });
    }
    delete queryStrObject.genre;
  }

  // Handle rating
  if (queryStrObject.rating) {
    queryStrObject.ratingAverage = { $gte: Number(queryStrObject.rating) };
    delete queryStrObject.rating;
  }

  // Replace operators
  let queryStr = JSON.stringify(queryStrObject);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
  const mongoQuery = JSON.parse(queryStr);

  // Convert to numbers
  for (const key in mongoQuery) {
    if (typeof mongoQuery[key] === "object") {
      for (const op in mongoQuery[key]) {
        mongoQuery[key][op] = Number(mongoQuery[key][op]);
      }
    }
  }

  console.log("Incoming query params:", req.query);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 8;
  const skip = (page - 1) * limit;

  const totalDocuments = await Product.countDocuments(mongoQuery);
  const totalPages = Math.ceil(totalDocuments / limit);

  const mongooseQuery = Product.find(mongoQuery)
    .skip(skip)
    .limit(limit)
    .populate({ path: "category", select: "name -_id" })
    .sort(req.query.sort ? req.query.sort.split(",").join(" ") : "-createdAt");

  const products = await mongooseQuery;

  res.status(200).json({
    status: "success",
    message:
      products.length === 0
        ? "No products match your filters"
        : "Get All Products",
    currentPage: page,
    totalPages,
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
