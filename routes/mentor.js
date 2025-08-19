import express from 'express';
import { Op } from 'sequelize';
import authenticate  from '../middleware/authenticate.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js'
import Student from '../models/Student.js'
import TeamUpload from '../models/TeamUpload.js';
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';

const router = express.Router();

/**
 * GET Assigned Teams + their uploads
 */
router.get('/teams', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // comes from JWT

    // Find mentor details (to get department)
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Fetch all teams whose leader belongs to same department as mentor
    const teams = await User.findAll({
      attributes: ['UserId', 'team_name', 'email', 'mobile'],
      include: [
        {
          model: Student,
          attributes: ['student_name', 'dept', 'section', 'register_no', 'mobile'],
          where: {
            is_leader: true,
            dept: mentor.department   // ✅ filter by leader’s dept
          }
        }
      ]
    });

    res.json(teams);
  } catch (err) {
    console.error('Error fetching department teams:', err);
    res.status(500).json({ error: 'Server error fetching teams' });
  }
});


router.post("/teams/:teamId/rubrics", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // from token (must map properly in auth)
    const { teamId } = req.params;
    const { scores } = req.body; // { rubric1: x, rubric2: y, ... }

    if (!scores || typeof scores !== "object") {
      return res.status(400).json({ error: "Scores are required" });
    }

    // Check mentor role
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can submit rubrics" });
    }

    // Find the team leader user (team row)
    const team = await User.findByPk(teamId);
    console.log(team)
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Extract only rubric fields
const rubricFields = {};
for (let i = 1; i <= 10; i++) {
  if (scores[`rubric${i}`] !== undefined) {
    rubricFields[`rubric${i}`] = scores[`rubric${i}`];
  }
}

// Update in DB
await User.update(rubricFields, {
  where: { UserId: teamId }
});



    res.json({ message: "Rubrics submitted successfully", team });
  } catch (err) {
    console.error("Error submitting rubrics:", err);
    res.status(500).json({ error: "Failed to submit rubrics" });
  }
});


router.get('/my-teams', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // from JWT/session
  console.log(req.user)
    // Find all students assigned to this mentor
    const teams = await User.findAll({
      where: { mentor_id: mentorId},
      attributes: ['UserId', 'team_name', 'email', 'mobile'],
      include: [
        {
          model: TeamUpload,
          attributes: ['id', 'file_url', 'week_number', 'uploaded_at', 'status', 'review_comment'],
          order: [['uploaded_at', 'DESC']]
        }
      ]
    });

    res.json(teams);
  } catch (err) {
    console.error('Error fetching assigned teams:', err);
    res.status(500).json({ error: 'Server error fetching teams' });
  }
});

// router.get("/teams", authenticate, async (req, res) => {
//   try {
//     const { department } = req.query;

//     if (!department) {
//       return res.status(400).json({ error: "Department is required" });
//     }

//     // Find teams in that department
//     const teams = await User.findAll({
//       include: [
//         {
//           model: Mentor,
//           as: "mentor",
//           attributes: ["mentorId", "name", "department"]
//         }
//       ],
//       where: {},
//     });

//     // Filter users (teams) that map to given department
//     const filteredTeams = teams.filter(
//       (t) => t.mentor && t.mentor.department === department
//     );

//     res.json(filteredTeams);
//   } catch (err) {
//     console.error("Error fetching teams:", err);
//     res.status(500).json({ error: "Failed to fetch teams" });
//   }
// });

/**
 * POST Add/Update review comment
 */
router.post('/uploads/:uploadId/review', authenticate, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { review_comment } = req.body;
    const mentorId = req.user.mentorId;

    // 1. Get mentor details
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // 2. Get upload + student details
    const upload = await TeamUpload.findByPk(uploadId, {
      include: [
        { model: User, attributes: ['UserId', 'email', 'mobile', 'team_name', 'mentor_id'] }
      ]
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const student = upload.User; // The uploader (team leader/student)

    // 3. Authorization check
    if (student.mentor_id !== mentorId) {
      return res.status(403).json({ error: 'Not authorized to review this upload' });
    }

    // 4. Save review
    upload.review_comment = review_comment;
    upload.status = 'REVIEWED';
    await upload.save();

    const weekNumber = upload.week_number;
    const fileName = upload.file_name;
    const supabaseUrl = upload.file_url;

    // 5. Send email to student
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };
//student.email
    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email:student.email }],
      subject: `Review Submitted by ${mentor.title}${mentor.name} - Week ${weekNumber}`,
      htmlContent: `
        <h3>Hello ${student.team_name},</h3>
        <p>Your mentor <strong>${mentor.title}${mentor.name}</strong> has submitted a review for your <strong>Week ${weekNumber}</strong> upload.</p>
        <p><strong>Review Comments:</strong></p>
        <blockquote style="background:#f8f9fa; padding:10px; border-left:4px solid #007bff;">
          ${review_comment}
        </blockquote>
        <p>You can also view the review from your dashboard:</p>
        <p><a href="https://ipd-portal.onrender.com/" target="_blank">Go to IPD Dashboard</a></p>
        <p>Team Name: <strong>${student.team_name}</strong></p>
        <p>Contact No: <strong>${student.mobile}</strong></p>
        <br />
        <p>Best Regards,<br />IPD Team</p>
      `,
      attachment: [
        {
          url: supabaseUrl, // link to uploaded file
          name: fileName,
        },
      ],
    });

    res.json({ message: 'Review saved and email sent successfully', upload });

  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Server error saving review' });
  }
});


/**
 * GET Mentor Details
 */
router.get('/details', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // from JWT/session

    const mentor = await Mentor.findByPk(mentorId, {
      attributes: ['MentorId', 'name', 'email', 'title','department','is_coordinator','designation'] // add fields as needed
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    res.json(mentor);
  } catch (err) {
    console.error('Error fetching mentor details:', err);
    res.status(500).json({ error: 'Server error fetching mentor details' });
  }
});


export default router;
