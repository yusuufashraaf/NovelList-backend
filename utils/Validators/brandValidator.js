const  { check } =require( "express-validator");
const  validateMongoId = require( "../../middlewares/validatorMiddleware");



const addBrandsValidator = [
    check("name").notEmpty().withMessage("Brand Name Is Require")
        .isLength({ min: 3 }).withMessage("Brand name must be at least 3 characters")
        .isLength({ max: 20 }).withMessage("Brand name must be less than 20 characters"),
    validateMongoId
]

const getBrandValidtor = [
    check("id").isMongoId().withMessage("Invalid Brand ID Format")
]
const updateBrandValidtor = [
    check("id").isMongoId().withMessage("Invalid Brand ID Format")
]
const deleteBrandValidtor = [
    check("id").isMongoId().withMessage("Invalid Brand ID Format")
]




module.exports = {
    addBrandsValidator,
    getBrandValidtor,
    updateBrandValidtor,
    deleteBrandValidtor
}