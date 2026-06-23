const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const mockDb = require('../utils/mockDb');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'ai_medassist_secure_jwt_token_2026_@_key',
    { expiresIn: '30d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, age, gender } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    const emailLower = email.toLowerCase();

    // Check if MongoDB is connected
    if (process.env.MONGO_CONNECTED === 'true') {
      const userExists = await User.findOne({ email: emailLower });
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      }

      const user = await User.create({
        name,
        email: emailLower,
        password,
        role: role || 'Patient',
        phone: phone || '',
        age: age ? Number(age) : null,
        gender: gender || '',
      });

      return res.status(201).json({
        success: true,
        token: generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      // In-memory fallback
      const userExists = mockDb.getMockUserByEmail(emailLower);
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists in mock store' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newMockUser = {
        _id: `user_${Date.now()}`,
        name,
        email: emailLower,
        password: hashedPassword,
        role: role || 'Patient',
        phone: phone || '',
        age: age ? Number(age) : null,
        gender: gender || '',
        medicalHistory: '',
        createdAt: new Date()
      };

      mockDb.saveMockUser(newMockUser);

      return res.status(201).json({
        success: true,
        token: generateToken(newMockUser),
        user: {
          id: newMockUser._id,
          name: newMockUser.name,
          email: newMockUser.email,
          role: newMockUser.role,
        }
      });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const emailLower = email.toLowerCase();

    if (process.env.MONGO_CONNECTED === 'true') {
      const user = await User.findOne({ email: emailLower });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      return res.status(200).json({
        success: true,
        token: generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      // In-memory fallback
      const user = mockDb.getMockUserByEmail(emailLower);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      return res.status(200).json({
        success: true,
        token: generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user profile & updates
// @route   GET /api/auth/profile, PUT /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // req.user is loaded in authMiddleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, age, gender, medicalHistory } = req.body;

    if (process.env.MONGO_CONNECTED === 'true') {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      user.name = name || user.name;
      user.phone = phone !== undefined ? phone : user.phone;
      user.age = age !== undefined ? Number(age) : user.age;
      user.gender = gender !== undefined ? gender : user.gender;
      user.medicalHistory = medicalHistory !== undefined ? medicalHistory : user.medicalHistory;

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          age: updatedUser.age,
          gender: updatedUser.gender,
          medicalHistory: updatedUser.medicalHistory
        }
      });
    } else {
      // In-memory fallback
      const user = mockDb.getMockUserById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      user.name = name || user.name;
      user.phone = phone !== undefined ? phone : user.phone;
      user.age = age !== undefined ? Number(age) : user.age;
      user.gender = gender !== undefined ? gender : user.gender;
      user.medicalHistory = medicalHistory !== undefined ? medicalHistory : user.medicalHistory;

      mockDb.saveMockUser(user);

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          age: user.age,
          gender: user.gender,
          medicalHistory: user.medicalHistory
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Forgot Password Mock
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide an email' });
    }
    
    // Simulate reset email link creation
    res.status(200).json({
      success: true,
      message: `If an account with email ${email} exists, a password reset link has been sent.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword
};
