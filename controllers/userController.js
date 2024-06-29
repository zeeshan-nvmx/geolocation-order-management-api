const User = require('../models/User')

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


exports.getUserDashboard = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const orders = await Order.find({
      user: req.user.id,
      createdAt: { $gte: today },
      status: 'confirmed',
    })

    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0)

    res.json({
      ordersToday: orders.length,
      totalAmount,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
