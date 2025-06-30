const  { check } = require("express-validator");
const slugify = require("slugify");
const validateMongoId = require( "../../middlewares/validatorMiddleware");
// const AppError = require ("../../utils/AppError");
const Category = require ( "../../models/category");
const SubCategory =require("../../models/subCategory");

const addProductValidator = [
  check("title")
    .isLength({ min: 3 })
    .withMessage("must be at least 3 chars")
    .notEmpty()
    .withMessage("Book title is required")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("description")
    .notEmpty()
    .withMessage("Book description is required")
    .isLength({ max: 2000 })
    .withMessage("Too long description"),
  check("quantity")
    .notEmpty()
    .withMessage("Book quantity is required")
    .isNumeric()
    .withMessage("Book quantity must be a number"),
  check("author")
    .notEmpty()
    .withMessage("Book author is required"),
  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Book quantity must be a number"),
  check("price")
    .notEmpty()
    .withMessage("Book price is required")
    .isNumeric()
    .withMessage("Book price must be a number")
    .isLength({ max: 32 })
    .withMessage("To long price"),
  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Book priceAfterDiscount must be a number")
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error("priceAfterDiscount must be lower than price");
      }
      return true;
    }),

  
  check("imageCover").notEmpty().withMessage("Book imageCover is required"),
  check("images")
    .optional()
    .isArray()
    .withMessage("images should be array of string"),
  check("category")
    .notEmpty()
    .withMessage("Book must be belong to a category")
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category for this id: ${categoryId}`)
          );
        }
      })
    ),

  check("subcategory")
    .optional()
    .isArray()
    .withMessage("subcategory must be an array of IDs") // Updated message
    .custom(async (subcategoryIds, { req }) => {
      if (!subcategoryIds || subcategoryIds.length === 0) {
        return true;
      }

      const invalidId = subcategoryIds.find(
        (id) => !/^[0-9a-fA-F]{24}$/.test(id)
      );
      if (invalidId) {
        throw new Error(`Invalid subcategory ID format: ${invalidId}`);
      }

      const foundSubcategories = await SubCategory.find({
        _id: { $in: subcategoryIds },
      });

      if (foundSubcategories.length !== subcategoryIds.length) {
        const foundIds = new Set(
          foundSubcategories.map((sub) => sub._id.toString())
        );
        const missingIds = subcategoryIds.filter((id) => !foundIds.has(id));
        throw new Error(
          `One or more subcategory IDs are invalid or do not exist: ${missingIds.join(", ")}`
        );
      }

      const categoryId = req.body.category;
      if (!categoryId) {
        throw new Error(
          "Category must be provided for subcategory validation."
        );
      }
      const categoryIdString = categoryId.toString(); // Ensure string comparison

      const notBelong = foundSubcategories.find(
        (subcat) => subcat.category.toString() !== categoryIdString
      );

      if (notBelong) {
        throw new Error(
          `Subcategory (${notBelong.name || notBelong._id}) does not belong to the specified category.`
        );
      }

      return true;
    }),

  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("ratingsAverage must be a number")
    .isLength({ min: 1 })
    .withMessage("Rating must be above or equal 1.0")
    .isLength({ max: 5 })
    .withMessage("Rating must be below or equal 5.0"),
  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("ratingsQuantity must be a number"),

  validateMongoId,
];

const getProductValidator = [
  check("id").isMongoId().withMessage("Invalid Product Id format"),
  validateMongoId,
];

const updateProductValidator = [
  check("id").isMongoId().withMessage("Invalid Product Id format"),
  validateMongoId,
];

const deleteProductValidator = [
  check("id").isMongoId().withMessage("Invalid Product Id format"),
  validateMongoId,
];


module.exports= {
  addProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
};
