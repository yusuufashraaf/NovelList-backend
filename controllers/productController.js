const expressAsyncHandler = require("express-async-handler");
const slugify = require("slugify");
const ApiFeatures = require("../utils/apiFeature");
const AppError = require("../utils/AppError");
const Product = require("../models/product");
const Category = require("../models/category");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;

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
                  '/raw/upload/',
                  '/raw/upload/fl_attachment/'
                );
                resolve(downloadUrl);
            }
        );
        streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
    });
};


// Main Middleware
const uploadImagesToCloudinary = expressAsyncHandler(async (req, res, next) => {
    const files = req.files || {};

    // 1. Upload imageCover
    if (files.imageCover?.[0]) {
        const img = files.imageCover[0];
        const cleanedName = img.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "products",
                    public_id: `${Date.now()}-${cleanedName}`,
                },
                (error, result) => {
                    if (error) return reject(new AppError(500, "Image Cover Upload Failed"));
                    resolve(result);
                }
            );
            streamifier.createReadStream(img.buffer).pipe(stream);
        });

        req.body.imageCover = result.secure_url;
    }

    // 2. Upload PDF
    if (files.pdfLink?.[0]) {
        const pdf = files.pdfLink[0];
        try {
            req.body.pdfLink = await uploadPDFToCloudinary(pdf.buffer, pdf.originalname);
        } catch (err) {
            return next(err);
        }
    }

    // 3. Upload multiple images
    if (Array.isArray(files.images)) {
        req.body.images = [];

        await Promise.all(
            files.images.map((img) => {
                return new Promise((resolve, reject) => {
                    const cleanedName = img.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");

                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: "products",
                            public_id: `${Date.now()}-${cleanedName}`,
                        },
                        (error, result) => {
                            if (error) return reject(new AppError(500, "Image Upload Failed"));
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


//     // 1. Upload imageCover to Cloudinary
//     if (req.files.imageCover) {
//         const result = await cloudinary.uploader.upload(
//             `data:${req.files.imageCover[0].mimetype};base64,${req.files.imageCover[0].buffer.toString('base64')}`,
//             {
//                 folder: "products",
//                 // transformation: [{ width: 600, height: 600, crop: "limit" }]
//             }
//         );
//         req.body.imageCover = result.secure_url;
//     }

//     if (req.files.pdfLink) {
//         const pdfLink = req.files.pdfLink[0];
//         const result = await cloudinary.uploader.upload(
//             `data:${pdfLink.mimetype};base64,${pdfLink.buffer.toString('base64')}`,
//             {
//                 folder: "products",
//                 resource_type: "raw",
//                 public_id: `products/${Date.now()}-${pdfLink.originalname.replace(/\.[^/.]+$/, "")}.pdf`,
//             }
//         );
//         req.body.pdfLink = result.secure_url;
//     }

//     // 2. Upload images (array of images) to Cloudinary
//     if (req.files.images) {
//         req.body.images = [];
//         await Promise.all(
//             req.files.images.map(async (file) => {
//                 const result = await cloudinary.uploader.upload(
//                     `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
//                     {
//                         folder: "products", // نفس المجلد
//                         // transformation: [{ width: 800, height: 800, crop: "limit" }]
//                     }
//                 );
//                 req.body.images.push(result.secure_url);
//             })
//         );
//     }

//     next();
// });

// const uploadImagesToCloudinary = expressAsyncHandler(async (req, res, next) => {
//   const files = req.files || {};

//   // 1. Upload imageCover
//   if (files.imageCover?.[0]) {
//     const img = files.imageCover[0];
//     const result = await cloudinary.uploader.upload(
//       `data:${img.mimetype};base64,${img.buffer.toString("base64")}`,
//       {
//         folder: "products",
//         public_id: `${Date.now()}-${img.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_")}`,
//       }
//     );
//     req.body.imageCover = result.secure_url;
//   }

//   // 2. Upload pdfLink
//   if (files.pdfLink?.[0]) {
//     const pdf = files.pdfLink[0];
//     const cleanedName = pdf.originalname
//       .replace(/\.[^/.]+$/, "")
//       .replace(/\s+/g, "_");



//      const result = await cloudinary.uploader.upload(
//          `data:${pdf.mimetype};base64,${pdf.buffer.toString("base64")}`,
//          {
//              folder: "products",
//              resource_type:"raw",   // لأنه PDF
//              public_id: `${Date.now()}-${cleanedName}.pdf`, // بدون .pdf يدوي
//          }
//      );

//      req.body.pdfLink = result.secure_url.replace('/upload/', '/upload/fl_attachment/');
//   }

//   // 3. Upload images[]
//   if (Array.isArray(files.images)) {
//     req.body.images = [];

//     await Promise.all(
//       files.images.map(async (img) => {
//         const cleanedName = img.originalname
//           .replace(/\.[^/.]+$/, "")
//           .replace(/\s+/g, "_");

//         const result = await cloudinary.uploader.upload(
//           `data:${img.mimetype};base64,${img.buffer.toString("base64")}`,
//           {
//             folder: "products",
//             public_id: `${Date.now()}-${cleanedName}`,
//           }
//         );
//         req.body.images.push(result.secure_url);
//       })
//     );
//   }

//   next();
// });

// const uploadImagesToCloudinary = expressAsyncHandler(async (req, res, next) => {
//     const files = req.files || {};

//     // 1. Upload imageCover
//     if (files.imageCover?.[0]) {
//         const img = files.imageCover[0];
//         const result = await cloudinary.uploader.upload(
//             `data:${img.mimetype};base64,${img.buffer.toString("base64")}`,
//             {
//                 folder: "products",
//                 public_id: `${Date.now()}-${img.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_")}`,
//             }
//         );
//         req.body.imageCover = result.secure_url;
//     }

//     // 2. Upload pdfLink
//     if (files.pdfLink?.[0]) {
//         const pdf = files.pdfLink[0];
//         const cleanedName = pdf.originalname
//             .replace(/\.[^/.]+$/, "")
//             .replace(/\s+/g, "_");

//         const result = await cloudinary.uploader.upload(
//             `data:${pdf.mimetype};base64,${pdf.buffer.toString("base64")}`,
//             {
//                 folder: "products",
//                 public_id: `${Date.now()}-${cleanedName}.pdf`, // بدون .pdf يدوي
//             }
//         );
//         req.body.pdfLink = result.secure_url.replace("/upload/", "/upload/fl_attachment/");
//     }

//     // ✅ 3. Upload images[]
//     if (Array.isArray(files.images)) {
//         req.body.images = [];

//         await Promise.all(
//             files.images.map(async (img) => {
//                 const cleanedName = img.originalname
//                     .replace(/\.[^/.]+$/, "")
//                     .replace(/\s+/g, "_");

//                 const result = await cloudinary.uploader.upload(
//                     `data:${img.mimetype};base64,${img.buffer.toString("base64")}`,
//                     {
//                         folder: "products",
//                         public_id: `${Date.now()}-${cleanedName}`,
//                     }
//                 );
//                 req.body.images.push(result.secure_url);
//             })
//         );
//     }

//     // ✅ لازم يكون بره كل if
//     next();
// });

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
    ]);
    if (!product) next(new AppError(400, "Product Not Added"));

    res.status(201).json({
        status: "success",
        massage: "Product Added Successfully",
        data: product,
    });
});

const getAllProducts = expressAsyncHandler(async (req, res, next) => {
    // 1. Build query
    const features = new ApiFeatures(Product.find(), req.query);

    // Apply filters (including genre and rating)
    await features.filter();

    // Apply search
    features.search("Product");

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
    const products = await features.mongooseQuery.populate({
        path: "category",
        select: "name -_id",
    });

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
        { path: "category", select: "name -_id" },
        { path: "subcategory", select: "name -_id" },
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
    uploadProductFiles,
    uploadImagesToCloudinary,
};
