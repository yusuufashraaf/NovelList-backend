// ==========================
// Product Controller Module
// ==========================

const expressAsyncHandler = require("express-async-handler");
const slugify = require("slugify");
const multer = require("multer");
const sharp = require("sharp");
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;

// Utilities & Models
const ApiFeatures = require("../utils/apiFeature");
const AppError = require("../utils/AppError");
const Product = require("../models/product");
const Category = require("../models/category");
const redis = require("../config/redisClient");

// ==========================
// File Upload Setup (Multer)
// ==========================

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Please upload only images or PDF files."));
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

// ==========================
// Cloudinary Upload Helpers
// ==========================

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
        type: "upload",
      },
      (error, result) => {
        if (error) return reject(new AppError(500, "PDF Upload Failed"));
        const downloadUrl = result.secure_url.replace(
          "/raw/upload/",
          "/raw/upload/fl_attachment/",
        );
        resolve(downloadUrl);
      },
    );
    streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
  });
};

const uploadImagesToCloudinary = expressAsyncHandler(async (req, res, next) => {
  const files = req.files || {};

  if (files.imageCover?.[0]) {
    const img = files.imageCover[0];
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "products",
            public_id: `${Date.now()}-${img.originalname
              .replace(/\.[^/.]+$/, "")
              .replace(/\s+/g, "_")}`,
          },
          (error, result) => {
            if (error) return reject(new AppError(500, `Image Cover Upload Failed: ${error.message}`));
            resolve(result);
          },
        );
        streamifier.createReadStream(img.buffer).pipe(stream);
      });
      req.body.imageCover = result.secure_url;
    } catch (err) {
      return next(err);
    }
  }

  if (files.pdfLink?.[0]) {
    const pdf = files.pdfLink[0];
    try {
      req.body.pdfLink = await uploadPDFToCloudinary(pdf.buffer, pdf.originalname);
    } catch (err) {
      return next(new AppError(500, "PDF Upload Failed"));
    }
  }

  if (Array.isArray(files.images)) {
    req.body.images = [];
    try {
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
                if (error) return reject(new AppError(500, `Image Upload Failed: ${error.message}`));
                req.body.images.push(result.secure_url);
                resolve();
              },
            );
            streamifier.createReadStream(img.buffer).pipe(stream);
          });
        }),
      );
    } catch (err) {
      return next(err);
    }
  }

  next();
});

// ==========================
// Controllers
// ==========================

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

  if (!product) return next(new AppError(400, "Product Not Added"));

  res.status(201).json({
    status: "success",
    message: "Product Added Successfully",
    data: product,
  });
});

const getAllProducts = expressAsyncHandler(async (req, res, next) => {
  const normalizeQuery = (query) => {
    const sorted = Object.keys(query)
      .sort()
      .map((k) => {
        if (typeof query[k] === "object" && query[k] !== null) {
          const inner = Object.keys(query[k])
            .sort()
            .map((ik) => `${ik}:${query[k][ik]}`)
            .join(",");
          return `${k}:{${inner}}`;
        }
        return `${k}:${query[k]}`;
      })
      .join("|");
    return `products:${sorted}`;
  };

  const key = normalizeQuery(req.query);

  try {
    const cached = await redis.get(key);
    if (cached && typeof cached === "string") {
      try {
        const parsed = JSON.parse(cached);
        return res.json({ ...parsed, fromCache: true });
      } catch {}
    }
  } catch {}

  const features = new ApiFeatures(Product.find(), req.query);
  await features.filter();
  features.search("Product");

  let totalDocs;
  try {
    totalDocs = await features.mongooseQuery.clone().countDocuments();
  } catch {
    return next(new AppError(500, "Error counting products"));
  }

  features.paginate(totalDocs);
  features.sort();
  features.limitFields();

  let products;
  try {
    products = await features.mongooseQuery.populate({
      path: "category",
      select: "name _id",
    });
  } catch {
    return next(new AppError(500, "DB population error"));
  }

  const response = {
    status: "success",
    message: products.length ? "Products fetched" : "No products match",
    currentPage: features.paginationResult.currentPage,
    totalPages: features.paginationResult.numberOfPages,
    results: products.length,
    data: products,
  };

  try {
    await redis.set(key, JSON.stringify(response), { ex: 1800 });
  } catch {}

  res.json(response);
});

const getproduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id).populate({
    path: "category",
    select: "name _id",
  });

  if (!product) return next(new AppError(404, "Product Not Found"));

  res.status(200).json({
    status: "Success",
    message: "Get Single Product Successfully",
    data: product,
  });
});

const UpdateProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const body = req.body;

  if (body.title) body.slug = slugify(body.title);

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

  const product = await Product.findByIdAndDelete(id);

  if (!product) return next(new AppError(404, "Product Not Found"));

  res.status(200).json({
    status: "Success",
    message: "Product Deleted Successfully",
  });
});

const getUniqueGenres = expressAsyncHandler(async (req, res, next) => {
  const categoryIds = await Product.distinct("category");
  const categories = await Category.find({ _id: { $in: categoryIds } }).select("name");
  res.status(200).json({ genres: categories });
});

const getUniqueAuthors = expressAsyncHandler(async (req, res, next) => {
  const authors = await Product.distinct("author");
  res.status(200).json({ authors });
});

// ==========================
// Exports
// ==========================

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
