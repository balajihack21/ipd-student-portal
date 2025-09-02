// backend/adminRoutes.js
import express from 'express';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import TeamUpload from '../models/TeamUpload.js';
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';
import {getSignedFileUrl}  from "../backblaze.js";


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
          attributes: ['id','week_number', 'file_key', 'uploaded_at', 'createdAt', 'status', 'review_comment']
        }
      ],
      order: [
        ['UserId', 'ASC'], // Optional: Order by team id
        [TeamUpload, 'week_number', 'ASC'] // Optional: Order uploads by week
      ]
    });

    
    // Extend expiry for 2 months (~60 days)
    const signedTeams = await Promise.all(
      teams.map(async (team) => {
        const uploads = await Promise.all(
          team.TeamUploads.map(async (u) => {
            let signedUrl = null;
            if (u.file_key) {
              signedUrl = await getSignedFileUrl(u.file_key, 60 * 24 * 60 * 60); 
              // 60 days in seconds
            }
            return {
              ...u.toJSON(),
              file_url: signedUrl,
            };
          })
        );
        return {
          ...team.toJSON(),
          TeamUploads: uploads,
        };
      })
    );

    // Calculate counts
    let uploadedCount = 0;
    let notUploadedCount = 0;
    signedTeams.forEach((team) => {
      if (team.TeamUploads && team.TeamUploads.length > 0) {
        uploadedCount++;
      } else {
        notUploadedCount++;
      }
    });

    res.json({
      uploadedCount,
      notUploadedCount,
      teams: signedTeams,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/uploads/:uploadId/comment', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { review_comment } = req.body;

    // 1. Get upload + user + mentor
    const upload = await TeamUpload.findByPk(uploadId, {
      include: [
        {
          model: User,
          attributes: ['UserId', 'email', 'mobile', 'team_name', 'mentor_id'],
          include: [{ model: Mentor, as: 'mentor', attributes: ['name', 'email', 'title', 'department'] }]
        }
      ]
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const student = upload.User;    // Team leader
    const mentor = student.mentor;  // Mentor

    if (!mentor) {
      return res.status(400).json({ error: 'No mentor assigned to this team' });
    }

    // 2. Setup email client
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };

    const weekNumber = upload.week_number;
    const fileName = upload.file_name;
    const supabaseUrl = upload.file_url;
//student.email
//mentor.email
console.log(student.email,mentor.email)
    // 3. Send email to Team Leader and Mentor
    await transEmailApi.sendTransacEmail({
      sender,
      to: [
        { email: student.email },   // Team leader
        { email:  mentor.email}     // Mentor
      ],
      subject: `IPD HEAD Comment - File ${weekNumber}`,
      htmlContent: `
        <h3>Hello ${student.team_name},</h3>
        <p>An <strong>IPD Head</strong> has shared a comment on your <strong>File ${weekNumber}</strong> upload.</p>
        
        <p><strong>Comment:</strong></p>
        <blockquote style="background:#f8f9fa; padding:10px; border-left:4px solid #007bff;">
          ${review_comment}
        </blockquote>

        <p>You can also check the file here:</p>
        <p><a href="${supabaseUrl}" target="_blank">View Uploaded File</a></p>

        <p><strong>Team:</strong> ${student.team_name}</p>
        <p><strong>Leader Contact:</strong> ${student.mobile}</p>
        <p><strong>Mentor:</strong> ${mentor.title || ''} ${mentor.name} (${mentor.department})</p>

        <br />
        <p>Best Regards,<br />IPD Team</p>
      `,
      attachment: [
        {
          url: supabaseUrl,
          name: fileName,
        }
      ]
    });

    res.json({ message: 'Admin comment mailed successfully to Team Leader & Mentor' });

  } catch (err) {
    console.error('Error sending admin comment email:', err);
    res.status(500).json({ error: 'Server error sending email' });
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

// Lock a team (disable uploads)
router.post("/teams/:teamId/lock", async (req, res) => {
  try {
    const { teamId } = req.params;
    await User.update({ isLocked: true }, { where: { UserId: teamId } });
    res.json({ message: `Team ${teamId} locked successfully` });
  } catch (err) {
    console.error("Error locking team:", err);
    res.status(500).json({ error: "Failed to lock team" });
  }
});

// Unlock a team (enable uploads)
router.post("/teams/:teamId/unlock", async (req, res) => {
  try {
    const { teamId } = req.params;
    await User.update({ isLocked: false }, { where: { UserId: teamId } });
    res.json({ message: `Team ${teamId} unlocked successfully` });
  } catch (err) {
    console.error("Error unlocking team:", err);
    res.status(500).json({ error: "Failed to unlock team" });
  }
});

export default router;
