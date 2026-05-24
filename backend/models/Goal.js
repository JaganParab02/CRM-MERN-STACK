const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a goal title'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['revenue', 'deals_won'],
      default: 'revenue',
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // If null, it's a team-wide goal
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
