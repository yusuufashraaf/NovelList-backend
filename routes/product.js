const { Router } = require("express");
const {
  addproduct,
  getAllProducts,
  getproduct,
  UpdateProduct,
  deleteProduct,
  getUniqueGenres,
  getUniqueAuthors,
  uploadProductImages,
  uploadImagesToCloudinary,
} = require("../controllers/productController");

const {
  addProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/Validators/productValidator");

const productRouter = Router();

productRouter
  .route("/")
  .get(getAllProducts)
  .post(uploadProductImages,uploadImagesToCloudinary,addProductValidator, addproduct);

productRouter.get("/genres", getUniqueGenres);
productRouter.get("/authors", getUniqueAuthors);

productRouter
  .route("/:id")
  .get(getProductValidator, getproduct)
  .patch(updateProductValidator, UpdateProduct)
  .delete(deleteProductValidator, deleteProduct);

module.exports = productRouter;
