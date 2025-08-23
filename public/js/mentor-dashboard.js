// Sidebar toggle for mobile
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('-translate-x-full');
});

// Toggle uploads view
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('toggleUploads')) {
    const uploadsDiv = e.target.closest('.border').querySelector('.uploads');
    uploadsDiv.classList.toggle('hidden');
  }
});

document.getElementById("logout").addEventListener("click", (e) => {
  e.preventDefault()
  localStorage.removeItem('token');
  window.location.href = "/login.html";
})

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('submitReviewBtn')) {
    const btn = e.target;
    const uploadId = btn.getAttribute('data-upload-id');
    const reviewText = btn.closest('.p-3').querySelector('.review-text').value.trim();

    if (!reviewText) {
      alert('Please write a review before submitting.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/mentor/uploads/${uploadId}/review`, {
        review_comment: reviewText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Review submitted successfully!');
      btn.disabled = true; // optional: prevent re-submission
      btn.textContent = 'Reviewed'; // optional: change button text
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review.');
    }
  }
});



async function loadMentorDetails() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/mentor/details', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const mentor = res.data;
    document.getElementById('mentorName').textContent = `${mentor.title}${mentor.name}`;
    document.getElementById('mentorEmail').textContent = mentor.email;
    document.getElementById('mentordept').textContent = `${mentor.designation} - ${mentor.department}`;

    if (mentor.is_coordinator) {
      document.getElementById('rubricsSection').style.display = "block";
    }
    else{
      document.getElementById('rubricsSection').style.display = "none"
    }
  } catch (err) {
    console.error('Failed to load mentor details:', err);
  }
}

async function loadRubricsTeams() {
  try {
    const token = localStorage.getItem('token');

    // Get deadlines
    const res = await axios.get('/rubrics/deadline/review1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { start, deadline } = res.data;

    const now = new Date();
    const startDate = new Date(start);
    const deadlineDate = new Date(deadline);
    console.log(startDate,deadlineDate)

    // Only show section if in window
   if (now >= startDate && now <= deadlineDate) {
    document.getElementById("rubricsSection").style.display = "block";
    try {
    const token = localStorage.getItem('token');
    const mentorRes = await axios.get('/mentor/details', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const mentor = mentorRes.data;
    if (!mentor.is_coordinator) return; // only coordinators see rubrics

    //here
    document.getElementById('rubricsSection').classList.remove('hidden');

    // Fetch teams in mentor department
   const teamRes = await axios.get(`/mentor/teams?reviewType=review1`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const teamSelect = document.getElementById('teamSelect');
    teamRes.data.forEach(team => {
      const option = document.createElement('option');
      option.value = team.UserId;
      option.textContent = `${team.team_name} (${team.email})`;
      teamSelect.appendChild(option);
    });

    // When team is selected → load rubrics
    teamSelect.addEventListener('change', () => {
      const teamId = teamSelect.value;
      console.log(teamId)
      if (!teamId) {
        document.getElementById('rubricsForm').classList.add('hidden');
        return;
      }
      renderRubricsForm(teamId);
    });

  } catch (err) {
    console.error('Error loading rubrics teams:', err);
  }


} else {
  // here
   document.getElementById("rubricsSection").style.display = "none";
}

  } catch (err) {
    console.error('Error loading rubrics teams:', err);
  }
}


function renderRubricsForm(teamId) {
  const criteria = [
    "Problem Identification",
    "Problem Statement Canvas",
    "Idea Generation & Affinity diagram",
    "Team Presentation & Clarity",
    "Mentor Interaction & Progress Tracking"
  ];

  const rubricsForm = document.getElementById('rubricsForm');
  rubricsForm.innerHTML = '';

  criteria.forEach((criterion, index) => {
    const row = document.createElement('div');
    row.className = "mb-4";
    row.innerHTML = `
      <p class="font-semibold mb-2">${criterion}</p>
      <div class="flex space-x-4">
        ${[1, 2, 3, 4, 5].map(score => `
          <label class="rubric-label">
            <input type="radio" name="criterion_${index + 1}" value="${score}" class="rubric-score hidden">
            <span>${score}</span>
          </label>
        `).join('')}
      </div>
    `;
    rubricsForm.appendChild(row);
  });

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.textContent = "Submit Rubrics";
  submitBtn.className = "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600";
  submitBtn.addEventListener('click', () => submitRubrics(teamId,"review1"));
  rubricsForm.appendChild(submitBtn);

  rubricsForm.classList.remove('hidden');

  // 🔥 Add event listener to toggle highlight
  rubricsForm.querySelectorAll('.rubric-score').forEach(input => {
    input.addEventListener('change', () => {
      const group = rubricsForm.querySelectorAll(`input[name="${input.name}"]`);
      group.forEach(r => r.parentElement.classList.remove('selected'));
      input.parentElement.classList.add('selected');
    });
  });
}


async function submitRubrics(teamId, stage) {
  const scores = {};
  document.querySelectorAll('.rubric-score:checked').forEach(input => {
    const critIndex = input.name.split('_')[1]; // e.g. "1"
    scores[`rubric${critIndex}`] = parseInt(input.value, 10);
  });

  const token = localStorage.getItem('token');
  try {
    await axios.post(`/mentor/teams/${teamId}/rubrics/${stage}`, { scores }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(scores);
    alert(`Rubrics for ${stage} submitted successfully!`);

     // ✅ Reset radio buttons
    document.querySelectorAll('.rubric-score').forEach(input => {
      input.checked = false;
    });

    // ✅ Re-fetch teams to update dropdown
    loadRubricsTeams();

    // ✅ Hide form after submission
    document.getElementById('rubricsForm').classList.add('hidden');

  } catch (err) {
    console.error('Error submitting rubrics:', err);
    alert('Failed to submit rubrics.');
  }
}





// Fetch assigned teams & uploads (replace with API)
// Fetch assigned teams & uploads (replace with API)
// Fetch assigned teams & uploads (replace with API)
async function loadTeams() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/mentor/my-teams', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const teamList = document.getElementById('teamList');
    teamList.innerHTML = '';

    res.data.forEach(team => {
      const teamCard = document.createElement('div');
      teamCard.className = 'border rounded-lg p-4 shadow-sm';

      // Check if uploads exist
      let uploadsContent = '';
      if (team.TeamUploads && team.TeamUploads.length > 0) {
        uploadsContent = team.TeamUploads.map(upload => {
          const alreadyReviewed = !!upload.review_comment;
          const stat = upload.status;
          return `
            <div class="p-3 border rounded bg-gray-50">
              <p class="font-semibold">File - ${upload.week_number}</p>
              <a href="${upload.file_url}" class="text-blue-600 underline" target="_blank">Download</a>
              ${alreadyReviewed && stat === "REVIEWED"
                ? `
                  <textarea class="w-full mt-2 p-2 border rounded bg-gray-100" readonly>${upload.review_comment}</textarea>
                  <button class="mt-2 bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed" disabled>Reviewed</button>
                `
                : `
                  <textarea placeholder="Write your review..." class="w-full mt-2 p-2 border rounded review-text"></textarea>
                  <button 
                    class="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 submitReviewBtn"
                    data-team-id="${team.id}" 
                    data-upload-id="${upload.id}">
                    Submit Review
                  </button>
                `
              }
            </div>
          `;
        }).join('');
      } else {
        uploadsContent = `
          <div class="p-3 border rounded bg-gray-50 text-gray-600 italic">
            No uploads yet
          </div>
        `;
      }

      teamCard.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">${team.team_name}</h3>
            <p class="text-gray-600">Leader: ${team.email}</p>
          </div>
          <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 toggleUploads">View Uploads</button>
        </div>
        <div class="uploads mt-4 hidden space-y-3">
          ${uploadsContent}
        </div>
      `;

      teamList.appendChild(teamCard);
    });
  } catch (err) {
    console.error(err);
    // window.location.href = "/login.html";
  }
}




loadTeams();
loadMentorDetails();
loadRubricsTeams();