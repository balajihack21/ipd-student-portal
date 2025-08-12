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
    document.getElementById('mentorName').textContent =`${mentor.title}${mentor.name}`;
    document.getElementById('mentorEmail').textContent = mentor.email;
    document.getElementById('mentordept').textContent = mentor.department;
  } catch (err) {
    console.error('Failed to load mentor details:', err);
  }
}


// Fetch assigned teams & uploads (replace with API)
// Fetch assigned teams & uploads (replace with API)
async function loadTeams() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/mentor/teams', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const teamList = document.getElementById('teamList');
    teamList.innerHTML = '';

    res.data.forEach(team => {
      const teamCard = document.createElement('div');
      teamCard.className = 'border rounded-lg p-4 shadow-sm';

      teamCard.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">${team.team_name}</h3>
            <p class="text-gray-600">Leader: ${team.email}</p>
          </div>
          <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 toggleUploads">View Uploads</button>
        </div>
        <div class="uploads mt-4 hidden space-y-3">
          ${team.TeamUploads.map(upload => {
            const alreadyReviewed = !!upload.review_comment;
            const stat=upload.status; // check if review exists
            return `
              <div class="p-3 border rounded bg-gray-50">
                <p class="font-semibold">Week -${upload.week_number}</p>
                <a href="${upload.file_url}" class="text-blue-600 underline" target="_blank">Download</a>
                ${alreadyReviewed && stat=="REVIEWED"
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
          }).join('')}
        </div>
      `;
      teamList.appendChild(teamCard);
    });
  } catch (err) {
    window.location.href = "/login.html";
    console.error(err);
  }
}



loadTeams();
loadMentorDetails();