const express = require('express');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/metrics', authenticateToken, async (req, res, next) => {
  try {
    let userFilter = {};

    if (req.user.role === 'sales_rep') {
      userFilter = { assignedTo: new mongoose.Types.ObjectId(req.user.id) };
    } else if (req.user.role === 'admin' && req.query.userId) {
      userFilter = { assignedTo: new mongoose.Types.ObjectId(req.query.userId) };
    }

    const totalLeads = await Lead.countDocuments(userFilter);

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

    const wonDeals = await Lead.countDocuments({
      ...userFilter,
      status: 'won',
    });

    const dealValueAgg = await Lead.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$dealValue' },
        },
      },
    ]);

    let wonDealValue = 0;
    let lostDealValue = 0;
    let inProgressDealValue = 0;

    dealValueAgg.forEach(group => {
      if (group._id === 'won') {
        wonDealValue += group.total;
      } else if (group._id === 'lost') {
        lostDealValue += group.total;
      } else {
        inProgressDealValue += group.total;
      }
    });

    const conversionRate =
      totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(2) : 0;

    const recentLeads = await Lead.find(userFilter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Build 6-month revenue timeline
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of the month
    sixMonthsAgo.setHours(0,0,0,0);
    
    const revenuePipeline = await Lead.aggregate([
      { $match: { ...userFilter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          revenue: { $sum: "$dealValue" }
        }
      }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed
      
      const found = revenuePipeline.find(item => item._id.year === year && item._id.month === month);
      revenueData.push({
        name: monthNames[month - 1],
        revenue: found ? found.revenue : 0
      });
    }

    // Collect recent timeline events across all leads
    const recentActivitiesPipeline = await Lead.aggregate([
      { $match: userFilter },
      { $unwind: "$timeline" },
      { $sort: { "timeline.createdAt": -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "timeline.createdBy",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          _id: "$timeline._id",
          user: { $arrayElemAt: ["$user.name", 0] },
          action: "$timeline.action",
          description: "$timeline.description",
          time: "$timeline.createdAt",
          leadCompany: "$company"
        }
      }
    ]);

    const recentActivities = recentActivitiesPipeline.map((act, index) => ({
      id: act._id || index,
      user: act.user || 'System',
      action: `${act.action} on ${act.leadCompany}`,
      time: act.time,
      type: act.action.toLowerCase().includes('note') ? 'note' : 'status'
    }));

    res.json({
      success: true,
      metrics: {
        totalLeads,
        wonDeals,
        wonDealValue,
        inProgressDealValue,
        lostDealValue,
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
        revenueData,
        recentActivities
      },
      recentLeads,
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/team',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res, next) => {
    try {
      const teamMembers = await User.find({ role: 'sales_rep', isActive: true });
      const allLeads = await Lead.find({});

      const teamData = await Promise.all(
        teamMembers.map(async (u) => {
          const userLeads = allLeads.filter(
            (l) => l.assignedTo && l.assignedTo.toString() === u._id.toString()
          );
          const wonUserLeads = userLeads.filter((l) => l.status === 'won');
          
          const totalLeads = userLeads.length;
          const wonLeads = wonUserLeads.length;
          const totalValue = userLeads.reduce(
            (sum, lead) => sum + (lead.dealValue || 0),
            0
          );
          
          const conversionRate =
            totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

          // Fetch active tasks for this user
          const activeTasks = await Task.countDocuments({ 
            assignedTo: u._id, 
            status: { $in: ['todo', 'in_progress'] } 
          });

          // Calculate total active leads for workload
          const activeLeads = userLeads.filter((l) => l.status !== 'won' && l.status !== 'lost').length;

          return {
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            totalLeads,
            wonLeads,
            totalValue,
            conversionRate,
            activeTasks,
            activeLeads,
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
