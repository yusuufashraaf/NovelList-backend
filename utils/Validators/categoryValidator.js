const  { check } =require( "express-validator");
const  validateMongoId = require( "../../middlewares/validatorMiddleware");


// Validator for Category operations
const getCategoryValidator = [
    check("id").isMongoId().withMessage("Invalid Category Id format"),
    validateMongoId
]

const createCategoryValidator = [
    check("name")
        .notEmpty().withMessage("Category name is required")
        .isLength({min:3}).withMessage("Category name must be at least 3 characters")
        .isLength({max:30}).withMessage("Category name must be less than 30 characters"),

    validateMongoId
];
const updateCategoryValidator = [
    check("id").isMongoId().withMessage("Invalid Category Id format"),
    validateMongoId
]

const deleteCategoryValidator = [
    check("id").isMongoId().withMessage("Invalid Category Id format"),
    validateMongoId
]

module.exports = {
getCategoryValidator,
createCategoryValidator,
updateCategoryValidator,
deleteCategoryValidator
}

