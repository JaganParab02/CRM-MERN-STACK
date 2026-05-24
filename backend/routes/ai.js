const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const OpenAI = require('openai');
const Lead = require('../models/Lead');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

router.get('/lead-summary/:id', authenticateToken, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('notes.createdBy', 'name')
      .populate('timeline.createdBy', 'name')
      .populate('assignedTo', 'name');

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (req.user.role === 'sales_rep' && lead.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this lead' });
    }

    // Build context
    let context = `Lead Name: ${lead.name}\nCompany: ${lead.company}\nStatus: ${lead.status}\nPriority: ${lead.priority}\nDeal Value: ${lead.dealValue}\nDescription: ${lead.description || 'None'}\n\n`;
    
    context += `--- NOTES ---\n`;
    if (lead.notes && lead.notes.length > 0) {
      lead.notes.forEach(note => {
        context += `- ${note.createdBy?.name || 'User'}: ${note.text} (${new Date(note.createdAt).toLocaleDateString()})\n`;
      });
    } else {
      context += `No notes available.\n`;
    }

    context += `\n--- RECENT TIMELINE ---\n`;
    if (lead.timeline && lead.timeline.length > 0) {
      const recent = lead.timeline.slice(-5); // last 5 events
      recent.forEach(event => {
        context += `- ${event.action}: ${event.description} (${new Date(event.createdAt).toLocaleDateString()})\n`;
      });
    } else {
      context += `No timeline events.\n`;
    }

    const prompt = `You are an expert AI Sales Assistant. Analyze the following lead profile and history, and provide a concise, actionable "Sales Strategy & Summary" (max 200 words).
Identify key opportunities, assess the lead's temperature based on recent interactions, and recommend the immediate next best action for the sales rep.
Use professional markdown formatting with bolding and bullet points.

LEAD DATA:
${context}
`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 300,
    });

    res.json({
      success: true,
      summary: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("AI Error:", error);
    next(error);
  }
});

// Shared helper to assemble lead context for prompts
const buildLeadContext = (lead) => {
  let context = `Lead Name: ${lead.name}\nCompany: ${lead.company}\nStatus: ${lead.status}\nPriority: ${lead.priority}\nDeal Value: ${lead.dealValue}\nDescription: ${lead.description || 'None'}\n\n`;
  context += `--- NOTES ---\n`;
  if (lead.notes && lead.notes.length > 0) {
    lead.notes.forEach(note => {
      context += `- ${note.createdBy?.name || 'User'}: ${note.text} (${new Date(note.createdAt).toLocaleDateString()})\n`;
    });
  } else {
    context += `No notes available.\n`;
  }
  context += `\n--- RECENT TIMELINE ---\n`;
  if (lead.timeline && lead.timeline.length > 0) {
    const recent = lead.timeline.slice(-10);
    recent.forEach(event => {
      context += `- ${event.action}: ${event.description} (${new Date(event.createdAt).toLocaleDateString()})\n`;
    });
  } else {
    context += `No timeline events.\n`;
  }
  return context;
};

// Draft a follow-up email based on lead history
router.post('/draft-email/:id', authenticateToken, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('notes.createdBy', 'name')
      .populate('timeline.createdBy', 'name');
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const context = buildLeadContext(lead);
    const prompt = `You are an expert Sales Representative. Based on the following lead profile and history, draft a highly professional, persuasive, and personalized follow-up email. Do not include subject lines, just the body of the email. Keep it concise.\n\nLEAD DATA:\n${context}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 400,
    });

    res.json({ success: true, emailDraft: completion.choices[0].message.content });
  } catch (error) {
    next(error);
  }
});

// Calculate a probability-to-close score for a lead
router.post('/score-lead/:id', authenticateToken, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('notes.createdBy', 'name')
      .populate('timeline.createdBy', 'name');
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const context = buildLeadContext(lead);
    const prompt = `You are a predictive AI for sales. Evaluate the following lead and calculate a "Probability to Close" score between 0 and 100.
Consider factors like velocity (how recent the timeline events are), deal value, priority, and positive/negative signals in the notes.
Respond ONLY with a valid JSON object containing a single key "score" with a number value. Example: {"score": 85}\n\nLEAD DATA:\n${context}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    const score = result.score || 0;

    lead.probabilityScore = score;
    await lead.save();

    res.json({ success: true, score });
  } catch (error) {
    next(error);
  }
});

// Sort pending tasks by urgency using the LLM
router.post('/sort-tasks', authenticateToken, async (req, res, next) => {
  try {
    const { taskIds } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, error: 'taskIds array is required' });
    }

    const Task = require('../models/Task');
    const tasks = await Task.find({ _id: { $in: taskIds } });

    const taskContext = tasks.map(t => `ID: ${t._id} | Title: ${t.title} | Priority: ${t.priority} | Due: ${t.dueDate || 'None'}`).join('\n');
    
    const prompt = `You are an AI Productivity Assistant. Sort the following tasks from most important/urgent to least important. 
Consider the Priority field and Due dates. Urgent priorities and earlier due dates should be first.
Respond ONLY with a valid JSON object containing an array of task IDs in the optimally sorted order. 
Example format: {"sortedIds": ["id1", "id2", "id3"]}\n\nTASKS:\n${taskContext}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Map IDs back to task objects
    const taskMap = {};
    tasks.forEach(t => taskMap[t._id.toString()] = t);

    const sortedTasks = result.sortedIds
      .map(id => taskMap[id])
      .filter(t => t !== undefined);

    res.json({ success: true, sortedTasks });
  } catch (error) {
    next(error);
  }
});

// Convert a natural language query into a MongoDB filter
router.post('/search', authenticateToken, async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query is required' });

    const prompt = `You are an AI that converts English sentences into MongoDB query filters for a "Lead" collection.
The schema fields available are:
- status (enum: 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')
- priority (enum: 'low', 'medium', 'high')
- dealValue (number)
- company (string)
- name (string)

Convert this natural language query into a valid MongoDB JSON query filter object.
For example, for "show me high priority leads over 50000 in negotiation", return: {"priority": "high", "dealValue": {"$gt": 50000}, "status": "negotiation"}
Respond ONLY with the JSON object, nothing else.

Query: "${query}"`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const filter = JSON.parse(completion.choices[0].message.content);
    
    // Scope results for non-admin users
    if (req.user.role === 'sales_rep') {
      filter.assignedTo = req.user.id;
    }

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name')
      .sort({ dealValue: -1 })
      .limit(20);

    res.json({ success: true, leads });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
