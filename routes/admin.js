// backend/adminRoutes.js
import express from 'express';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js'
import TeamUpload from '../models/TeamUpload.js';

const router = express.Router();

// GET all teams with mentor


router.get("/teams", async (req, res) => {
  try {
    const teams = await User.findAll({
      include: [
        { model: Mentor, as: 'mentor' },
        { model: Student }
      ]
    });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});


// GET all assigned teams
router.get('/assigned-teams', async (req, res) => {
    try {
        const teams = await User.findAll();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all mentors
router.get('/mentors', async (req, res) => {
    try {
        const mentors = await Mentor.findAll();
        res.json(mentors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT assign mentor
router.put('/assign-mentor', async (req, res) => {
    const { team_id, mentor_id } = req.body;
    try {
        await User.update({ MentorId: mentor_id }, { where: { UserId: team_id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//get all team-history



// GET team history by ID
router.get('/team-history/:id', async (req, res) => {
    const teamId = req.params.id;
    try {
        const team = await User.findByPk(teamId, {
            include: [
                {
                    model: Mentor,
                    as: 'mentor', // ✅ required
                    attributes: ['name', 'email','department']
                },
                {
                    model: Student,
                    attributes: ['student_name', 'register_no','dept' , "is_leader","section"]
                },
                {
                    model: TeamUpload,
                    attributes: ['week_number', 'file_url', 'createdAt','status','review_comment']
                }
            ]
        });
        if (!team) return res.status(404).json({ error: 'Team not found' });
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a team
router.delete('/delete-team/:id', async (req, res) => {
    const teamId = req.params.id;
    try {
        await User.destroy({ where: { UserId: teamId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
