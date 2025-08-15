// backend/adminRoutes.js
import express from 'express';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
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

// GET team history by ID
// router.get('/team-history/:id', async (req, res) => {
//   const teamId = req.params.id;
//   try {
//     const team = await User.findByPk(teamId, {
//       include: [
//         {
//           model: Mentor,
//           as: 'mentor',
//           attributes: ['name', 'email', 'department']
//         },
//         {
//           model: Student,
//           attributes: ['student_name', 'register_no', 'dept', 'is_leader', 'section', 'mobile']
//         },
//         {
//           model: TeamUpload,
//           attributes: ['week_number', 'file_url', 'createdAt', 'status', 'review_comment']
//         }
//       ]
//     });
//     if (!team) return res.status(404).json({ error: 'Team not found' });
//     res.json(team);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// Get all teams' history
router.get('/team-history', async (req, res) => {
  try {
    const teams = await User.findAll({
      include: [
        {
          model: Mentor,
          as: 'mentor',
          attributes: ['name', 'email', 'department']
        },
        {
          model: Student,
          attributes: ['student_name', 'register_no', 'dept', 'is_leader', 'section', 'mobile']
        },
        {
          model: TeamUpload,
          attributes: ['week_number', 'file_url', 'uploaded_at', 'createdAt', 'status', 'review_comment']
        }
      ],
      order: [
        ['UserId', 'ASC'], // Optional: Order by team id
        [TeamUpload, 'week_number', 'ASC'] // Optional: Order uploads by week
      ]
    });

    // Calculate counts
    let uploadedCount = 0;
    let notUploadedCount = 0;

    teams.forEach(team => {
      if (team.TeamUploads && team.TeamUploads.length > 0) {
        uploadedCount++;
      } else {
        notUploadedCount++;
      }
    });

    res.json({
      uploadedCount,
      notUploadedCount,
      teams
    });
  } catch (err) {
    console.error(err);
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

// ✅ DELETE a student from a team
router.delete('/delete-student/:teamId/:registerNo', async (req, res) => {
  const { teamId, registerNo } = req.params;
  try {
    const student = await Student.findOne({
      where: {
        user_id: teamId,
        register_no: registerNo
      }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    await student.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT update student
router.put('/edit-student', async (req, res) => {
  const { teamId, registerNo, student_name, section, dept } = req.body;
  try {
    const student = await Student.findOne({
      where: {
        user_id: teamId,
        register_no: registerNo
      }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.student_name = student_name;
    student.section = section;
    student.dept = dept;

    await student.save();

    res.json({ success: true, updatedStudent: student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
