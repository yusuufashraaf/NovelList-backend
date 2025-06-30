const Router = require('express')

const router = new Router();
const paypalController = require("../controllers/paypalController");
// router.get('',paypalController);
router.post('/create-test-order',paypalController.createOrder)

module.exports=router;