// controllers/authController.js
const User = require('../models/User')
const LoginHistory = require('../models/LoginHistory')
const jwt = require('jsonwebtoken')

const signup = async (req, res) => {
  try {
    const user = new User(req.body)
    await user.save()
    res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { username, password, location } = req.body
    const user = await User.findOne({ username })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION_MINUTES * 60 || 60 * 24 * 7 * 60,
    })

    // Create a new login history entry
    const loginHistory = await LoginHistory.create({
      user: user._id,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
      ipAddress: req.ip,
      device: req.headers['user-agent'],
    })

    res.status(200).json({ token, loginLocation: loginHistory })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const showme = async (req, res) => {
  try {
    res.status(200).json({ id: req.user._id, username: req.user.username, role: req.user.role })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = { signup, login, showme }
