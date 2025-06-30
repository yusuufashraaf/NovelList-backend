
const Router = require('express');

const router = new Router();
const paypalController = require('../controllers/paypalController');


const validateOrder = require('../middlewares/validateOrder');
// router.get('',paypalController);
router.post('/create-test-order',validateOrder.validateCreateOrder,validateOrder.handleValidationErrors,paypalController.createOrder)
router.get('/confirm',paypalController.captureOrder)
module.exports=router;