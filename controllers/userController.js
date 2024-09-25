const User = require('../models/User')
const Order = require('../models/Order')
const LoginHistory = require('../models/LoginHistory')

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    return res.json(users)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.json(user)
  } catch (error) {
    return res.status(500).json({ message: error.message })
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

    return res.status(200).json({
      ordersToday: orders.length,
      totalAmount,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}


// Fetch login history with role-based access control and pagination
exports.getLoginHistory = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' // Check if the requesting user is an admin
    let userId = req.user.id // Default userId is the logged-in user's ID

    // If admin and a userId is provided in the URL, use that userId, otherwise use the admin's own id
    if (isAdmin && req.params.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
        return res.status(400).json({ message: 'Invalid userId format' })
      }
      userId = req.params.userId
    }

    // Pagination parameters from query
    const page = parseInt(req.query.page) || 1 // Default to page 1
    const limit = parseInt(req.query.limit) || 10 // Default to 10 items per page
    const skip = (page - 1) * limit // Number of items to skip

    // Fetch login history, sorted by time (most recent first), with pagination
    const loginHistory = await LoginHistory.find({ user: userId }).sort({ time: -1 }).skip(skip).limit(limit)

    // Get total number of login history entries for the user
    const totalLoginHistory = await LoginHistory.countDocuments({ user: userId })

    if (!loginHistory.length) {
      return res.status(404).json({ message: 'No login history found' })
    }

    return res.status(200).json({
      loginHistory,
      currentPage: page,
      totalPages: Math.ceil(totalLoginHistory / limit),
      totalEntries: totalLoginHistory,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
