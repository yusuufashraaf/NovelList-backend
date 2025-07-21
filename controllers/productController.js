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

// --- Image Upload Setup (Multer remains the same for memory storage) ---
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
const uploadProductFiles = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
  { name: "pdfLink", maxCount: 1 },
]);
const streamifier = require("streamifier");

// PDF uploader (clean version)
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
        // Force download link
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
  console.log("🟡 Starting Cloudinary uploads...");
  console.log("📁 Files received:", Object.keys(files));

  // 1. Upload imageCover
  if (files.imageCover?.[0]) {
    const img = files.imageCover[0];
    console.log("📤 Uploading imageCover:", img.originalname);
    console.log("📁 imageCover size:", img.size);
    console.log("📁 imageCover mimetype:", img.mimetype);
    console.log("📁 imageCover buffer length:", img.buffer?.length);

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "products",
            public_id: `${Date.now()}-${img.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_")}`,
          },
          (error, result) => {
            if (error) {
              console.error(
                "🚨 Cloudinary imageCover upload error (FULL):",
                error
              );
              return reject(
                new AppError(
                  500,
                  `Image Cover Upload Failed: ${error.message || error}`
                )
              );
            }
            resolve(result);
          }
        );
        streamifier.createReadStream(img.buffer).pipe(stream);
      });

      req.body.imageCover = result.secure_url;
    } catch (err) {
      return next(err);
    }
  }

  // 2. Upload PDF
  if (files.pdfLink?.[0]) {
    const pdf = files.pdfLink[0];
    console.log("📤 Uploading PDF:", pdf.originalname);
    console.log("📁 pdfLink size:", pdf.size);
    console.log("📁 pdfLink mimetype:", pdf.mimetype);
    console.log("📁 pdfLink buffer length:", pdf.buffer?.length);

    try {
      req.body.pdfLink = await uploadPDFToCloudinary(
        pdf.buffer,
        pdf.originalname
      );
    } catch (err) {
      console.error("🚨 Cloudinary PDF upload error:", err);
      return next(new AppError(500, "PDF Upload Failed"));
    }
  }

  // 3. Upload additional images
  if (Array.isArray(files.images)) {
    req.body.images = [];
    console.log(`📤 Uploading ${files.images.length} additional image(s)...`);

    try {
      await Promise.all(
        files.images.map((img, index) => {
          console.log(`📤 Uploading image ${index + 1}:`, img.originalname);
          console.log("📁 image size:", img.size);
          console.log("📁 image mimetype:", img.mimetype);
          console.log("📁 image buffer length:", img.buffer?.length);

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
                if (error) {
                  console.error(
                    "🚨 Cloudinary image upload error (FULL):",
                    error
                  );
                  return reject(
                    new AppError(
                      500,
                      `Image Upload Failed: ${error.message || error}`
                    )
                  );
                }
                req.body.images.push(result.secure_url);
                resolve();
              }
            );

            streamifier.createReadStream(img.buffer).pipe(stream);
          });
        })
      );
    } catch (err) {
      return next(err);
    }
  }

  console.log("✅ All uploads completed successfully.");
  next();
});

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
    console.error("❌ Missing required fields:", {
      title: body.title,
      price: body.price,
      quantity: body.quantity,
      category: body.category,
      imageCover: body.imageCover,
      author: body.author,
    });
    return next(new AppError(400, "All required fields must be provided"));
  }

  // Parse subcategory if needed
  if (body.subcategory && typeof body.subcategory === "string") {
    body.subcategory = JSON.parse(body.subcategory);
  }

  body.slug = slugify(body.title);

  const product = await Product.create(body);

  await product.populate([
    { path: "category", select: "name _id" },
    { path: "subcategory", select: "name _id" },
  ]);

  if (!product) {
    return next(new AppError(400, "Product Not Added"));
  }

  res.status(201).json({
    status: "success",
    message: "Product Added Successfully",
    data: product,
  });
});

const getAllProducts = expressAsyncHandler(async (req, res, next) => {
  const redisKey = `products:${JSON.stringify(req.query)}`;

  // 1. Try to get cached data from Redis
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
              console.log("🔍 Checking Redis cache for key:");

    console.error("Redis GET error:", err);
    // Don't block request if Redis is down — proceed with DB
  }

  // 2. Build query
  const features = new ApiFeatures(Product.find(), req.query);

  // Apply filters
  await features.filter();

  // Apply search
  features.search("Product");

  // Count total documents (before pagination)
  const totalDocuments = await features.mongooseQuery.clone().countDocuments();

  // Apply pagination, sorting, field limiting
  features.paginate(totalDocuments);
  features.sort();
  features.limitFields();

  // 3. Execute final query
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

  // 4. Save response in Redis with expiry (30 mins)
  try {
    await redisClient.setEx(redisKey, 1800, JSON.stringify(responseData));
              console.log("🔍 Checking Redis cache for key:");

  } catch (err) {
    console.error("Redis SET error:", err);
  }

  // 5. Send response
  res.status(200).json({
    status: "success",
    ...responseData,
  });
});

const getproduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id }).populate({
    path: "category",
    select: "name  _id",
  });
  if (!product) {
    return next(new AppError(404, "Product Not Found "));
  }

  res.status(200).json({
    status: "Success",
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
    } catch (err) {
      return next(new AppError(400, "Invalid subcategory format"));
    }
  }

  const product = await Product.findByIdAndUpdate(id, body, {
    new: true,
  }).populate([
    { path: "category", select: "name  _id" },
    { path: "subcategory", select: "name  _id" },
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

  const categories = await Category.find({ _id: { $in: categoryIds } }).select(
    "name"
  );

  res.status(200).json({
    genres: categories,
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
  uploadProductFiles,
  uploadImagesToCloudinary,
};
