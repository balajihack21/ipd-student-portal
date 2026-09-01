import express from 'express';
import authenticate from '../middleware/authenticate.js';
import BatchTimeline from '../models/BatchTimeline.js';

const router = express.Router();

// GET a stage's deadline for a specific batch
router.get('/deadline/:stage', authenticate, async (req, res) => {
  try {
    const { stage } = req.params;
    const { batch } = req.query; // ?batch=25IPD
    if (!batch) return res.json({ start: null, deadline: null });

    const row = await BatchTimeline.findOne({ where: { batch, stage } });
    res.json({ start: row?.start || null, deadline: row?.deadline || null });
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// SAVE a stage's deadline for a specific batch
router.post('/deadline/:stage', authenticate, async (req, res) => {
  try {
    const { stage } = req.params;
    const { start, deadline, batch } = req.body;
    if (!batch) return res.status(400).json({ error: 'batch is required' });

    const [row] = await BatchTimeline.findOrCreate({
      where: { batch, stage },
      defaults: { start, deadline }
    });
    row.start = start;
    row.deadline = deadline;
    await row.save();

    res.json({ message: `${stage} timeline saved for batch ${batch}` });
  } catch (err) {
    console.error('Error saving timeline:', err);
    res.status(500).json({ error: 'Failed to save timeline' });
  }
});

export default router;