const mongoose = require('mongoose')

const loginHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    time: { type: Date, default: Date.now },
    location: {
      type: { type: String },
      coordinates: [Number],
    },
    ipAddress: String,
    device: String,
  },
  { timestamps: true }
)

loginHistorySchema.index({ user: 1, time: -1 })

module.exports = mongoose.model('LoginHistory', loginHistorySchema)
