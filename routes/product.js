const { Router } = require("express");
const {
  addproduct,
  getAllProducts,
  getproduct,
  UpdateProduct,
  deleteProduct,
  getUniqueGenres,
  getUniqueAuthors,
  uploadProductFiles,
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
  .post(uploadProductFiles,uploadImagesToCloudinary,addProductValidator, addproduct);

productRouter.get("/genres", getUniqueGenres);
productRouter.get("/authors", getUniqueAuthors);

productRouter
  .route("/:id")
  .get(getProductValidator, getproduct)
  .patch(uploadProductFiles,uploadImagesToCloudinary,updateProductValidator, UpdateProduct)
  .delete(deleteProductValidator, deleteProduct);

module.exports = productRouter;
