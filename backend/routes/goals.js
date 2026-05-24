const express = require('express');
const Goal = require('../models/Goal');
const Lead = require('../models/Lead');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Fetch all goals and recalculate progress from live deal data
router.get('/', async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { 
      $or: [ { assignedTo: req.user.id }, { assignedTo: null } ] 
    };
    
    let goals = await Goal.find(query).populate('assignedTo', 'name email').sort({ deadline: 1 });
    
    // Recalculate progress for active goals against actual closed deals
    for (let goal of goals) {
      if (goal.status === 'active') {
        let matchQuery = { status: 'won' };
        if (goal.assignedTo) {
          matchQuery.assignedTo = goal.assignedTo._id;
        }
        
        // TODO: add startDate filter for more accurate period-scoped tracking
        const leads = await Lead.find(matchQuery);
        
        if (goal.type === 'revenue') {
          goal.currentValue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
        } else {
          goal.currentValue = leads.length;
        }

        // Check if goal should be auto-completed or marked as expired
        if (goal.currentValue >= goal.targetValue) {
          goal.status = 'completed';
        } else if (new Date() > goal.deadline) {
          goal.status = 'failed';
        }
        await goal.save();
      }
    }

    res.json({ success: true, count: goals.length, goals });
  } catch (error) {
    next(error);
  }
});

// Create a new goal (admin only)
router.post('/', authorizeRole(['admin']), async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Treat empty assignedTo as a team-wide goal
    if (!req.body.assignedTo || req.body.assignedTo.trim() === '') {
      req.body.assignedTo = null;
    }
    
    const goal = await Goal.create(req.body);
    const populatedGoal = await Goal.findById(goal._id).populate('assignedTo', 'name');
      
    res.status(201).json({ success: true, goal: populatedGoal });
  } catch (error) {
    next(error);
  }
});

// Remove a goal (admin only)
router.delete('/:id', authorizeRole(['admin']), async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
