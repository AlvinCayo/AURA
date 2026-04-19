const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Importar controladores
const { 
  registerUser, loginUser, getUserProfile, updateProfilePhoto, 
  updateProfile, deactivateAccount, uploadNewLicense, 
  updateBusinessProfile, getAllBusinesses, updateShopPhotos, savePushToken 
} = require('../controllers/userController');

// Configuración de Multer para subir fotos y PDFs a Cloudinary al instante
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aura_profiles',
    resource_type: 'auto', // Permite procesar tanto imágenes como PDFs
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
  }
});
const upload = multer({ storage: storage });

// NUEVA RUTA: Recibe un archivo, lo sube a la nube y devuelve el Link Oficial
router.post('/upload-file', upload.single('file'), (req, res) => {
  try {
    if (req.file && req.file.path) {
      res.json({ success: true, url: req.file.path });
    } else {
      res.status(400).json({ success: false, error: 'No se subió el archivo' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// --- Rutas Anteriores ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile/:id/:role', getUserProfile);
router.put('/profile/photo/:id', updateProfilePhoto);
router.put('/profile/update/:id', updateProfile);
router.put('/profile/deactivate/:id', deactivateAccount);
router.put('/profile/license/:id', uploadNewLicense);
router.put('/profile/:id', updateBusinessProfile); 
router.get('/businesses', getAllBusinesses);    
router.put('/push-token/:id', savePushToken);  

module.exports = router;