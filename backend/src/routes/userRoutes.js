const express = require('express');
const { getUserProfile, updateProfilePhoto, updateProfile, deactivateAccount, uploadNewLicense } = require('../controllers/userController');
const { registerUser, loginUser, getUserProfile, getAllBusinesses, updateBusinessProfile } = require('../controllers/userController');
const { registerUser, loginUser, getUserProfile, getAllBusinesses } = require('../controllers/userController');

const router = express.Router();

router.get('/profile/:id/:role', getUserProfile);
router.put('/profile/photo/:id', updateProfilePhoto);
router.put('/profile/update/:id', updateProfile);
router.put('/profile/deactivate/:id', deactivateAccount);
router.put('/profile/license/:id', uploadNewLicense);
router.put('/profile/:id', updateBusinessProfile);
router.get('/businesses', getAllBusinesses);

module.exports = router;