const {Router} = require('express');
const{
    addSubCategory,
    getSubCategories,
    getSubCategory,
    updateSubCategory,
    deleteSubCategory,
    setCategoryIdFormBody,
    createFilterObject
} = require('../controllers/subCategoryController');
const {
    addSubCategoryValidator,
    getSubCategoryValidator,
    updateSubCategoryValidator,
    deleteSubCategoryValidator
} = require('../utils/Validators/subCategoryValidator');


const subCategoryRouter = Router({mergeParams:true});


subCategoryRouter.route("/")
    .get(createFilterObject,getSubCategories)
    .post(setCategoryIdFormBody,addSubCategoryValidator,addSubCategory);

subCategoryRouter.route("/:id")
    .get(getSubCategoryValidator,getSubCategory)
    .put(updateSubCategoryValidator,updateSubCategory)
    .delete(deleteSubCategoryValidator,deleteSubCategory);


module.exports = subCategoryRouter;