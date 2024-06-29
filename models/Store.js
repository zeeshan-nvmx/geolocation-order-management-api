// models/Store.js

const mongoose = require('mongoose')

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    ownerPhone: { type: String, required: true },
    address: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Store', storeSchema)
