const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const tasksRoutes = require('./routes/tasks');
const goalsRoutes = require('./routes/goals');
const aiRoutes = require('./routes/ai');
const User = require('./models/User');

connectDB();

// Seed default accounts on first run
const createDefaultUsers = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@admin.com' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@admin.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Default admin created (admin@admin.com / admin123)');
    }

    const salesExists = await User.findOne({ email: 'sales@admin.com' });
    if (!salesExists) {
      await User.create({
        name: 'Sales Rep',
        email: 'sales@admin.com',
        password: 'sales123',
        role: 'sales_rep',
      });
      console.log('Default sales rep created (sales@admin.com / sales123)');
    }
  } catch (error) {
    console.error('Failed to create default users:', error.message);
  }
};
createDefaultUsers();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Backend Server Started`);
  console.log(`${'='.repeat(50)}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log(`${'='.repeat(50)}\n`);
});
