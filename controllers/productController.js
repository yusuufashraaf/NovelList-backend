const expressAsyncHandler = require("express-async-handler");
const slugify = require("slugify");
const ApiFeatures = require("../utils/apiFeature");
const AppError = require("../utils/AppError");
const Product = require("../models/product");
const Category = require("../models/category");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;
const redisClient = require("../config/redisClient");
const streamifier = require("streamifier");

// --- Multer Setup for Memory Upload ---
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Only images or PDFs are allowed"));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadProductFiles = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
  { name: "pdfLink", maxCount: 1 },
]);

const uploadPDFToCloudinary = async (pdfBuffer, originalname) => {
  const baseName = originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
  const finalFileName = `${baseName}.pdf`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "raw",
        public_id: `${Date.now()}-${finalFileName}`,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) return reject(new AppError(500, "PDF Upload Failed"));
        const downloadUrl = result.secure_url.replace(
          "/raw/upload/",
          "/raw/upload/fl_attachment/"
        );
        resolve(downloadUrl);
      }
    );
    streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
  });
};

const uploadImagesToCloudinary = expressAsyncHandler(async (req, res, next) => {
  const files = req.files || {};

  // Upload imageCover
  if (files.imageCover?.[0]) {
    const img = files.imageCover[0];
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "products",
          public_id: `${Date.now()}-${img.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_")}`,
        },
        (error, result) => {
          if (error)
            return reject(new AppError(500, "Image Cover Upload Failed"));
          resolve(result);
        }
      );
      streamifier.createReadStream(img.buffer).pipe(stream);
    });
    req.body.imageCover = result.secure_url;
  }

  // Upload PDF
  if (files.pdfLink?.[0]) {
    const pdf = files.pdfLink[0];
    req.body.pdfLink = await uploadPDFToCloudinary(
      pdf.buffer,
      pdf.originalname
    );
  }

  // Upload additional images
  if (Array.isArray(files.images)) {
    req.body.images = [];
    await Promise.all(
      files.images.map((img) => {
        return new Promise((resolve, reject) => {
          const cleanedName = img.originalname
            .replace(/\.[^/.]+$/, "")
            .replace(/\s+/g, "_");
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "products",
              public_id: `${Date.now()}-${cleanedName}`,
            },
            (error, result) => {
              if (error)
                return reject(new AppError(500, "Image Upload Failed"));
              req.body.images.push(result.secure_url);
              resolve();
            }
          );
          streamifier.createReadStream(img.buffer).pipe(stream);
        });
      })
    );
  }

  next();
});

// ==================== Product Controllers ====================

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

  if (body.subcategory && typeof body.subcategory === "string") {
    body.subcategory = JSON.parse(body.subcategory);
  }

  body.slug = slugify(body.title);
  const product = await Product.create(body);

  await product.populate([
    { path: "category", select: "name _id" },
    { path: "subcategory", select: "name _id" },
  ]);

  res.status(201).json({
    status: "success",
    message: "Product Added Successfully",
    data: product,
  });
});

const getAllProducts = expressAsyncHandler(async (req, res, next) => {
  const redisKey = `products:${JSON.stringify(req.query)}`;

  try {
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        status: "success (from cache)",
        ...parsed,
      });
    }
  } catch (err) {
    console.error("Redis GET error:", err);
  }

  const features = new ApiFeatures(Product.find(), req.query);
  await features.filter();
  features.search("Product");

  const totalDocuments = await features.mongooseQuery.clone().countDocuments();

  features.paginate(totalDocuments);
  features.sort();
  features.limitFields();

  const products = await features.mongooseQuery.populate({
    path: "category",
    select: "name _id",
  });

  const responseData = {
    message:
      products.length === 0
        ? "No products match your filters"
        : "Products fetched successfully",
    currentPage: features.paginationResult.currentPage,
    totalPages: features.paginationResult.numberOfPages,
    results: products.length,
    data: products,
  };

  try {
    await redisClient.set(redisKey, JSON.stringify(responseData), {
      EX: 1800,
    });
  } catch (err) {
    console.error("Redis SET error:", err);
  }

  res.status(200).json({
    status: "success",
    ...responseData,
  });
});

const getproduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findOne({ _id: id }).populate({
    path: "category",
    select: "name _id",
  });

  if (!product) {
    return next(new AppError(404, "Product Not Found"));
  }

  res.status(200).json({
    status: "success",
    message: "Get Single Product Successfully",
    data: product,
  });
});

const UpdateProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const body = req.body;

  if (body.title) {
    body.slug = slugify(body.title);
  }

  if (body.subcategory && typeof body.subcategory === "string") {
    try {
      body.subcategory = JSON.parse(body.subcategory);
    } catch {
      return next(new AppError(400, "Invalid subcategory format"));
    }
  }

  const product = await Product.findByIdAndUpdate(id, body, {
    new: true,
  }).populate([
    { path: "category", select: "name _id" },
    { path: "subcategory", select: "name _id" },
  ]);

  if (!product) return next(new AppError(404, "Product Not Found"));

  res.status(200).json({
    status: "success",
    message: "Product Updated",
    data: product,
  });
});

const deleteProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findOneAndDelete({ _id: id });

  if (!product) return next(new AppError(404, "Product Not Found"));

  res.status(200).json({
    status: "success",
    message: "Product Deleted Successfully",
  });
});

const getUniqueGenres = expressAsyncHandler(async (req, res) => {
  const categoryIds = await Product.distinct("category");
  const categories = await Category.find({ _id: { $in: categoryIds } }).select(
    "name"
  );

  res.status(200).json({ genres: categories });
});

const getUniqueAuthors = expressAsyncHandler(async (req, res) => {
  const authors = await Product.distinct("author");
  res.status(200).json({ authors });
});

module.exports = {
  addproduct,
  getAllProducts,
  getproduct,
  UpdateProduct,
  deleteProduct,
  getUniqueGenres,
  getUniqueAuthors,
  uploadProductFiles,
  uploadImagesToCloudinary,
};
