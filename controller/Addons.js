const AddonsProduct = require('../models/AddonsProduct');

// @desc    Get all Addons Products
// @route   GET /api/addons
exports.getAllAddons = async (req, res) => {
  try {
    const addons = await AddonsProduct.find();
    res.status(200).json(addons);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single Addons Product by ID
// @route   GET /api/addons/:id
exports.getAddonById = async (req, res) => {
  try {
    const addon = await AddonsProduct.findById(req.params.id);
    if (!addon) return res.status(404).json({ message: 'Add-on not found' });
    res.status(200).json(addon);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new Addons Product
// @route   POST /api/addons
exports.createAddon = async (req, res) => {
  try {
    const { name, image, price, tag } = req.body;

    const newAddon = new AddonsProduct({ name, image, price, tag });
    const savedAddon = await newAddon.save();

    res.status(201).json(savedAddon);
  } catch (error) {
    res.status(400).json({ message: 'Invalid Data', error: error.message });
  }
};

// @desc    Update an Addons Product
// @route   PUT /api/addons/:id
exports.updateAddon = async (req, res) => {
  try {
    const updatedAddon = await AddonsProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAddon) return res.status(404).json({ message: 'Add-on not found' });

    res.status(200).json(updatedAddon);
  } catch (error) {
    res.status(400).json({ message: 'Update Failed', error: error.message });
  }
};

// @desc    Delete an Addons Product
// @route   DELETE /api/addons/:id
exports.deleteAddon = async (req, res) => {
  try {
    const deletedAddon = await AddonsProduct.findByIdAndDelete(req.params.id);
    if (!deletedAddon) return res.status(404).json({ message: 'Add-on not found' });

    res.status(200).json({ message: 'Add-on deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete Failed', error: error.message });
  }
};
