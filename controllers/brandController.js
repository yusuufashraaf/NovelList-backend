const expressAsyncHandler = require("express-async-handler");
const slugify = require("slugify");
const Brand = require("../models/brand");
const AppError = require('../utils/AppError');





const addBrand  = expressAsyncHandler(async (req,res,next)=>{

    const {body} = req;
    if(!body.name) next(new AppError(400 ,  "Name Is Require"));

    const brand = await Brand.create({
        name:body.name,
        slug : slugify(body.name),
        product:body.product, 
        image:body.image

    })

    if(!brand) next(new AppError(400, "Brand Not Added"));

    res.status(201).json({
        status:"success",
        massage: "Brand Added Successfully",
        data: brand
    })


})




const getAllBrands = expressAsyncHandler( async (req,res,next)=>{

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit ; 

    const brand = await Brand.find().skip(skip).limit(limit);

    if(brand.length === 0) next(new AppError(404 , "No Brands Found"));


    res.status(200).json({
        status:"Success",
        message:"Get All Brands",
        result : brand.length,
        data : brand
    })
})  




const getBrnad = expressAsyncHandler ( async (req , res , next)=>{
    const {id} = req.params;


    const brand = await Brand.findOne({_id:id});
    if(!brand) next(new AppError(404 , "Brand Not Found "));

    res.status(200).json({
        status:"Success",
        message:"Get Single Brand",
        data:brand
    })


})

const UpdateBrand = expressAsyncHandler ( async (req , res , next)=>{
    const {id} = req.params;
    const {body} = req;
    if(!body.name) next(new AppError(400, "Name is Require"));

    const brand = await Brand.findOneAndUpdate({_id:id},{
        name:body.name,
        slug:slugify(body.name),
        product:body.product,
        image:body.image
    },{new:true});

    if(!brand) next(new AppError(404 , "Brand Not Found"));

    res.status(200).json({
        status:"Success",
        message:"Brand Updated",
        data:brand
    })


})


const deleteBrand = expressAsyncHandler( async (req , res , next)=>{
    const {id} = req.params;
    const brand = await Brand.findOneAndDelete({_id:id});

    if(!brand) next(new AppError(404 , "Brand Not Found"));

    res.status(200).json({
        status:"Success",
        message:"Brand Deleted Successfully",
    })
})



module.exports =  {
    addBrand,
    getAllBrands,
    getBrnad,
    UpdateBrand,
    deleteBrand
}