const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { prisma } = require('../config/db');
const mockDb = require('../utils/mockDb');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id || user._id, 
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

    if (process.env.DB_CONNECTED === 'true') {
      const userExists = await prisma.user.findUnique({ where: { email: emailLower } });
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          name,
          email: emailLower,
          password: hashedPassword,
          role: role || 'Patient',
          phone: phone || '',
          age: age ? Number(age) : null,
          gender: gender || '',
        }
      });

      return res.status(201).json({
        success: true,
        token: generateToken(user),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      const userExists = mockDb.getMockUserByEmail(emailLower);
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists in mock store' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newMockUser = {
        id: `user_${Date.now()}`,
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
          id: newMockUser.id,
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

    if (process.env.DB_CONNECTED === 'true') {
      const user = await prisma.user.findUnique({ where: { email: emailLower } });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      return res.status(200).json({
        success: true,
        token: generateToken(user),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
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
          id: user.id || user._id,
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

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
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

    if (process.env.DB_CONNECTED === 'true') {
      const userId = req.user.id || req.user._id;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || user.name,
          phone: phone !== undefined ? phone : user.phone,
          age: age !== undefined ? Number(age) : user.age,
          gender: gender !== undefined ? gender : user.gender,
          medicalHistory: medicalHistory !== undefined ? medicalHistory : user.medicalHistory
        }
      });

      res.status(200).json({
        success: true,
        user: {
          id: updatedUser.id,
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
      const userId = req.user.id || req.user._id;
      const user = mockDb.getMockUserById(userId);
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
          id: user.id || user._id,
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
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide an email' });
    }
    
    res.status(200).json({
      success: true,
      message: `If an account with email ${email} exists, a password reset link has been sent.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Google credential missing' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload;
    const emailLower = email.toLowerCase();

    if (process.env.DB_CONNECTED === 'true') {
      let user = await prisma.user.findUnique({ where: { email: emailLower } });
      
      if (!user) {
        const hashedPassword = await bcrypt.hash(sub, 10);
        user = await prisma.user.create({
          data: {
            name,
            email: emailLower,
            password: hashedPassword,
            role: 'Patient',
            phone: '',
            gender: ''
          }
        });
      }
      return res.status(200).json({
        success: true,
        token: generateToken(user),
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } else {
      let user = mockDb.getMockUserByEmail(emailLower);
      if (!user) {
        user = {
          id: `google_user_${Date.now()}`,
          name,
          email: emailLower,
          password: bcrypt.hashSync(sub, 10),
          role: 'Patient',
          phone: '',
          gender: '',
          medicalHistory: '',
          createdAt: new Date()
        };
        mockDb.saveMockUser(user);
      }
      return res.status(200).json({
        success: true,
        token: generateToken(user),
        user: { id: user.id || user._id, name: user.name, email: user.email, role: user.role }
      });
    }
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, error: 'Failed to authenticate with Google' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  googleLogin
};
