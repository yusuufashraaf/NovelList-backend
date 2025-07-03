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
const {
  manualPdfFileValidator,
  manualImageCoverValidator,
} = require("../middlewares/productImg&FileValidator");

const productRouter = Router();

productRouter
  .route("/")
  .get(getAllProducts)
  .post(
        uploadProductFiles,
        manualPdfFileValidator,
        manualImageCoverValidator,
        addProductValidator,
        uploadImagesToCloudinary,
        addproduct);

productRouter.get("/genres", getUniqueGenres);
productRouter.get("/authors", getUniqueAuthors);

productRouter
  .route("/:id")
  .get(getProductValidator, getproduct)
  .put(uploadProductFiles, uploadImagesToCloudinary, updateProductValidator, UpdateProduct)
  .delete(deleteProductValidator, deleteProduct);

module.exports = productRouter;
