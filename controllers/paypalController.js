require('dotenv').config();
const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const { client } = require('../services/paypalService');
const Order = require('../models/order.model');

const createOrder = async (req, res) => {
    try {
        const { user, books, totalPrice, shippingAddress, paymentMethod } = req.body;

        const trxRef = uuidv4();
        const orderNumber = req.body.orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

        const request = new paypal.orders.OrdersCreateRequest();
        const itemTotal = books.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const items = books.map(bookItem => ({
            name: `Book ID: ${bookItem.book}`, 
            unit_amount: {
                currency_code: 'USD',
                value: bookItem.price.toFixed(2)
            },
            quantity: bookItem.quantity.toString(),
            // category: 'PHYSICAL_GOODS'
        }));

        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: trxRef,
                amount: {
                    currency_code: 'USD',
                    value: totalPrice.toFixed(2),
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: itemTotal.toFixed(2)
                        }
                    }
                },
                items: items,
                description: `Order for ${books.length} book(s)`,
                custom_id: trxRef,
                // Include shipping address if provided
                ...(shippingAddress && {
                    shipping: {
                        address: {
                            address_line_1: shippingAddress.street,
                            admin_area_2: shippingAddress.city,
                            admin_area_1: shippingAddress.state,
                            postal_code: shippingAddress.zipCode,
                            country_code: shippingAddress.country === 'USA' ? 'US' : shippingAddress.country 
                        }
                    }
                })
            }],
            application_context: {
                return_url: 'http://localhost:4200/success',
                cancel_url: 'http://localhost:4200/err'
            }
        });

        const paypalOrder = await client().execute(request); 
        const approvalUrl = paypalOrder.result.links.find(link => link.rel === 'approve').href;

        // Save order to database with PayPal reference
        const newOrder = new Order({
            user,
            books,
            totalPrice,
            status: 'pending',
            shippingAddress,
            paymentMethod: paymentMethod || 'paypal',
            orderNumber,
            paypalOrderId: paypalOrder.result.id,
            transactionRef: trxRef
        });
        
        const savedOrder = await newOrder.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: savedOrder._id,
                orderNumber: savedOrder.orderNumber,
                paypalOrderId: paypalOrder.result.id,
                approvalUrl: approvalUrl,
                transactionRef: trxRef,
                totalPrice: totalPrice
            }
        });
        
    } catch (error) {
        console.error('PayPal Error:', error);
        
        // Only try to save failed order if we have basic required data
        if (req.body.user && req.body.books && req.body.totalPrice) {
            try {
                const failedOrder = new Order({
                    user: req.body.user,
                    books: req.body.books,
                    totalPrice: req.body.totalPrice,
                    status: 'cancelled',
                    shippingAddress: req.body.shippingAddress,
                    paymentMethod: 'paypal',
                    orderNumber: `FAILED-${Date.now()}`,
                    transactionRef: uuidv4(),
                    failureReason: error.message
                });
                
                await failedOrder.save();
            } catch (dbError) {
                console.error('Failed to save failed order:', dbError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Payment initialization failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

const captureOrder = async (req, res) => {
    try {
        const paypalOrderId = req.query.token;
        console.log(paypalOrderId);
        
        const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
        const capture = await client().execute(request);
        
        // Update order status in database
        const order = await Order.findOneAndUpdate(
            { paypalOrderId: paypalOrderId },
            { 
                status: capture.result.status === 'COMPLETED' ? 'processing' : 'pending',
                paypalCaptureId: capture.result.purchase_units[0].payments.captures[0].id,
                paidAt: new Date()
            },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Payment captured successfully',
            data: {
                orderId: order._id,
                status: order.status,
                captureId: capture.result.purchase_units[0].payments.captures[0].id
            }
        });
        
    } catch (error) {
        console.error('PayPal Capture Error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment capture failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    createOrder,
    captureOrder
}