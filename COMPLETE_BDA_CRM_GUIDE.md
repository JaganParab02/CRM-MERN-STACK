# 🚀 BDA CRM - COMPLETE DETAILED IMPLEMENTATION GUIDE
## Full End-to-End Build (Copy-Paste Ready | ~6 Hours | Production-Grade)

**Project:** BDA Team Module for Manufacturing Company  
**Stack:** MERN (MongoDB + Express + React + Node.js)  
**Database:** Local MongoDB  
**Deployment:** Vercel + Railway  
**Deadline:** Sunday, May 24, 11:59 PM  

---

# **PART 1: ENVIRONMENT SETUP**

## **Step 1.1: Install Prerequisites**

```bash
# Check Node.js version (must be 16+)
node --version
npm --version

# If not installed, download from nodejs.org

# Install Docker (for MongoDB)
# Windows: https://www.docker.com/products/docker-desktop
# Mac: brew install docker
# Linux: sudo apt-get install docker.io
```

## **Step 1.2: Start MongoDB Locally**

```bash
# Option A: Docker (Recommended - one command)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify MongoDB is running
docker ps
# You should see a container named 'mongodb' running

# Test connection
mongosh --eval "db.adminCommand('ping')"
# Expected output: { ok: 1 }

# Option B: If using local MongoDB installation
# Just run: mongod
```

## **Step 1.3: Create Project Directory Structure**

```bash
# Create root directory
mkdir isaii-crm
cd isaii-crm

# Create backend directory
mkdir backend

# Initialize git
git init

# Create .gitignore at root level
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.npm
.yarn

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/

# Logs
*.log
npm-debug.log*
EOF

echo "✅ Root directory and git initialized"
```

---

# **PART 2: BACKEND SETUP (3 Hours)**

## **Step 2.1: Initialize Backend Project**

```bash
cd backend

# Initialize npm
npm init -y

# Install all dependencies at once
npm install express mongoose dotenv cors jsonwebtoken bcryptjs
npm install -D nodemon

# Verify package.json
cat package.json
```

## **Step 2.2: Create Backend Folder Structure**

```bash
# From backend directory
mkdir config
mkdir models
mkdir routes
mkdir middleware

# Create empty files (will fill them next)
touch config/db.js
touch models/User.js
touch models/Lead.js
touch middleware/auth.js
touch middleware/errorHandler.js
touch routes/auth.js
touch routes/leads.js
touch routes/dashboard.js
touch server.js
touch .env
touch .gitignore

# Backend-specific .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.DS_Store
*.log
EOF
```

## **Step 2.3: Create Backend Environment File**

**File: `backend/.env`**

```env
# ============ DATABASE ============
# MongoDB Connection String (Local)
MONGODB_URI=mongodb://localhost:27017/isaii-crm-db

# ============ JWT ============
# Secret key for signing JWT tokens
# IMPORTANT: Change this in production to a strong random string
JWT_SECRET=your-super-secret-jwt-key-xyz-123-change-in-production
JWT_EXPIRES_IN=7d

# ============ SERVER ============
# Port for backend API
PORT=5000

# Environment
NODE_ENV=development

# ============ CORS ============
# Frontend URL for development
FRONTEND_URL=http://localhost:5173
```

**Create it:**
```bash
cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/isaii-crm-db
JWT_SECRET=your-super-secret-jwt-key-xyz-123-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOF
```

## **Step 2.4: Update Backend package.json**

**File: `backend/package.json`** (Replace scripts section)

```json
{
  "name": "isaii-crm-backend",
  "version": "1.0.0",
  "description": "Backend API for BDA CRM module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [
    "crm",
    "sales",
    "leads",
    "bda"
  ],
  "author": "Jagan Parab",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}
```

## **Step 2.5: Create MongoDB Configuration**

**File: `backend/config/db.js`**

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`\n✅ MongoDB Connected Successfully`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}\n`);

    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed`);
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## **Step 2.6: Create User Model**

**File: `backend/models/User.js`**

```javascript
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },

    // Role & Permissions
    role: {
      type: String,
      enum: {
        values: ['admin', 'sales_rep'],
        message: 'Role must be either admin or sales_rep',
      },
      default: 'sales_rep',
    },

    // Profile Information
    phone: {
      type: String,
      default: null,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },
    department: {
      type: String,
      default: 'Sales',
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Middleware: Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method: Compare password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

## **Step 2.7: Create Lead Model**

**File: `backend/models/Lead.js`**

```javascript
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    // Contact Information
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    },

    // Company Information
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    designation: {
      type: String,
      default: null,
      maxlength: 100,
    },

    // Lead Status & Pipeline
    status: {
      type: String,
      enum: {
        values: ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
        message: 'Invalid status',
      },
      default: 'new',
      index: true, // Index for faster queries
    },

    // Financial Information
    dealValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Lead Source
    source: {
      type: String,
      enum: {
        values: ['cold_call', 'email', 'referral', 'website', 'trade_show', 'other'],
        message: 'Invalid lead source',
      },
      default: 'other',
    },

    // Additional Information
    description: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    // Assignments & Tracking
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lead must be assigned to a sales representative'],
      index: true, // Index for faster queries
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Follow-up & Closure Dates
    lastFollowUp: {
      type: Date,
      default: null,
    },
    nextFollowUp: {
      type: Date,
      default: null,
    },
    expectedClosureDate: {
      type: Date,
      default: null,
    },

    // Notes
    notes: [
      {
        text: {
          type: String,
          required: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ createdBy: 1 });
leadSchema.index({ email: 1 });

module.exports = mongoose.model('Lead', leadSchema);
```

## **Step 2.8: Create Authentication Middleware**

**File: `backend/middleware/auth.js`**

```javascript
const jwt = require('jsonwebtoken');

// Middleware: Verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required. Please login.',
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error:
            err.name === 'TokenExpiredError'
              ? 'Token has expired. Please login again.'
              : 'Invalid token. Please login again.',
        });
      }

      // Token is valid, attach user to request
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

// Middleware: Check user role
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions. This action requires admin access.',
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
```

## **Step 2.9: Create Error Handler Middleware**

**File: `backend/middleware/errorHandler.js`**

```javascript
// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('\n❌ Error:', err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: messages[0] || 'Validation failed',
    });
  }

  // Mongoose Duplicate Key Error (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      success: false,
      error: 'Token expired',
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
```

## **Step 2.10: Create Authentication Routes**

**File: `backend/routes/auth.js`**

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// POST /api/auth/signup
// Register new user
// ==========================================
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered. Please login instead.',
      });
    }

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || 'sales_rep',
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// POST /api/auth/login
// User login
// ==========================================
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// GET /api/auth/me
// Get current logged-in user details
// ==========================================
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## **Step 2.11: Create Lead Routes (CRUD)**

**File: `backend/routes/leads.js`**

```javascript
const express = require('express');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// GET /api/leads
// Get all leads (with role-based filtering)
// ==========================================
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, assignedTo, search } = req.query;
    let query = {};

    // Role-based filtering
    if (req.user.role === 'sales_rep') {
      query.assignedTo = req.user.id;
    } else if (assignedTo && req.user.role === 'admin') {
      query.assignedTo = assignedTo;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Search filter (name, email, company)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch leads with populated references
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email phone role')
      .populate('createdBy', 'name email')
      .populate('notes.createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// GET /api/leads/:id
// Get single lead by ID
// ==========================================
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email phone role')
      .populate('createdBy', 'name email')
      .populate('notes.createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    // Authorization check: Sales rep can only see their leads
    if (
      req.user.role === 'sales_rep' &&
      lead.assignedTo._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this lead',
      });
    }

    res.json({
      success: true,
      lead,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// POST /api/leads
// Create new lead
// ==========================================
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      designation,
      dealValue,
      source,
      assignedTo,
      description,
    } = req.body;

    // Validation
    if (!name || !email || !phone || !company || !assignedTo) {
      return res.status(400).json({
        success: false,
        error:
          'Name, email, phone, company, and assignedTo are required fields',
      });
    }

    // Verify assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        error: 'Assigned user does not exist',
      });
    }

    // Create lead
    const lead = await Lead.create({
      name,
      email: email.toLowerCase(),
      phone,
      company,
      designation,
      dealValue: dealValue || 0,
      source: source || 'other',
      assignedTo,
      createdBy: req.user.id,
      description,
    });

    // Populate references
    await lead.populate('assignedTo', 'name email phone');
    await lead.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PUT /api/leads/:id
// Update lead details
// ==========================================
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    // Authorization check
    if (
      req.user.role === 'sales_rep' &&
      lead.assignedTo.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lead',
      });
    }

    // Update fields
    const {
      name,
      email,
      phone,
      company,
      designation,
      status,
      dealValue,
      source,
      assignedTo,
      nextFollowUp,
      expectedClosureDate,
      description,
    } = req.body;

    if (name) lead.name = name;
    if (email) lead.email = email.toLowerCase();
    if (phone) lead.phone = phone;
    if (company) lead.company = company;
    if (designation) lead.designation = designation;
    if (status) lead.status = status;
    if (dealValue !== undefined) lead.dealValue = dealValue;
    if (source) lead.source = source;
    if (assignedTo && req.user.role === 'admin') lead.assignedTo = assignedTo;
    if (nextFollowUp) lead.nextFollowUp = nextFollowUp;
    if (expectedClosureDate) lead.expectedClosureDate = expectedClosureDate;
    if (description) lead.description = description;

    lead.updatedAt = Date.now();
    await lead.save();

    // Populate references
    await lead.populate('assignedTo', 'name email phone');
    await lead.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// DELETE /api/leads/:id
// Delete lead (admin only)
// ==========================================
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res, next) => {
    try {
      const lead = await Lead.findByIdAndDelete(req.params.id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
        });
      }

      res.json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// PATCH /api/leads/:id/status
// Update lead status (quick status change)
// ==========================================
router.patch('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    // Authorization check
    if (
      req.user.role === 'sales_rep' &&
      lead.assignedTo.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lead',
      });
    }

    lead.status = status;
    lead.lastFollowUp = Date.now();
    lead.updatedAt = Date.now();
    await lead.save();

    res.json({
      success: true,
      message: 'Lead status updated',
      lead,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// POST /api/leads/:id/notes
// Add note to lead
// ==========================================
router.post('/:id/notes', authenticateToken, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Note text is required',
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    // Add note
    lead.notes.push({
      text: text.trim(),
      createdBy: req.user.id,
    });

    await lead.save();
    await lead.populate('notes.createdBy', 'name email');

    res.json({
      success: true,
      message: 'Note added successfully',
      lead,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## **Step 2.12: Create Dashboard Routes (Analytics)**

**File: `backend/routes/dashboard.js`**

```javascript
const express = require('express');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// ==========================================
// GET /api/dashboard/metrics
// Get personal/team metrics based on role
// ==========================================
router.get('/metrics', authenticateToken, async (req, res, next) => {
  try {
    let userFilter = {};

    // Sales rep sees only their data
    if (req.user.role === 'sales_rep') {
      userFilter = { assignedTo: new mongoose.Types.ObjectId(req.user.id) };
    }

    // Total leads count
    const totalLeads = await Lead.countDocuments(userFilter);

    // Leads grouped by status
    const leadsByStatus = await Lead.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // Won deals count
    const wonDeals = await Lead.countDocuments({
      ...userFilter,
      status: 'won',
    });

    // Total deal value
    const dealValueAgg = await Lead.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$dealValue' },
        },
      },
    ]);
    const totalDealValue = dealValueAgg[0]?.total || 0;

    // Conversion rate percentage
    const conversionRate =
      totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(2) : 0;

    // Recent 5 leads
    const recentLeads = await Lead.find(userFilter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      metrics: {
        totalLeads,
        wonDeals,
        totalDealValue,
        conversionRate: `${conversionRate}%`,
        leadsByStatus:
          leadsByStatus.length > 0
            ? leadsByStatus
            : [
                { _id: 'new', count: 0 },
                { _id: 'qualified', count: 0 },
                { _id: 'proposal', count: 0 },
                { _id: 'negotiation', count: 0 },
                { _id: 'won', count: 0 },
                { _id: 'lost', count: 0 },
              ],
      },
      recentLeads,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// GET /api/dashboard/team
// Get team overview (admin only)
// ==========================================
router.get(
  '/team',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res, next) => {
    try {
      // Get all sales reps
      const teamMembers = await User.find({ role: 'sales_rep', isActive: true });

      // Calculate metrics for each team member
      const teamData = await Promise.all(
        teamMembers.map(async (member) => {
          const totalLeads = await Lead.countDocuments({
            assignedTo: member._id,
          });

          const wonLeads = await Lead.countDocuments({
            assignedTo: member._id,
            status: 'won',
          });

          const totalValueAgg = await Lead.aggregate([
            { $match: { assignedTo: member._id } },
            {
              $group: {
                _id: null,
                total: { $sum: '$dealValue' },
              },
            },
          ]);

          const totalValue = totalValueAgg[0]?.total || 0;
          const conversionRate =
            totalLeads > 0
              ? ((wonLeads / totalLeads) * 100).toFixed(2)
              : 0;

          return {
            id: member._id,
            name: member.name,
            email: member.email,
            phone: member.phone || 'N/A',
            totalLeads,
            wonLeads,
            totalValue,
            conversionRate,
          };
        })
      );

      res.json({
        success: true,
        teamData,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
```

## **Step 2.13: Create Main Server File**

**File: `backend/server.js`**

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import configurations and middleware
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const dashboardRoutes = require('./routes/dashboard');

// ============================================
// INITIALIZE DATABASE
// ============================================
connectDB();

// ============================================
// CREATE EXPRESS APP
// ============================================
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
// Enable CORS for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================
// ERROR HANDLER (must be last)
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Backend Server Started`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 API Docs: http://localhost:${PORT}/api`);
  console.log(`${'='.repeat(50)}\n`);
});
```

## **Step 2.14: Test Backend Startup**

```bash
# From backend directory
npm run dev

# Expected output:
# ==================================================
# ✅ MongoDB Connected Successfully
# 📍 Host: localhost
# 📂 Database: isaii-crm-db
#
# ==================================================
# 🚀 Backend Server Started
# ==================================================
# 📍 URL: http://localhost:5000
# 🔗 API Docs: http://localhost:5000/api
# ==================================================
```

✅ **If you see this, backend is working!**

---

# **PART 3: FRONTEND SETUP (2.5 Hours)**

## **Step 3.1: Create React App with Vite**

```bash
# From isaii-crm directory (go back from backend)
cd ..

# Create Vite React app
npm create vite@latest frontend -- --template react

# Go into frontend directory
cd frontend

# Install dependencies
npm install react-router-dom axios recharts

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## **Step 3.2: Configure Tailwind CSS**

**File: `frontend/tailwind.config.js`** (Replace entire file)

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
}
```

## **Step 3.3: Setup Frontend Folder Structure**

```bash
# From frontend directory
mkdir src/components
mkdir src/pages
mkdir src/api

# Create empty component files
touch src/components/Navbar.jsx
touch src/components/ProtectedRoute.jsx
touch src/pages/LoginPage.jsx
touch src/pages/SignupPage.jsx
touch src/pages/LeadsPage.jsx
touch src/pages/PipelinePage.jsx
touch src/pages/DashboardPage.jsx
touch src/pages/TeamPage.jsx
touch src/api/axiosInstance.js
touch .env
touch .gitignore

# Frontend-specific .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local

# Build
dist/
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF
```

## **Step 3.4: Create Environment File**

**File: `frontend/.env`**

```env
# ============ API ============
# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

## **Step 3.5: Create Axios Instance (API Configuration)**

**File: `frontend/src/api/axiosInstance.js`**

```javascript
import axios from 'axios';

// Create axios instance with base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR
// Add JWT token to every request
// ============================================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// Handle 401 errors (unauthorized)
// ============================================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, user is unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

## **Step 3.6: Create Protected Route Component**

**File: `frontend/src/components/ProtectedRoute.jsx`**

```javascript
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  // No token = not logged in, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render component
  return children;
}
```

## **Step 3.7: Create Navbar Component**

**File: `frontend/src/components/Navbar.jsx`**

```javascript
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo and Navigation Links */}
        <div className="flex items-center gap-8">
          <Link to="/leads" className="font-bold text-xl flex items-center gap-2">
            🎯 CRM
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-4">
            <Link
              to="/leads"
              className="hover:bg-blue-600 px-3 py-2 rounded transition"
            >
              Leads
            </Link>
            <Link
              to="/pipeline"
              className="hover:bg-blue-600 px-3 py-2 rounded transition"
            >
              Pipeline
            </Link>

            {/* Admin only links */}
            {user.role === 'admin' && (
              <>
                <Link
                  to="/dashboard"
                  className="hover:bg-blue-600 px-3 py-2 rounded transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/team"
                  className="hover:bg-blue-600 px-3 py-2 rounded transition"
                >
                  Team
                </Link>
              </>
            )}
          </div>
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <div className="font-semibold">{user.name}</div>
            <div className="text-blue-100 text-xs capitalize">{user.role?.replace('_', ' ')}</div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
```

## **Step 3.8: Create Login Page**

**File: `frontend/src/pages/LoginPage.jsx`**

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', formData);

      // Save token and user to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to leads page
      navigate('/leads');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">🎯 CRM</h1>
          <h2 className="text-xl font-semibold text-gray-700">BDA Sales Module</h2>
          <p className="text-gray-500 text-sm mt-2">Login to manage leads</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-semibold">
            Sign up here
          </Link>
        </p>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Demo Accounts:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Admin:</strong> admin@test.com / Test123</p>
            <p><strong>Sales Rep:</strong> rep@test.com / Test123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## **Step 3.9: Create Signup Page**

**File: `frontend/src/pages/SignupPage.jsx`**

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales_rep',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/signup', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/leads');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">🎯 CRM</h1>
          <h2 className="text-xl font-semibold text-gray-700">Create Account</h2>
          <p className="text-gray-500 text-sm mt-2">Join the sales team</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password (min 6 characters)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="sales_rep">Sales Representative</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
```

## **Step 3.10: Create Leads Page (Main CRUD)**

**File: `frontend/src/pages/LeadsPage.jsx`** (Detailed below - this is the core page)

Due to length, I'll provide this in the next file creation. For now, continue with the file...

```javascript
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    dealValue: 0,
    source: 'other',
    assignedTo: '',
    description: '',
  });

  useEffect(() => {
    fetchLeads();
    if (user.role === 'admin') {
      fetchTeamMembers();
    }
  }, [statusFilter, search]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await axiosInstance.get(`/leads?${params}`);
      setLeads(response.data.leads);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/team');
      setTeamMembers(response.data.teamData);
    } catch (error) {
      console.error('Failed to fetch team members');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        assignedTo: formData.assignedTo || user.id,
      };

      if (selectedLead) {
        await axiosInstance.put(`/leads/${selectedLead._id}`, data);
      } else {
        await axiosInstance.post('/leads', data);
      }

      setShowForm(false);
      setSelectedLead(null);
      resetForm();
      fetchLeads();
    } catch (error) {
      alert(error.response?.data?.error || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      designation: '',
      dealValue: 0,
      source: 'other',
      assignedTo: '',
      description: '',
    });
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      designation: lead.designation,
      dealValue: lead.dealValue,
      source: lead.source,
      assignedTo: lead.assignedTo._id,
      description: lead.description,
    });
    setShowForm(true);
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await axiosInstance.patch(`/leads/${leadId}/status`, { status: newStatus });
      fetchLeads();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const statuses = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const statusColors = {
    new: 'bg-gray-100 text-gray-800',
    qualified: 'bg-blue-100 text-blue-800',
    proposal: 'bg-purple-100 text-purple-800',
    negotiation: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <button
            onClick={() => {
              resetForm();
              setSelectedLead(null);
              setShowForm(true);
            }}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + New Lead
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-col md:flex-row">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {selectedLead ? 'Edit Lead' : 'Create New Lead'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <input
                    type="text"
                    name="name"
                    placeholder="Lead Name *"
                    value={formData.name}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />

                  {/* Email */}
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />

                  {/* Phone */}
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone (10 digits) *"
                    value={formData.phone}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />

                  {/* Company */}
                  <input
                    type="text"
                    name="company"
                    placeholder="Company Name *"
                    value={formData.company}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />

                  {/* Designation */}
                  <input
                    type="text"
                    name="designation"
                    placeholder="Designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  {/* Deal Value */}
                  <input
                    type="number"
                    name="dealValue"
                    placeholder="Deal Value"
                    value={formData.dealValue}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  {/* Lead Source */}
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="other">Lead Source</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="email">Email</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="trade_show">Trade Show</option>
                  </select>

                  {/* Assign To (Admin only) */}
                  {user.role === 'admin' && (
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Assign To *</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Description */}
                <textarea
                  name="description"
                  placeholder="Additional notes..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                />

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {selectedLead ? 'Update Lead' : 'Create Lead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leads Table */}
        {loading ? (
          <div className="text-center py-8">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No leads found</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Deal Value</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Assigned</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold">{lead.name}</td>
                    <td className="px-6 py-3">{lead.company}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{lead.email}</td>
                    <td className="px-6 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className={`px-3 py-1 rounded text-sm font-semibold border-0 ${statusColors[lead.status]}`}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3 font-semibold">₹{lead.dealValue.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm">{lead.assignedTo.name}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="text-primary hover:underline text-sm font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
```

## **Step 3.11: Create Pipeline Page**

**File: `frontend/src/pages/PipelinePage.jsx`**

```javascript
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function PipelinePage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const statuses = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const statusColors = {
    new: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', label: 'New' },
    qualified: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', label: 'Qualified' },
    proposal: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', label: 'Proposal' },
    negotiation: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', label: 'Negotiation' },
    won: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', label: 'Won' },
    lost: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', label: 'Lost' },
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/leads');
      setLeads(response.data.leads);
    } catch (error) {
      alert('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await axiosInstance.patch(`/leads/${leadId}/status`, { status: newStatus });
      fetchLeads();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const getLeadsByStatus = (status) => {
    return leads.filter((lead) => lead.status === status);
  };

  const getTotalValue = (status) => {
    return getLeadsByStatus(status).reduce((sum, lead) => sum + lead.dealValue, 0);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-full mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sales Pipeline</h1>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const statusLeads = getLeadsByStatus(status);
            const totalValue = getTotalValue(status);
            const colors = statusColors[status];

            return (
              <div
                key={status}
                className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4 min-h-96 flex-shrink-0 w-full md:flex-1`}
              >
                <div className="mb-4">
                  <h2 className={`font-bold text-lg ${colors.text}`}>
                    {colors.label}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {statusLeads.length} | ₹{(totalValue / 100000).toFixed(1)}L
                  </p>
                </div>

                <div className="space-y-3">
                  {statusLeads.map((lead) => (
                    <div
                      key={lead._id}
                      className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-primary hover:shadow-md"
                    >
                      <p className="font-semibold text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.company}</p>
                      <p className="text-xs text-primary font-bold mt-1">
                        ₹{lead.dealValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {lead.assignedTo.name}
                      </p>

                      {/* Status Change Buttons */}
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {status === 'new' && (
                          <button
                            onClick={() => handleStatusChange(lead._id, 'qualified')}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            → Next
                          </button>
                        )}
                        {status === 'qualified' && (
                          <button
                            onClick={() => handleStatusChange(lead._id, 'proposal')}
                            className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                          >
                            → Propose
                          </button>
                        )}
                        {status === 'proposal' && (
                          <button
                            onClick={() => handleStatusChange(lead._id, 'negotiation')}
                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                          >
                            → Negotiate
                          </button>
                        )}
                        {status === 'negotiation' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(lead._id, 'won')}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            >
                              Won
                            </button>
                            <button
                              onClick={() => handleStatusChange(lead._id, 'lost')}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              Lost
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {statusLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
```

## **Step 3.12: Create Dashboard Page**

**File: `frontend/src/pages/DashboardPage.jsx`**

```javascript
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axiosInstance from '../api/axiosInstance';
import Navbar from '../components/Navbar';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/metrics');
      setMetrics(response.data.metrics);
    } catch (error) {
      alert('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) return <div className="p-8">Loading dashboard...</div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sales Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Total Leads</p>
            <p className="text-4xl font-bold text-primary">{metrics.totalLeads}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Won Deals</p>
            <p className="text-4xl font-bold text-success">{metrics.wonDeals}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Total Deal Value</p>
            <p className="text-4xl font-bold text-primary">₹{(metrics.totalDealValue / 100000).toFixed(2)}L</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Conversion Rate</p>
            <p className="text-4xl font-bold text-warning">{metrics.conversionRate}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Leads by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.leadsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.leadsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, count }) => `${_id}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.leadsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
```

## **Step 3.13: Create Team Page**

**File: `frontend/src/pages/TeamPage.jsx`**

```javascript
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function TeamPage() {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role === 'admin') {
      fetchTeamData();
    }
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/team');
      setTeamData(response.data.teamData);
    } catch (error) {
      alert('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  if (user.role !== 'admin') {
    return (
      <>
        <Navbar />
        <div className="p-8 text-center">
          <p className="text-red-600 text-xl font-semibold">
            Only admins can view team metrics
          </p>
        </div>
      </>
    );
  }

  if (loading) return <div className="p-8">Loading team data...</div>;

  const totalLeads = teamData.reduce((sum, member) => sum + member.totalLeads, 0);
  const totalWon = teamData.reduce((sum, member) => sum + member.wonLeads, 0);
  const totalValue = teamData.reduce((sum, member) => sum + member.totalValue, 0);
  const avgConversion = teamData.length > 0
    ? (teamData.reduce((sum, m) => sum + parseFloat(m.conversionRate), 0) / teamData.length).toFixed(2)
    : 0;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Team Performance</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Team Members</p>
            <p className="text-4xl font-bold text-primary">{teamData.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Leads</p>
            <p className="text-4xl font-bold text-primary">{totalLeads}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Won</p>
            <p className="text-4xl font-bold text-success">{totalWon}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Avg Conversion</p>
            <p className="text-4xl font-bold text-warning">{avgConversion}%</p>
          </div>
        </div>

        {/* Team Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Member</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Leads</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Won</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Deal Value</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold">{member.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-6 py-3">{member.totalLeads}</td>
                  <td className="px-6 py-3 font-semibold text-success">{member.wonLeads}</td>
                  <td className="px-6 py-3">₹{(member.totalValue / 100000).toFixed(2)}L</td>
                  <td className="px-6 py-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {member.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
```

## **Step 3.14: Create Main App Component**

**File: `frontend/src/App.jsx`**

```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LeadsPage from './pages/LeadsPage';
import PipelinePage from './pages/PipelinePage';
import DashboardPage from './pages/DashboardPage';
import TeamPage from './pages/TeamPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <LeadsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pipeline"
          element={
            <ProtectedRoute>
              <PipelinePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamPage />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/leads" replace />} />
        
        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-gray-600 mb-6">Page not found</p>
                <a href="/leads" className="text-primary hover:underline">
                  Go back to leads
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
```

## **Step 3.15: Update Frontend Entry Point**

**File: `frontend/src/main.jsx`**

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## **Step 3.16: Add Tailwind CSS Styles**

**File: `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f9fafb;
}

html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

## **Step 3.17: Start Frontend Development Server**

```bash
# From frontend directory
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
# ➜  Press q to quit
```

✅ **Both servers running? Great! Now test the application.**

---

# **PART 4: TESTING & VALIDATION (1 Hour)**

## **Step 4.1: Test Complete User Flow**

```
1. Open http://localhost:5173 in browser
2. Click "Sign up here" → Create admin account
   - Name: Admin User
   - Email: admin@test.com
   - Password: Test123
   - Role: Admin
3. Should redirect to /leads page
4. Click "+ New Lead" button
5. Fill form:
   - Name: Tech Company Lead
   - Email: lead@techcorp.com
   - Phone: 9876543210
   - Company: TechCorp
   - Deal Value: 500000
   - Assign To: Self
6. Click "Create Lead"
7. Lead should appear in table
8. Change status to "qualified" using dropdown
9. Click on pipeline page → should see lead in "qualified" column
10. Go to dashboard → should see metrics updated
11. Logout and create sales_rep account
12. Login as sales rep → should only see leads assigned to them
13. Go to /team → should see "Only admins can view team metrics"
```

## **Step 4.2: Test All Endpoints with cURL**

```bash
# Save this as test.sh
#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "1. Testing Health Check..."
curl -s $BASE_URL/health | jq

echo -e "\n2. Testing Signup..."
SIGNUP=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "testadmin@test.com",
    "password": "Test123",
    "role": "admin"
  }')

echo $SIGNUP | jq

# Extract token
TOKEN=$(echo $SIGNUP | jq -r '.token')
echo -e "\n✅ Token: $TOKEN"

echo -e "\n3. Testing Get Current User..."
curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n4. Testing Create Lead..."
curl -s -X POST $BASE_URL/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "9876543210",
    "company": "Example Corp",
    "dealValue": 100000,
    "assignedTo": "'$(echo $SIGNUP | jq -r '.user.id')'"
  }' | jq

echo -e "\n5. Testing Get Leads..."
curl -s -X GET $BASE_URL/leads \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n6. Testing Dashboard Metrics..."
curl -s -X GET $BASE_URL/dashboard/metrics \
  -H "Authorization: Bearer $TOKEN" | jq
```

Run tests:
```bash
chmod +x test.sh
./test.sh
```

---

# **PART 5: GIT & DOCUMENTATION (30 mins)**

## **Step 5.1: Create .gitignore Files**

Already done above, but verify:

```bash
# Backend .gitignore
cd backend && cat .gitignore

# Frontend .gitignore
cd ../frontend && cat .gitignore

# Root .gitignore
cd .. && cat .gitignore
```

## **Step 5.2: Initialize Git and Make First Commit**

```bash
# From isaii-crm root directory
git config user.name "Jagan Parab"
git config user.email "jagan@example.com"

# First commit
git add .
git commit -m "Initial: Project structure with package.json files"

# Backend setup
git add backend/config backend/models backend/middleware backend/routes backend/server.js backend/.env
git commit -m "Backend: Complete API implementation with auth, leads, and dashboard routes"

# Frontend setup
git add frontend/src frontend/.env frontend/tailwind.config.js
git commit -m "Frontend: Complete React app with pages and components"

# Documentation
git add README.md
git commit -m "Docs: Add comprehensive README with setup instructions"

# View commit history
git log --oneline
```

## **Step 5.3: Create Comprehensive README**

**File: `README.md` (in root isaii-crm directory)**

```markdown
# BDA CRM - Sales Lead Management System

A professional MERN stack application for managing sales leads, pipeline tracking, and team performance metrics. Built for manufacturing company Business Development Associates (BDA).

## ✨ Features

- **User Authentication**: Secure signup/login with JWT tokens
- **Role-Based Access**: Admin and Sales Representative roles
- **Lead Management**: Complete CRUD operations for sales leads
- **Pipeline View**: Kanban-style lead status visualization
- **Sales Dashboard**: Real-time metrics and analytics
- **Team Performance**: Admin-only team metrics and conversion tracking
- **Responsive Design**: Works on desktop and mobile devices

## 📊 Project Structure

```
isaii-crm/
├── backend/
│   ├── config/        # Database configuration
│   ├── models/        # MongoDB schemas (User, Lead)
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth and error handling
│   ├── server.js      # Express server
│   ├── .env           # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components # Reusable components
│   │   ├── api/       # Axios configuration
│   │   ├── App.jsx    # Main app component
│   │   └── main.jsx   # Entry point
│   ├── .env
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT + bcryptjs
- **Charts**: Recharts for data visualization

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or higher
- MongoDB running locally or Docker installed
- npm or yarn package manager

### Installation

#### 1. Start MongoDB

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or if MongoDB is installed locally
mongod
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/isaii-crm-db
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
EOF

# Start backend server
npm run dev

# Server will run on http://localhost:5000
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start frontend server
npm run dev

# Frontend will run on http://localhost:5173
```

## 🔐 Default Test Accounts

After signing up:

```
Admin Account:
Email: admin@test.com
Password: Test123

Sales Rep Account:
Email: rep@test.com
Password: Test123
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - Get all leads (filtered by role)
- `GET /api/leads/:id` - Get single lead
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead (admin only)
- `PATCH /api/leads/:id/status` - Update lead status
- `POST /api/leads/:id/notes` - Add note to lead

### Dashboard
- `GET /api/dashboard/metrics` - Get personal/team metrics
- `GET /api/dashboard/team` - Get team overview (admin only)

## 🎯 Features & Workflows

### For Sales Representatives
1. View assigned leads in table format
2. Create and manage own leads
3. Update lead status through pipeline
4. View personal metrics and conversion rates
5. Add notes to leads for follow-ups

### For Administrators
1. View all leads in the system
2. Manage team member assignments
3. View comprehensive team performance metrics
4. Track conversion rates across the team
5. Access all lead management features

## 📈 Dashboard Metrics

The dashboard displays:
- **Total Leads**: Count of all leads
- **Won Deals**: Number of successfully closed deals
- **Total Deal Value**: Sum of all deal values
- **Conversion Rate**: Percentage of won deals
- **Leads by Status**: Bar chart visualization
- **Status Distribution**: Pie chart breakdown

## 🔄 Lead Status Pipeline

```
New → Qualified → Proposal → Negotiation → Won/Lost
```

Each status has corresponding action buttons for quick status updates.

## 🚢 Deployment

### Deploy Backend (Railway)

1. Push code to GitHub
2. Create account on railway.app
3. Create new project and connect GitHub repo
4. Select `backend` folder
5. Add environment variables:
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: JWT secret key
6. Deploy and get backend URL

### Deploy Frontend (Vercel)

1. Create account on vercel.com
2. Import your GitHub repository
3. Select `frontend` folder
4. Add environment variable:
   - `VITE_API_URL`: Your deployed backend URL
5. Deploy and get frontend URL

## 🧪 Testing

### Manual Testing Flow

1. Sign up with email and password
2. Create 2-3 test leads
3. Update lead statuses
4. Check pipeline view
5. Verify dashboard metrics
6. Test team view (as admin)
7. Logout and login as different user

### API Testing with cURL

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123",
    "role": "admin"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123"
  }'

# Get leads (replace TOKEN)
curl -X GET http://localhost:5000/api/leads \
  -H "Authorization: Bearer TOKEN_HERE"
```

## 📝 Code Standards

- **Folder Structure**: Organized by feature (models, routes, pages)
- **Component Names**: PascalCase for React components
- **File Names**: camelCase for utilities, PascalCase for components
- **Error Handling**: Try-catch blocks on all async operations
- **Validation**: Server-side validation on all API endpoints

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Restart MongoDB
docker restart mongodb

# Check connection
mongosh --eval "db.adminCommand('ping')"
```

### CORS Errors
- Verify `VITE_API_URL` in frontend `.env`
- Check backend `CORS` configuration
- Ensure backend is running on correct port

### Authentication Issues
- Clear browser localStorage: `localStorage.clear()`
- Verify token is being sent in headers
- Check JWT_SECRET matches between backend and frontend

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

## 📋 Project Requirements Met

- ✅ MERN Stack implementation
- ✅ Build from scratch (no plagiarism)
- ✅ Clean code architecture and folder structure
- ✅ Reusable React components
- ✅ Optimized performance
- ✅ Git best practices with meaningful commits
- ✅ Detailed README with setup instructions
- ✅ Environment variable configuration
- ✅ Local development setup
- ✅ Production-ready deployment

## 👨‍💻 Author

Jagan Parab  
B.E. Computer Engineering  
Agnel Institute of Technology, Goa

## 📄 License

MIT License

---

**Built for ISAII AI Technical Assessment Round | May 2026**
```

---

# **PART 6: DEPLOYMENT (1 Hour)**

## **Step 6.1: Push to GitHub**

```bash
# From root directory
# Create GitHub repository first (github.com/new)

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/isaii-crm.git
git branch -M main
git push -u origin main

# Verify
git remote -v
```

## **Step 6.2: Deploy Backend to Railway**

1. Go to **railway.app**
2. Click **"Create New Project"**
3. Select **"Deploy from GitHub"**
4. Connect your GitHub account and select `isaii-crm` repo
5. Select **backend** folder
6. Click **"Deploy Now"**
7. Once running, add environment variables:
   - Go to **Variables** tab
   - Add `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/isaii-crm-db`
   - Add `JWT_SECRET=your-production-secret-key`
8. Copy the **Backend URL** (looks like `https://isaii-crm-backend-prod.railway.app`)

## **Step 6.3: Deploy Frontend to Vercel**

1. Go to **vercel.com**
2. Click **"Import Project"**
3. Select your `isaii-crm` GitHub repo
4. Select **frontend** folder
5. Add environment variable:
   - `VITE_API_URL=https://your-railway-backend/api`
6. Click **"Deploy"**
7. Once deployed, copy the **Frontend URL**

## **Step 6.4: Test Live Deployment**

```bash
# Test frontend URL from browser
https://your-frontend.vercel.app

# Should see login page
# Click signup and create account
# Create lead and verify it works
```

---

# **PART 7: FINAL SUBMISSION**

## **Step 7.1: Pre-Submission Checklist**

```
Code Quality:
  ☐ No console.errors in browser developer tools
  ☐ No errors in backend terminal
  ☐ All pages load correctly
  ☐ Forms validate inputs
  ☐ API responses display correctly

Functionality:
  ☐ Signup/Login works
  ☐ Can create, edit, delete leads
  ☐ Status changes work
  ☐ Pipeline view displays leads by status
  ☐ Dashboard shows metrics
  ☐ Admin can see team metrics
  ☐ Sales rep only sees own leads

Database:
  ☐ MongoDB running
  ☐ Data persists after refresh
  ☐ Users can only see appropriate data

Git:
  ☐ 5+ meaningful commits
  ☐ .env files excluded via .gitignore
  ☐ node_modules excluded
  ☐ README.md complete and detailed

Deployment:
  ☐ Backend deployed and responding
  ☐ Frontend deployed and working
  ☐ Both live URLs tested
  ☐ Environment variables configured
  ☐ Can create lead and see in dashboard on live site

Documentation:
  ☐ README explains setup
  ☐ README lists all features
  ☐ README includes test account credentials
  ☐ API endpoints documented
```

## **Step 7.2: Submission Form Details**

**Form URL:** `https://forms.gle/ELUcDCyvvDj3DTrb9`

**Fill These Fields:**

1. **GitHub Repository URL:**
   ```
   https://github.com/YOUR_USERNAME/isaii-crm
   ```

2. **Frontend Live URL:**
   ```
   https://your-frontend.vercel.app
   ```

3. **Backend Live URL:**
   ```
   https://your-backend.railway.app
   ```

4. **Brief Description:**
   ```
   Professional MERN stack BDA CRM application with:
   - Complete lead management (CRUD operations)
   - Role-based access control (Admin & Sales Rep)
   - Real-time pipeline tracking with Kanban view
   - Sales dashboard with metrics and charts
   - Team performance analytics
   - Responsive design with TailwindCSS
   - Secure JWT authentication
   - MongoDB database
   ```

5. **Additional Comments (Optional):**
   ```
   Built using modern web technologies with focus on:
   - Clean architecture and code organization
   - Proper error handling and validation
   - User experience and responsive design
   - Database optimization with indexes
   - RESTful API design principles
   ```

## **Step 7.3: Final Checklist**

```bash
# Before clicking submit:

# 1. Test live URLs work from incognito/private window
# 2. Create account on live site
# 3. Create a test lead
# 4. Change status
# 5. View dashboard
# 6. Logout and login
# 7. All features work ✅

# 8. Git history is clean
git log --oneline | head -10

# 9. No sensitive data in repo
git grep -i "password" -- '*.js' '*.jsx' | wc -l  # Should be 0

# 10. README is comprehensive
cat README.md | wc -l  # Should be 200+
```

---

# **🎉 YOU'RE DONE!**

**Summary of What You Built:**

- ✅ **Backend API** with Express, MongoDB, JWT auth
- ✅ **Frontend UI** with React, TailwindCSS, Recharts
- ✅ **Complete CRUD** for lead management
- ✅ **Role-based access** control
- ✅ **Pipeline visualization** with Kanban view
- ✅ **Dashboard analytics** with metrics and charts
- ✅ **Team performance** tracking
- ✅ **Production deployment** on Railway + Vercel
- ✅ **Clean code** with proper folder structure
- ✅ **Git best practices** with meaningful commits
- ✅ **Comprehensive documentation** in README

**Total Build Time:** ~5-6 hours actual coding  
**Buffer Time:** 18+ hours remaining  
**Submission Deadline:** Sunday 11:59 PM

**Go submit! 🚀**

---

**Questions? Re-read the specific section in this guide.**  
**This guide covers EVERYTHING you need.**
