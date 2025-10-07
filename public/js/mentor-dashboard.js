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

    if (mentor.is_coordinator) {
      // ✅ Check review1 deadline window
      try {
        const deadlineRes = await axios.get('/rubrics/deadline/review1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { start, deadline } = deadlineRes.data;

        const now = new Date();
        const startDate = new Date(start);
        const deadlineDate = new Date(deadline);

        if (now >= startDate && now <= deadlineDate) {
          document.getElementById("review1Section").classList.remove("hidden");
          loadMentorUpload(); // load uploaded file
        } else {
          document.getElementById("review1Section").classList.add("hidden");
        }
      } catch (err) {
        console.error("Error checking review1 deadline:", err);
        document.getElementById("review1Section").classList.add("hidden");
      }
    } else {
      document.getElementById("review1Section").classList.add("hidden");
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
    console.log(startDate, deadlineDate)

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
  submitBtn.addEventListener('click', () => submitRubrics(teamId, "review1"));
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
// async function loadTeams() {
//   try {
//     const token = localStorage.getItem('token');
//     const res = await axios.get('/mentor/my-teams', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     console.log(res.data);

//     const teamList = document.getElementById('teamList');
//     teamList.innerHTML = '';

//     res.data.forEach(team => {
//       const teamCard = document.createElement('div');
//       teamCard.className = 'border rounded-lg p-4 shadow-sm';

//       // Check if uploads exist
//       let uploadsContent = '';
//       if (team.TeamUploads && team.TeamUploads.length > 0) {
//         uploadsContent = team.TeamUploads.map(upload => {
//           const alreadyReviewed = !!upload.review_comment;
//           const stat = upload.status;

//           let dataType = "upload"; // default

// if (upload.week_number === 3) dataType = "idea";
// else if (upload.week_number === 4) dataType = "swot";
// else if (upload.week_number === 5) dataType = "value";

// let viewLink = upload.file_url
//   ? `<a href="${upload.file_url}" class="text-blue-600 underline" target="_blank">Download</a>`
//   : `<a href="#" class="text-blue-600 underline view-link" data-week="${upload.week_number}" data-type="${dataType}">View</a>`;

//           return `
//             <div class="p-3 border rounded bg-gray-50">
//               <p class="font-semibold">File - ${upload.week_number}</p>
//               ${viewLink}
//               ${alreadyReviewed && stat === "REVIEWED"
//                 ? `<textarea class="w-full mt-2 p-2 border rounded bg-gray-100" readonly>${upload.review_comment}</textarea>
//                    <button class="mt-2 bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed" disabled>Reviewed</button>`
//                 : `<textarea placeholder="Write your review..." class="w-full mt-2 p-2 border rounded review-text"></textarea>
//                    <button 
//                      class="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 submitReviewBtn"
//                      data-team-id="${team.id}" 
//                      data-upload-id="${upload.id}">
//                      Submit Review
//                    </button>`
//               }
//             </div>
//           `;
//         }).join('');
//       } else {
//         let fallbackLinks = '';

//         if (team.IdeaSelection) {
//           fallbackLinks += `<a href="#" class="text-blue-600 underline view-link" data-type="idea">View Idea Generation</a>`;
//         }

//         if (team.SwotAnalysis) {
//           fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-type="swot">View SWOT Analysis</a>`;
//         }

//         if (team.ValueProposition) {
//           fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-type="value">View Value Proposition</a>`;
//         }

//         if (!fallbackLinks) {
//           fallbackLinks = `<span class="text-gray-600 italic">No data available yet</span>`;
//         }

//         uploadsContent = `<div class="p-3 border rounded bg-gray-50">${fallbackLinks}</div>`;
//       }

//       teamCard.innerHTML = `
//         <div class="flex justify-between items-center">
//           <div>
//             <h3 class="font-bold text-lg">${team.team_name}</h3>
//             <p class="text-gray-600">Leader: ${team.email}</p>
//           </div>
//           <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 toggleUploads">View Uploads</button>
//         </div>
//         <div class="uploads mt-4 hidden space-y-3">
//           ${uploadsContent}
//         </div>
//       `;

//       teamList.appendChild(teamCard);

// // Attach modal logic for "view-link"
// const viewLinks = teamCard.querySelectorAll(".view-link");
// viewLinks.forEach(link => {
//   link.addEventListener("click", (e) => {
//     e.preventDefault();
//     const type = link.getAttribute("data-type");

//     // Update URL in current page with team id
//     const url = new URL(window.location);
//     url.searchParams.set("id", team.UserId);
//     url.searchParams.set("type", type); // optional
//     window.history.pushState({}, "", url);

//           // Handle modal rendering
//           if (type === "swot" && team.SwotAnalysis) {
//             document.getElementById("swotModal").classList.remove("hidden");
//             const swotIframe = document.getElementById("swotIframe");
//             swotIframe.src = "../swot.html";
//             // swotIframe.onload = () => {
//             //   swotIframe.contentWindow.postMessage({
//             //     type: "SWOT_DATA",
//             //     team_name: team.team_name,
//             //     swot: team.SwotAnalysis
//             //   }, "*");
//             // };
//           }

//           if (type === "idea" && team.IdeaSelection) {
//             document.getElementById("ideaModal").classList.remove("hidden");
//             const ideaIframe = document.getElementById("ideaIframe");
//             ideaIframe.src = "idea.html";
//             ideaIframe.onload = () => {
//               ideaIframe.contentWindow.postMessage({
//                 type: "IDEA_DATA",
//                 team_name: team.team_name,
//                 idea: team.IdeaSelection
//               }, "*");
//             };
//           }

//           if (type === "value" && team.ValueProposition) {
//             document.getElementById("valueModal").classList.remove("hidden");
//             const valueIframe = document.getElementById("valueIframe");
//             // valueIframe.src = "value.html";
//             valueIframe.onload = () => {
//               valueIframe.contentWindow.postMessage({
//                 type: "VALUE_DATA",
//                 team_name: team.team_name,
//                 value: team.ValueProposition
//               }, "*");
//             };
//           }
//         });
//       });
//     });

//     // Close buttons
//     document.getElementById("closeSwotModal").addEventListener("click", () => {
//       document.getElementById("swotModal").classList.add("hidden");
//     });
//     // Uncomment if you want idea/value modals closable too
//     // document.getElementById("closeIdeaModal").addEventListener("click", () => {
//     //   document.getElementById("ideaModal").classList.add("hidden");
//     // });
//     // document.getElementById("closeValueModal").addEventListener("click", () => {
//     //   document.getElementById("valueModal").classList.add("hidden");
//     // });

//   } catch (err) {
//     console.error(err);
//   }
// }


async function loadTeams() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/mentor/my-teams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);

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

          // let dataType = "upload"; // default

          // if (upload.week_number === 3) dataType = "idea";
          // else if (upload.week_number === 4) dataType = "swot";
          // else if (upload.week_number === 5) dataType = "value";

          // build link depending on file_url availability
          let viewLink = "";
          if (upload.file_url) {
            viewLink = `<a href="${upload.file_url}" class="text-blue-600 underline" target="_blank">Download</a>`;
          } else {
            viewLink = `<a href="#" class="text-blue-600 underline view-link" data-week="${upload.week_number}">View</a>`;
          }

          return `
            <div class="p-3 border rounded bg-gray-50">
              <p class="font-semibold">File - ${upload.week_number}</p>
              ${viewLink}
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
        let fallbackLinks = '';

        // if idea data exists
        if (team.IdeaSelection) {
          fallbackLinks += `
      <a href="#" class="text-blue-600 underline view-link" data-week="3">View Idea Generation</a>
    `;
        }

        // if SWOT data exists
        if (team.SwotAnalysis) {
          fallbackLinks += `
      <a href="#" class="ml-4 text-blue-600 underline view-link" data-week="4">View SWOT Analysis</a>
    `;
        }

        // if Value Proposition exists (week 5 maybe?)
        if (team.ValueProposition) {
          fallbackLinks += `
      <a href="#" class="ml-4 text-blue-600 underline view-link" data-week="5">View Value Proposition</a>
    `;
        }

        if (!fallbackLinks) {
          fallbackLinks = `<span class="text-gray-600 italic">No data available yet</span>`;
        }

        uploadsContent = `
    <div class="p-3 border rounded bg-gray-50">
      ${fallbackLinks}
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

      // attach modal logic for "view-link" anchors
      const viewLinks = teamCard.querySelectorAll(".view-link");
      viewLinks.forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const type = link.getAttribute("data-type");

          // Update URL in current page with team id
          // const url = new URL(window.location);
          // url.searchParams.set("id", team.UserId);
          // url.searchParams.set("type", type); // optional
          // window.history.pushState({}, "", url);

          const week = parseInt(link.getAttribute("data-week"), 10);

          if (week === 4) {
            document.getElementById("swotModal").classList.remove("hidden");
            // const swotSubmitBtn = document.getElementById("swotSubmitBtn");
            // if (swotSubmitBtn) swotSubmitBtn.style.display = "none";
            document.getElementById("swotIframe").src = `swot-mentor.html?id=${team.UserId}&type=swot`;
          } else if (week === 3) {
            document.getElementById("ideaModal").classList.remove("hidden");
            // const ideaSubmitBtn = document.getElementById("ideaSubmitBtn");
            // if (ideaSubmitBtn) ideaSubmitBtn.style.display = "none";
            document.getElementById("ideaIframe").src = `idea-mentor.html?id=${team.UserId}&type=idea`;
          }else if (week === 5) {
            document.getElementById("ideaModal").classList.remove("hidden");
            // const ideaSubmitBtn = document.getElementById("ideaSubmitBtn");
            // if (ideaSubmitBtn) ideaSubmitBtn.style.display = "none";
            document.getElementById("ideaIframe").src = `value-mentor.html?id=${team.UserId}&type=value`;
          }
        });
      });
    });

    // close buttons for modals
    document.getElementById("closeSwotModal").addEventListener("click", () => {
      document.getElementById("swotModal").classList.add("hidden");
    });

    document.getElementById("closeIdeaModal").addEventListener("click", () => {
      document.getElementById("ideaModal").classList.add("hidden");
    });

    document.getElementById("closeValueModal").addEventListener("click", () => {
      document.getElementById("valueModal").classList.add("hidden");
    });

  } catch (err) {
    console.error(err);
    // window.location.href = "/login.html";
  }
}




function renderSwotModal(team) {
  const container = document.getElementById("swotContainer");

  // Use the same HTML structure you have in swot.html, but fill values from `team.SwotAnalysis`
  const swot = team.SwotAnalysis || {};
  const teamName = team.team_name || "";
  const selectedIdea = swot.selected_idea || "";
  const strengths = swot.strengths || "";
  const weakness = swot.weakness || "";
  const opportunities = swot.opportunities || "";
  const threats = swot.threats || "";

  container.innerHTML = `
        <div>
            <p><strong>Team Name:</strong> ${teamName}</p>
            <p><strong>Selected Idea:</strong> ${selectedIdea}</p>
        </div>
        <table style="width:100%; border-collapse: collapse;">
            <tr>
                <td style="border:1px solid #000; padding:5px;"><strong>Strengths</strong><br>${strengths}</td>
                <td style="border:1px solid #000; padding:5px;"><strong>Weakness</strong><br>${weakness}</td>
            </tr>
            <tr>
                <td style="border:1px solid #000; padding:5px;"><strong>Opportunities</strong><br>${opportunities}</td>
                <td style="border:1px solid #000; padding:5px;"><strong>Threats</strong><br>${threats}</td>
            </tr>
        </table>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
    `;

  document.getElementById("swotModal").classList.remove("hidden");
}



document.getElementById("review1Form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("review1File");
  if (!fileInput.files.length) return;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const token = localStorage.getItem("token");

    await axios.post("/mentor/upload-excel", formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        document.getElementById("review1Progress").style.width = `${percent}%`;
        document.getElementById("review1Progress").textContent = `${percent}%`;
      },
    });

    alert("Upload successful!");
    loadMentorUpload(); // refresh uploaded file info
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Upload failed!");
  }
});

async function loadMentorUpload() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/mentor/my-upload", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const historyDiv = document.getElementById("mentorUploadHistory");
    historyDiv.innerHTML = "";

    if (res.data.file_url) {
      historyDiv.innerHTML = `
        <div class="p-3 border rounded bg-gray-50 mb-2">
          <p class="font-semibold">${res.data.file_name}</p>
          <p class="text-sm text-gray-600">Uploaded: ${new Date(res.data.uploaded_at).toLocaleString()}</p>
          <a href="${res.data.file_url}" target="_blank" class="text-blue-600 underline">Download</a>
        </div>
      `;
    } else {
      historyDiv.innerHTML = `<p class="text-gray-500 italic">No uploads yet</p>`;
    }

  } catch (err) {
    console.error("Error loading upload:", err);
  }
}



loadTeams();
loadMentorDetails();
// loadRubricsTeams();