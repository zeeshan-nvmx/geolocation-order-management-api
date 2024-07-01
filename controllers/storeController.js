// controllers/storeController.js
const Store = require('../models/Store')

exports.createStore = async (req, res) => {
  try {
    const store = new Store({
      ...req.body,
      createdBy: req.user.id,
    })
    await store.save()
    return res.status(201).json(store)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find()
    return res.json(stores)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
