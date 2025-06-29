const { Router } = require("express");
const {
    addBrand,
    getAllBrands,
    getBrnad,
    UpdateBrand,
    deleteBrand
} = require("../controllers/brandController");
const {
    addBrandsValidator,
    getBrandValidtor,
    updateBrandValidtor,
    deleteBrandValidtor
} = require("../utils/Validators/brandValidator");

const brandRouter = Router();



brandRouter.route("/")
.get(getAllBrands)
.post(addBrandsValidator,addBrand);


brandRouter.route("/:id")
.get(getBrandValidtor,getBrnad)
.put(updateBrandValidtor,UpdateBrand)
.delete(deleteBrandValidtor,deleteBrand);

module.exports = brandRouter;