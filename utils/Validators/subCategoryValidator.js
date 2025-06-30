const  { check } =require( "express-validator");
const  validateMongoId = require( "../../middlewares/validatorMiddleware");



const addSubCategoryValidator = [
    check("name").notEmpty().withMessage("Sub Category name is required")
        .isLength({min:3}).withMessage("Sub Category name must be at least 3 characters")
        .isLength({max:30}).withMessage("Sub Category name must be less than 30 characters"),
    check("category").isMongoId().withMessage("Invalid Category Id format"),
    validateMongoId
]

const getSubCategoryValidator = [
    check("id").isMongoId().withMessage("Invalid Sub Category Id format"),
    validateMongoId
]

const updateSubCategoryValidator = [
    check("id").isMongoId().withMessage("Invalid Sub Category Id format"),
    check("name").notEmpty().withMessage("Sub Category name is required"),

    validateMongoId
]

const deleteSubCategoryValidator = [
    check("id").isMongoId().withMessage("Invalid Sub Category Id format"),
    validateMongoId
]

module.exports = {
    addSubCategoryValidator,
    getSubCategoryValidator,
    updateSubCategoryValidator,
    deleteSubCategoryValidator
}