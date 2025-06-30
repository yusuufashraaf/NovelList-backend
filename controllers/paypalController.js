require('dotenv').config();
const express = require('express');
const { client } = require('../services/paypalService');
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');



const createOrder = async (req,res)=>{

    try {
        const trxRef = uuidv4();
        const request = new paypal.orders.OrdersCreateRequest();
        const amount ='10.00'; //should get it from client side
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: { currency_code: 'USD', value: amount },
                description: 'Sandbox Test Payment',
                custom_id: trxRef 
            }],
            application_context: {
                return_url: 'http://localhost:4200/success', // Angular route
                cancel_url: 'http://localhost:4200/err' // Angular route
            }
            });

        const order = await client().execute(request); 
        const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
        // i will make this function after connecting with databaseAdd commentMore actions
        // await saveTransactionToDB({        
        //     id: trxRef,
        //     paypalOrderId: order.result.id,
        //     amount: amount,
        //     status: 'PENDING'
        // });
        
  } catch (error) {
     console.error('PayPal Error:', error);
    // Save failed transaction
    // await saveTransactionToDB({
    //   id: uuidv4(),
    //   status: 'FAILED',
    //   error: error.message
    // });
    res.status(500).json({ error: 'Payment initialization failed' });
  
  }

}


module.exports ={
    createOrder
}