const  mongoose = require("mongoose");

const {Schema} = mongoose;
const { ObjectId } = Schema.Types;

const orderSchema = new Schema({
//   _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  books: [{
    book: {
      type: ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['paypal']
  },
  orderNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
    paypalOrderId: {
    type: String,
    sparse: true // Allows multiple null values
    },
    paypalCaptureId: {
    type: String,
    sparse: true
    },
    transactionRef: {
    type: String,
    unique: true
    },
    paidAt: {
    type: Date
    },
    failureReason: {
    type: String
    }
})
const Order = mongoose.model("Order",orderSchema);
module.exports = Order;