const slugify =  require("slugify");
const expressAsyncHandler  = require("express-async-handler");
const Category = require("../models/category");
const AppError =  require("../utils/AppError");


const addCategory = expressAsyncHandler(async (req, res, next) => { 
  const { body } = req;
  if (!body.name) {
    return next(new AppError(400, "name is required"));
  }

  const category = await Category.create({
    name: body.name,
    slug: slugify(body.name),
    image: body.image,
  });
  if (!category) {
    return next(new AppError(400, "category not added"));
  }
  res.status(201).json({
    status: "success",
    message: "category added successfully",
    data: category,
  });
});

const getCategories = expressAsyncHandler(async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const categories = await Category.find().skip(skip).limit(limit);
  if (categories.length === 0) {
    return next(new AppError(404, "No Categories Found"));
  }

  res.status(200).json({
    status: "success",
    message: "Get All Categories",
    result: categories.length,
    data: categories,
  });
});

const getCategory = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findOne({ _id: id });
  if (!category) {
    return next(new AppError(404, `Category Not Found By This Id : ${  id}`));
  }
  res.status(200).json({
    status: "success",
    message: "Get Single Category",
    data: category,
  });
});


const updateCategory = expressAsyncHandler(async (req, res, next) => {

    const {id} = req.params;
    const {body} = req;

    if(!body.name){
        return  next(new AppError(400, "Name is required"));
    }

    const category = await  Category.findOneAndUpdate({_id:id} , {
        name: body.name,
        slug: slugify(body.name),
        image:body.image
    },{ new: true })
    if(!category){
        return  next(new AppError(404, "Category not found"));
    }


    res.status(200).json({
        status: "success",
        message: "Category updated",
        data: category
    });
})

const deleteCategory = expressAsyncHandler(async (req, res,next) => {

    const {id} = req.params;

    const category = await Category.findOneAndDelete({_id:id});

    if(!category ){
        return  next( new  AppError(404,"Category not found"));
    }

    res.status(200).json({
        status:"success",
        message: "Category deleted successfully",
    })
}) 

module.exports = {
  addCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
