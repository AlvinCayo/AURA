const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { createService, getServicesByBusiness, deleteService } = require('../controllers/serviceController');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aura_servicios',
    allowed_formats: Array.of('jpg', 'jpeg', 'png')
  }
});

const upload = multer({ storage: storage });
const router = express.Router();

router.post('/create', upload.single('image'), createService);
router.get('/business/:businessId', getServicesByBusiness);
router.delete('/delete/:id', deleteService);
router.put('/update/:id', upload.single('image'), updateService);

module.exports = router;