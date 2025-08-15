import express from 'express';
import { Op } from 'sequelize';
import authenticate  from '../middleware/authenticate.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js'
import TeamUpload from '../models/TeamUpload.js';
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';

const router = express.Router();

/**
 * GET Assigned Teams + their uploads
 */
router.get('/teams', authenticate, async (req, res) => {
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
      to: [{ email: "balajiaru06@gmail.com" }],
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
