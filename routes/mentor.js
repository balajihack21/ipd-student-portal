import express from 'express';
import { Op } from 'sequelize';
import authenticate  from '../middleware/authenticate.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js'
import Student from '../models/Student.js'
import TeamUpload from '../models/TeamUpload.js';
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';
import {getSignedFileUrl}  from "../backblaze.js";

const router = express.Router();

/**
 * GET Assigned Teams + their uploads
 */

router.get("/teams/dropdown", authenticate, async (req, res) => {
  try {
    const { reviewType } = req.query; // "review1" or "review2"

    let whereClause = {};
    if (reviewType === "review1") {
      whereClause.review1_score = null; // not submitted yet
    } else if (reviewType === "review2") {
      whereClause.review2_score = null;
    }

    const teams = await User.findAll({
      where: whereClause,
      attributes: ["UserId", "team_name"]
    });

    res.json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});


router.get('/teams', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // comes from JWT
    const { reviewType } = req.query;

    let whereClause = {};
    if (reviewType === "review1") {
      whereClause.review1_score = null; // not submitted yet
    } else if (reviewType === "review2") {
      whereClause.review2_score = null;
    }


    // Find mentor details (to get department)
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Fetch all teams whose leader belongs to same department as mentor
    const teams = await User.findAll({
      where:whereClause,
      attributes: ['UserId', 'team_name', 'email', 'mobile'],
      include: [
        {
          model: Student,
          attributes: ['student_name', 'dept', 'section', 'register_no', 'mobile'],
          where: {
            is_leader: true,
            dept: mentor.department , // ✅ filter by leader’s dept
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


router.post("/teams/:teamId/rubrics/:stage", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId, stage } = req.params;
    const { scores } = req.body;

    if (!scores || typeof scores !== "object") {
      return res.status(400).json({ error: "Scores are required" });
    }

    // Check mentor role
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can submit rubrics" });
    }

    // Ensure team exists
    const team = await User.findByPk(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    // ✅ Determine rubric range by stage
    let startIndex, endIndex;
    if (stage === "review1") {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  await team.update({
    rubric1: scores.rubric1,
    rubric2: scores.rubric2,
    rubric3: scores.rubric3,
    rubric4: scores.rubric4,
    rubric5: scores.rubric5,
    review1_score: total
  });
} else if (stage === "review2") {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  await team.update({
    rubric6: scores.rubric6,
    rubric7: scores.rubric7,
    rubric8: scores.rubric8,
    rubric9: scores.rubric9,
    rubric10: scores.rubric10,
    review2_score: total
  });
}
 else {
      return res.status(400).json({ error: "Invalid review stage" });
    }

    // ✅ Extract only relevant rubrics
    const rubricFields = {};
    for (let i = startIndex; i <= endIndex; i++) {
      const key = `rubric${i}`;
      if (scores[key] !== undefined) {
        rubricFields[key] = scores[key];
      }
    }

    await User.update(rubricFields, { where: { UserId: teamId } });

    res.json({ message: `Rubrics for ${stage} submitted successfully`, updated: rubricFields });
  } catch (err) {
    console.error("Error submitting rubrics:", err);
    res.status(500).json({ error: "Failed to submit rubrics" });
  }
});





// ✅ /my-teams route
router.get('/my-teams', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // from JWT/session
    console.log("Mentor:", req.user);

    // Find all students/teams assigned to this mentor
    const teams = await User.findAll({
      where: { mentor_id: mentorId },
      attributes: ['UserId', 'team_name', 'email', 'mobile'],
      include: [
        {
          model: TeamUpload,
          attributes: [
            'id',
            'file_key',   // we need file_key to generate signed URL
            'week_number',
            'uploaded_at',
            'status',
            'review_comment'
          ],
          order: [['uploaded_at', 'DESC']]
        }
      ]
    });

    // Replace file_url with signed URL
    const signedTeams = await Promise.all(
      teams.map(async (team) => {
        const uploads = await Promise.all(
          team.TeamUploads.map(async (upload) => {
            let signedUrl = null;
            if (upload.file_key) {
              signedUrl = await getSignedFileUrl(upload.file_key); // 7 days max
            }
            return {
              ...upload.toJSON(),
              file_url: signedUrl, // replace with signed URL
            };
          })
        );

        return {
          ...team.toJSON(),
          TeamUploads: uploads,
        };
      })
    );

    res.json(signedTeams);

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
      to: [{ email: student.email}],
      subject: `Review Submitted by ${mentor.title}${mentor.name} - File ${weekNumber}`,
      htmlContent: `
        <h3>Hello ${student.team_name},</h3>
        <p>Your mentor <strong>${mentor.title}${mentor.name}</strong> has submitted a review for your <strong>File ${weekNumber}</strong> upload.</p>
        <p><strong>Review Comments:</strong></p>
        <blockquote style="background:#f8f9fa; padding:10px; border-left:4px solid #007bff;">
          ${review_comment}
        </blockquote>
        <p>You can also view the review from your dashboard:</p>
        <p><a href="https://agni-ipd.onrender.com/" target="_blank">Go to IPD Dashboard</a></p>
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
