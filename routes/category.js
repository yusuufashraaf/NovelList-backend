const { Router } = require("express");
const {
  addCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  createCategoryValidator,
  getCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/Validators/categoryValidator");

const categoryRouter = Router();
const subCategoryRouter = require("./subCategory");


categoryRouter.route("/").get(getCategories).post(createCategoryValidator, addCategory);
categoryRouter.route("/:id").get(getCategoryValidator, getCategory).put(updateCategoryValidator, updateCategory).delete(deleteCategoryValidator,deleteCategory);

categoryRouter.use("/:categoryId/subCategory", subCategoryRouter);

module.exports = categoryRouter;