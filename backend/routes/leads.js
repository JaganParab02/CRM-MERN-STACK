const express = require('express');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, assignedTo, search } = req.query;
    let query = {};

    if (req.user.role === 'sales_rep') {
      query.assignedTo = req.user.id;
    } else if (assignedTo && req.user.role === 'admin') {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

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

    if (!name || !email || !phone || !company || !assignedTo) {
      return res.status(400).json({
        success: false,
        error:
          'Name, email, phone, company, and assignedTo are required fields',
      });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        error: 'Assigned user does not exist',
      });
    }

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

router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    if (
      req.user.role === 'sales_rep' &&
      lead.assignedTo.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lead',
      });
    }

    const {
      name,
      email,
      phone,
      company,
      designation,
      status,
      dealValue,
      source,
      priority,
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
    if (priority) lead.priority = priority;
    if (assignedTo && req.user.role === 'admin') lead.assignedTo = assignedTo;
    if (nextFollowUp) lead.nextFollowUp = nextFollowUp;
    if (expectedClosureDate) lead.expectedClosureDate = expectedClosureDate;
    if (description) lead.description = description;

    lead.updatedAt = Date.now();
    await lead.save();

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

// removed duplicate route

router.post('/:id/notes', authenticateToken, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (req.user.role !== 'admin' && lead.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    lead.notes.push({ text, createdBy: req.user.id });
    
    // Log the note as a timeline event too
    lead.timeline.push({
      action: 'Note Added',
      description: text,
      createdBy: req.user.id
    });

    await lead.save();
    
    const updatedLead = await Lead.findById(req.params.id)
      .populate('notes.createdBy', 'name')
      .populate('timeline.createdBy', 'name');

    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
