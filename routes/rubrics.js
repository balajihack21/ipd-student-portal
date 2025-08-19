// routes/admin.js
import express from 'express';
import Admin from '../models/Admin.js';

const router = express.Router();

// Get deadlines
router.get('/review1-deadline', async (req, res) => {
  try {
    const admin = await Admin.findOne(); // assuming single admin row
    res.json({
      start: admin?.review1_start,
      deadline: admin?.review1_deadline
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review deadlines' });
  }
});

// Update deadlines
router.post('/review1-deadline', async (req, res) => {
  try {
    const { start, deadline } = req.body;
    if (!start || !deadline) {
      return res.status(400).json({ error: 'Start and deadline required' });
    }

    let admin = await Admin.findOne();
    if (!admin) admin = await Admin.create({ email: "default@admin.com", password: "hashed" });

    admin.review1_start = start;
    admin.review1_deadline = deadline;
    await admin.save();

    res.json({ success: true, start: admin.review1_start, deadline: admin.review1_deadline });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update deadlines' });
  }
});

export default router;
