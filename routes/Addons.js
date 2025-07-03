const express = require('express');
const router = express.Router();
const addonController = require('../controller/Addons');

router.get('/addons', addonController.getAllAddons);
router.get('/addons/:id', addonController.getAddonById);
router.post('/addons', addonController.createAddon);
router.put('/:id', addonController.updateAddon);
router.delete('/addons/:id', addonController.deleteAddon);

module.exports = router;
