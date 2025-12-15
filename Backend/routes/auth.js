const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validator');
const logger = require('../utils/logger');
const { upload, cloudinary } = require('../config/cloudinary');

// Register
router.post('/register',
  [
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Create user
      const user = new User({
        username,
        email,
        password
      });
      
      await user.save();
      
      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      logger.info(`User registered: ${username}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email, isActive: true });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      logger.info(`User logged in: ${user.username}`);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Get current user
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user preferences
router.patch('/preferences', 
  require('../middleware/auth').authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      
      if (req.body.preferences) {
        user.preferences = { ...user.preferences, ...req.body.preferences };
      }
      
      await user.save();
      
      res.json({ message: 'Preferences updated', preferences: user.preferences });
    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
);

// Update profile
router.patch('/profile',
  require('../middleware/auth').authMiddleware,
  [
    body('username').optional().isLength({ min: 3 }).trim(),
    body('email').optional().isEmail().normalizeEmail()
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if username is taken by another user
      if (req.body.username) {
        if (req.body.username !== user.username) {
          const existingUser = await User.findOne({ username: req.body.username });
          if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
          }
        }
        user.username = req.body.username;
      }
      
      // Check if email is taken by another user
      if (req.body.email) {
        if (req.body.email !== user.email) {
          const existingUser = await User.findOne({ email: req.body.email });
          if (existingUser) {
            return res.status(400).json({ error: 'Email already taken' });
          }
        }
        user.email = req.body.email;
      }
      
      await user.save();
      
      logger.info(`Profile updated for user ${user.username}`);
      
      res.json({ 
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: 'Failed to update profile', message: error.message });
    }
  }
);

// Change password
router.patch('/change-password',
  require('../middleware/auth').authMiddleware,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      
      // Verify current password
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Set new password
      user.password = req.body.newPassword;
      await user.save();
      
      logger.info(`Password changed for user: ${user.username}`);
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Upload profile picture
router.post('/profile-picture',
  require('../middleware/auth').authMiddleware,
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await User.findById(req.userId);
      
      // Delete old profile picture from Cloudinary if exists
      if (user.profilePicture) {
        try {
          const publicId = user.profilePicture.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`profile-pictures/${publicId}`);
        } catch (error) {
          logger.error('Error deleting old profile picture:', error);
        }
      }
      
      // Save new Cloudinary URL
      user.profilePicture = req.file.path;
      await user.save();
      
      logger.info(`Profile picture uploaded for user ${user.username}`);
      
      res.json({ 
        message: 'Profile picture uploaded successfully', 
        profilePicture: req.file.path 
      });
    } catch (error) {
      logger.error('Upload profile picture error:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }
);

// Remove profile picture
router.delete('/profile-picture',
  require('../middleware/auth').authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      
      // Delete from Cloudinary if exists
      if (user.profilePicture) {
        try {
          const publicId = user.profilePicture.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`profile-pictures/${publicId}`);
        } catch (error) {
          logger.error('Error deleting profile picture from Cloudinary:', error);
        }
      }
      
      user.profilePicture = null;
      await user.save();
      
      logger.info(`Profile picture removed for user ${user.username}`);
      
      res.json({ message: 'Profile picture removed successfully' });
    } catch (error) {
      logger.error('Remove profile picture error:', error);
      res.status(500).json({ error: 'Failed to remove profile picture' });
    }
  }
);

module.exports = router;
