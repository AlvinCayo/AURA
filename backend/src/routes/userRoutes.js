const express = require('express');
const router = express.Router();
// Importamos todo en una sola línea desde el controlador
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateProfilePhoto, 
  updateProfile, 
  deactivateAccount, 
  uploadNewLicense, 
  updateBusinessProfile, 
  getAllBusinesses 
} = require('../controllers/userController');

// Rutas de Autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas de Perfil General
router.get('/profile/:id/:role', getUserProfile);
router.put('/profile/photo/:id', updateProfilePhoto);
router.put('/profile/update/:id', updateProfile);
router.put('/profile/deactivate/:id', deactivateAccount);
router.put('/profile/license/:id', uploadNewLicense);

// Rutas de Negocio/Barbería
router.put('/profile/:id', updateBusinessProfile); // Actualizar horarios
router.get('/businesses', getAllBusinesses);      // Listar barberías

module.exports = router;