const slugify = require("slugify");
const expressAsyncHandler = require("express-async-handler");
const SubCategory = require("../models/subCategory");
const AppError = require("../utils/AppError");

const setCategoryIdFormBody = (req, res, next) => {
  if (!req.body.category) {
    req.body.category = req.params.categoryId;
  }
  next();
};
const addSubCategory = expressAsyncHandler(async (req, res, next) => {
  const { body } = req;
  // if(req.params.categoryId) body.category = req.params.categoryId;
  if (!body.name || !body.category) {
    return next(new AppError(400, "Name and Category is required"));
  }
  let subCategory = await SubCategory.create({
    name: body.name,
    slug: slugify(body.name),
    category: body.category,
  });
  if (!subCategory) {
    return next(new AppError(400, "SubCategory not added"));
  }
  subCategory = await subCategory.populate({
    path: "category",
    select: "name -_id",
  });

  res.status(201).json({
    status: "success",
    message: "SubCategory added successfully",
    data: subCategory,
  });
});

const createFilterObject = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) filterObject = { category: req.params.categoryId };
  req.filterObject = filterObject;
  next();
};
const getSubCategories = expressAsyncHandler(async (req, res, next) => {
  // const {categoryId} = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 120;
  const skip = (page - 1) * limit;

  const subCategories = await SubCategory.find(req.filterObject)
    .skip(skip)
    .limit(limit);
  // .populate({
  //     path: 'category',
  //     select: 'name'
  // });
  if (subCategories.length === 0) {
    return next(new AppError(404, "No Sub Categories Found"));
  }

  res.status(200).json({
    status: "success",
    message: "Get All Sub Categories",
    result: subCategories.length,
    data: subCategories,
  });
});

const getSubCategory = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subCategory = await SubCategory.findOne({ _id: id });
  if (!subCategory) {
    return next(
      new AppError(404, `SubCategory Not Found By This Id :  + ${id}`)
    );
  }
  res.status(200).json({
    status: "success",
    message: "Get Single SubCategory",
    data: subCategory,
  });
});

const updateSubCategory = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;
  console.log(body);
  if (!body.name) {
    return next(new AppError(400, "Name and Category is required"));
  }

  const subCategory = await SubCategory.findOneAndUpdate(
    { _id: id },
    {
      name: body.name,
      slug: slugify(body.name),
      category: body.category,
    },
    { new: true }
  );
  if (!subCategory) {
    return next(new AppError(404, "SubCategory not found"));
  }
  res.status(200).json({
    status: "success",
    message: "SubCategory updated",
    data: subCategory,
  });
});

const deleteSubCategory = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subCategory = await SubCategory.findOneAndDelete({ _id: id });

  if (!subCategory) {
    return next(new AppError(404, "SubCategory not found"));
  }

  res.status(200).json({
    status: "success",
    message: "SubCategory deleted successfully",
  });
});

module.exports = {
  addSubCategory,
  getSubCategories,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdFormBody,
  createFilterObject,
};
