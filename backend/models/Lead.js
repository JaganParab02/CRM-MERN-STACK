const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
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
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    },
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
    status: {
      type: String,
      enum: {
        values: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
        message: 'Invalid status',
      },
      default: 'new',
      index: true,
    },
    dealValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    probabilityScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      enum: {
        values: ['cold_call', 'email', 'referral', 'website', 'trade_show', 'other'],
        message: 'Invalid lead source',
      },
      default: 'other',
    },
    description: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Invalid priority level',
      },
      default: 'medium',
    },
    tags: [{ type: String }],
    notes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    timeline: [
      {
        action: String,
        description: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lead must be assigned to a sales representative'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    activities: [
      {
        action: {
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

leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ createdBy: 1 });
leadSchema.index({ email: 1 });

module.exports = mongoose.model('Lead', leadSchema);
