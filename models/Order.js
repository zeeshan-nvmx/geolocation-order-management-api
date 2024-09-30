// models/Order.js

const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: String, required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    customerName: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    otp: { type: String, required: true },
    orderId: { type: String, unique: true },
    remarks: { type: String },
    existingBrand: { type: String },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)


























// const mongoose = require('mongoose')

// const orderSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
//     products: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//         quantity: { type: Number, required: true },
//       },
//     ],
//     totalAmount: { type: Number, required: true },
//     status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
//     otp: { type: String, required: true },
//   },
//   { timestamps: true }
// )

// module.exports = mongoose.model('Order', orderSchema)
