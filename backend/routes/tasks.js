const express = require('express');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Fetch tasks (admins see all, reps see only their own)
router.get('/', async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('relatedLead', 'name company')
      .sort({ dueDate: 1, createdAt: -1 });
      
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
});

// Create a new task
router.post('/', async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    // Non-admins can only create tasks for themselves
    if (req.user.role !== 'admin') {
      req.body.assignedTo = req.user.id;
    } else if (!req.body.assignedTo || req.body.assignedTo.trim() === '') {
      // Default to self-assignment when admin skips the field
      req.body.assignedTo = req.user.id;
    }
    
    const task = await Task.create(req.body);
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name')
      .populate('relatedLead', 'name company');
      
    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    next(error);
  }
});

// Update a task
router.put('/:id', async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this task' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name').populate('relatedLead', 'name company');

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

// Delete a task
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
