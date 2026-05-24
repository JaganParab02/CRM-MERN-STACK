const express = require('express');
const User = require('../models/User');
const Lead = require('../models/Lead');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET current user's profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// PUT update current user's profile
router.put('/profile', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (password && password.length >= 6) user.password = password;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET all users (Admin only)
router.get('/', authorizeRole(['admin']), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    
    const leadsAgg = await Lead.aggregate([
      {
        $group: {
          _id: { user: '$assignedTo', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    const usersWithStats = users.map(user => {
      let won = 0;
      let lost = 0;
      let pending = 0;

      leadsAgg.forEach(group => {
        if (group._id.user && group._id.user.toString() === user._id.toString()) {
          if (group._id.status === 'won') won += group.count;
          else if (group._id.status === 'lost') lost += group.count;
          else pending += group.count;
        }
      });

      return {
        ...user,
        stats: { won, lost, pending }
      };
    });
    res.json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats,
    });
  } catch (error) {
    next(error);
  }
});

// POST create a new user (Admin only)
router.post('/', authorizeRole(['admin']), async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered.',
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || 'sales_rep',
      department: department || 'Sales',
      phone: phone || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT update user (Admin only)
router.put('/:id', authorizeRole(['admin']), async (req, res, next) => {
  try {
    const { name, email, role, department, phone, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update fields if provided
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (department) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE a user (Admin only)
router.delete('/:id', authorizeRole(['admin']), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
