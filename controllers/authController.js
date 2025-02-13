// controllers/authController.js
const User = require('../models/User')
const LoginHistory = require('../models/LoginHistory')
const jwt = require('jsonwebtoken')

const signup = async (req, res) => {
  try {
    const { username, password } = req.body
    const userExists = await User.findOne({ username })
    if (userExists) {
      return res.status(409).json({ message: 'Username already exists' })
    }
    const user = new User({ username, password })
    const savedUser = await user.save()
    savedUser.password = undefined
    return res.status(201).json({ message: 'User created successfully', user: savedUser })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { username, password, location } = req.body
    const user = await User.findOne({ username })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' })
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

    return res.status(200).json({ token, loginHistory })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const showme = async (req, res) => {
  try {
    return res.status(200).json({ id: req.user._id, username: req.user.username, role: req.user.role })
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token' })
  }
}

module.exports = { signup, login, showme }
