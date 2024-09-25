// models/Order.js

const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String, required: true }, 
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    otp: { type: String, required: true },
    orderId: { type: String, unique: true }, 
    remarks: { type: String }, 
    location: {
      type: { type: String, default: 'Point' }, // GeoJSON format for location
      coordinates: { type: [Number], required: true },
    },
  },
  { timestamps: true }
)

// Index for geospatial queries
orderSchema.index({ location: '2dsphere' })

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
