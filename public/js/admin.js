const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    // Reset all tabs and contents
    tabs.forEach(t => t.classList.remove("active", "border-b-2", "border-blue-500"));
    contents.forEach(c => c.classList.add("hidden"));

    // Activate selected tab
    tab.classList.add("active", "border-b-2", "border-blue-500");
    document.getElementById(tab.dataset.tab).classList.remove("hidden");

    // 🔹 Assign Tab
    if (tab.dataset.tab === "assignTab") {
      renderReassignMentorTable();
    }

    // 🔹 History Tab
    if (tab.dataset.tab === "historyTab") {
      fetchAllTeamHistories();
    }

    // 🔹 Timeline Tab
    if (tab.dataset.tab === "timelineTab") {
      loadAllTimelineDates(); // 👈 new function to fetch timeline dates
    }

    if (tab.dataset.tab === "reviewTab") {
  fetchReviewScores();
}

  });
});

// ======================= REVIEW SCORES TAB =======================

let reviewData = [];
let reviewFiltered = [];
let reviewCurrentPage = 1;
let reviewRowsPerPage = 10;

async function fetchReviewScores() {
  try {
    const res = await axios.get("/admin/all-review-scores");
    reviewData = Array.isArray(res.data) ? res.data : [];
    reviewFiltered = [...reviewData];

    // Assign "Role" properly (Team Leader / Student 1, 2, 3, ...)
    const groupedByTeam = {};
    reviewData.forEach((r) => {
      if (!groupedByTeam[r.teamId]) groupedByTeam[r.teamId] = [];
      groupedByTeam[r.teamId].push(r);
    });

    Object.keys(groupedByTeam).forEach((teamId) => {
      const teamMembers = groupedByTeam[teamId];
      let studentCounter = 1;
      teamMembers.forEach((m) => {
        if (m.role === "Leader" || m.is_leader) {
          m.role = "Team Leader";
        } else {
          m.role = `Student ${studentCounter++}`;
        }
      });
    });

    // Handle rows per page change
    const select = document.getElementById("reviewRowsPerPageSelect");
    if (select) {
      reviewRowsPerPage = Number(select.value);
      select.onchange = (e) => {
        reviewRowsPerPage = Number(e.target.value);
        reviewCurrentPage = 1;
        renderReviewTable();
      };
    }

    attachReviewFilters();
    renderReviewTable();
  } catch (err) {
    console.error("Error fetching review scores:", err);
    document.getElementById("reviewTable").innerHTML =
      `<p class="text-red-600 p-4">Failed to load review scores.</p>`;
  }
}

function renderReviewTable() {
  const container = document.getElementById("reviewTable");
  if (!container) return;

  const start = (reviewCurrentPage - 1) * reviewRowsPerPage;
  const paginated = reviewFiltered.slice(start, start + reviewRowsPerPage);

  if (!paginated.length) {
    container.innerHTML = `<p class="text-gray-500 text-center p-4">No records found.</p>`;
    renderReviewPagination();
    return;
  }

  const rows = paginated
    .map((r) => {
      const r1 = r.review1score ?? 0;
      const r2 = r.review2score ?? 0;
      const wb = r.workbook_score ?? 0;

      const reviewTotal = r1 + r2;
      const total = r.total_score ?? r1 + r2 + wb;

      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-2">${r.teamId || ""}</td>
          <td class="p-2 font-semibold">${r.team_name || ""}</td>
          <td class="p-2">${r.name || ""}</td>
          <td class="p-2">${r.section || ""}</td>
          <td class="p-2">${r.register_no || ""}</td>
          <td class="p-2">${r.dept || ""}</td>
          <td class="p-2 font-medium text-blue-700">${r.role || ""}</td>
          <td class="p-2 text-center">${r1}/30</td>
          <td class="p-2 text-center">${r2}/30</td>
          <td class="p-2 text-center font-semibold">${reviewTotal}/60</td>
          <td class="p-2 text-center">${wb}/40</td>
          <td class="p-2 font-bold text-green-700 text-center">${total}/100</td>
        </tr>`;
    })
    .join("");

  container.innerHTML = `
    <table class="min-w-full text-sm border-collapse border border-gray-200">
      <thead class="bg-gray-100 text-gray-700">
        <tr>
          <th class="p-2">Team ID</th>
          <th class="p-2">Team Name</th>
          <th class="p-2">Student Name</th>
          <th class="p-2">Section</th>
          <th class="p-2">Register No</th>
          <th class="p-2">Dept</th>
          <th class="p-2">Role</th>
          <th class="p-2">Review 1 (30)</th>
          <th class="p-2">Review 2 (30)</th>
          <th class="p-2">Review Total (60)</th>
          <th class="p-2">Workbook (40)</th>
          <th class="p-2">Total(100)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  renderReviewPagination();
}

function renderReviewPagination() {
  const controls = document.getElementById("reviewPaginationControls");
  if (!controls) return;
  controls.innerHTML = "";

  const totalPages = Math.ceil(reviewFiltered.length / reviewRowsPerPage) || 1;

  const makeBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = `px-3 py-1 rounded border ${
      active ? "bg-blue-600 text-white" : "bg-white"
    } ${disabled ? "opacity-50" : "hover:bg-blue-100"}`;
    btn.disabled = disabled;
    if (!disabled)
      btn.onclick = () => {
        reviewCurrentPage = page;
        renderReviewTable();
      };
    return btn;
  };

  controls.appendChild(
    makeBtn("Prev", reviewCurrentPage - 1, reviewCurrentPage === 1)
  );
  for (let i = 1; i <= totalPages; i++) {
    if (i <= 3 || i > totalPages - 3 || Math.abs(i - reviewCurrentPage) <= 1) {
      controls.appendChild(makeBtn(i, i, false, i === reviewCurrentPage));
    } else if (i === 4 || i === totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      controls.appendChild(span);
    }
  }
  controls.appendChild(
    makeBtn("Next", reviewCurrentPage + 1, reviewCurrentPage === totalPages)
  );
}

function attachReviewFilters() {
  const general = document.getElementById("reviewGeneralSearch");
  const id = document.getElementById("reviewFilterTeamId");
  const team = document.getElementById("reviewFilterTeamName");
  const studentName = document.getElementById("reviewFilterStudentName");
  const dept = document.getElementById("reviewFilterDept");
  const section = document.getElementById("reviewFilterSection");

  [general, id, team, studentName, dept, section].forEach(
    (el) => el && el.addEventListener("input", applyReviewFilters)
  );

  const exportBtn = document.getElementById("exportReviewExcel");
  if (exportBtn) exportBtn.onclick = exportReviewExcel;
}

function applyReviewFilters() {
  const generalVal =
    (document.getElementById("reviewGeneralSearch")?.value || "").toLowerCase();
  const idVal =
    (document.getElementById("reviewFilterTeamId")?.value || "").toLowerCase();
  const teamVal =
    (document.getElementById("reviewFilterTeamName")?.value || "").toLowerCase();
  const studentVal =
    (document.getElementById("reviewFilterStudentName")?.value || "").toLowerCase();
  const deptVal =
    (document.getElementById("reviewFilterDept")?.value || "").toLowerCase();
  const secVal =
    (document.getElementById("reviewFilterSection")?.value || "").toLowerCase();

  reviewFiltered = reviewData.filter((r) => {
    return (
      (!generalVal ||
        JSON.stringify(r).toLowerCase().includes(generalVal)) &&
      (!idVal || (r.teamId || "").toLowerCase().includes(idVal)) &&
      (!teamVal || (r.team_name || "").toLowerCase().includes(teamVal)) &&
      (!studentVal || (r.name || "").toLowerCase().includes(studentVal)) &&
      (!deptVal || (r.dept || "").toLowerCase().includes(deptVal)) &&
      (!secVal || (r.section || "").toLowerCase().includes(secVal))
    );
  });

  // ✅ When filtering by dept or section, sort by register_no ascending
  if (deptVal || secVal) {
    reviewFiltered.sort((a, b) => (a.register_no || 0) - (b.register_no || 0));
  }

  reviewCurrentPage = 1;
  renderReviewTable();
}

function exportReviewExcel() {
  if (!reviewFiltered.length) return alert("No data to export.");

  const rows = [
    [
      "S.No",
      "Team ID",
      "Team Name",
      "Student Name",
      "Section",
      "Register No",
      "Dept",
      "Role",
      "Review 1 (30)",
      "Review 2 (30)",
      "Review Total (60)",
      "Workbook (40)",
      "Total (100)",
    ],
  ];

  reviewFiltered.forEach((r, i) => {
    const r1 = r.review1score ?? 0;
    const r2 = r.review2score ?? 0;
    const wb = r.workbook_score ?? 0;
    const reviewTotal = r1 + r2;
    const total = r.total_score ?? r1 + r2 + wb;

    rows.push([
      i + 1,
      r.teamId,
      r.team_name,
      r.name,
      r.section,
      r.register_no,
      r.dept,
      r.role,
      `${r1}/30`,
      `${r2}/30`,
      `${reviewTotal}/60`,
      `${wb}/40`,
      `${total}/100`,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Review Scores");
  XLSX.writeFile(wb, "review_scores.xlsx");
}





let allMentors = [];

let currentTeams = [];
let filteredTeams = [];
let filteredHistory = [];

async function fetchTeams() {
  const res = await axios.get("/admin/teams");
  currentTeams = res.data;
  filteredTeams = [...currentTeams];
  renderTeams(filteredTeams);
  attachFilters()


}





// function renderTeams(teams) {
//   const container = document.getElementById("teamsTable");
//   container.innerHTML = `
//     <table id="teamsTableData" class="min-w-full table-auto border rounded overflow-hidden shadow text-sm text-left">
//       <thead class="bg-blue-100">
//         <tr>
//           <th class="p-3">Team ID</th>
//           <th class="p-3">Team Name</th>
//           <th class="p-3">Email</th>
//           <th class="p-3">Mentor</th>
//           <th class="p-3">Mentor Dept</th>
//           <th class="p-3">Team Leader</th>
//           <th class="p-3">Student Dept</th>
//           <th class="p-3">Members</th>
//           <th class="p-3">Actions</th>
//         </tr>
//       </thead>
//       <tbody id="teamBody" class="bg-white divide-y">
//         ${teams.map(team => {
//           const leader = team.Students?.find(s => s.is_leader);
//           return `
//             <tr>
//               <td class="p-3">${team.UserId}</td>
//               <td class="p-3 font-medium text-blue-800">${team.team_name}</td>
//               <td class="p-3">${team.email}</td>
//               <td class="p-3">${team.mentor?.name || 'Unassigned'}</td>
//               <td class="p-3">${team.mentor?.department || 'N/A'}</td>
//               <td class="p-3">${leader?.student_name || 'N/A'}</td>
//               <td class="p-3">${leader?.dept || 'N/A'}</td>
//               <td class="p-3">${team.Students?.map(s => s.student_name).join(", ") || 'No members'}</td>
//               <td class="p-3">
//                 <button onclick="editTeam('${team.UserId}')" class="text-blue-600 hover:underline">Edit</button>
//                 <button onclick="deleteTeam('${team.UserId}')" class="text-red-600 hover:underline ml-2">Delete</button>
//               </td>
//             </tr>
//           `;
//         }).join("")}
//       </tbody>
//     </table>
//   `;

//   attachFilters();
// }

let currentPage = 1;
const itemsPerPage = 10;
let historyData = [];  // will store all team histories
let historyCurrentPage = 1;
let historyRowsPerPage = 5; // you can change to 10


async function fetchAllTeamHistories() {
  try {
    const res = await axios.get(`/admin/team-history`); // should return all
    historyData = res.data.teams; // store for pagination
    filteredHistory = [...historyData];
    console.log(res.data)
    document.getElementById('uploadedTeamsCount').textContent =
      `Uploaded Teams: ${res.data.uploadedCount}`;
    document.getElementById('notUploadedTeamsCount').textContent =
      `Not Uploaded Teams: ${res.data.notUploadedCount}`;
    historyCurrentPage = 1; // reset to first page
    renderHistoryTable();
    attachHistoryFilters();
    document.getElementById("uploadStatusFilter").addEventListener("change", applyHistoryFilters);


  } catch (err) {
    console.error(err);
    document.getElementById("historyContent").innerHTML = `<p class="text-red-500">Failed to load team histories.</p>`;
  }
}

function attachHistoryFilters() {
  const teamIdInput = document.getElementById("historyFilterTeamId");
  const teamNameInput = document.getElementById("historyFilterTeamName");
  const statusSelect = document.getElementById("historyFilterStatus");
  const mentorInput = document.getElementById("historyFilterMentorName");
  const leaderDeptInput = document.getElementById("historyFilterLeaderDept");

  [teamIdInput, teamNameInput, statusSelect, mentorInput, leaderDeptInput].forEach(el => {
    el.addEventListener("input", applyHistoryFilters);
    if (el.tagName === "SELECT") {
      el.addEventListener("change", applyHistoryFilters);
    }
  });
}

function applyHistoryFilters(resetPage = true) {
  const idVal = document.getElementById("historyFilterTeamId").value.toLowerCase();
  const nameVal = document.getElementById("historyFilterTeamName").value.toLowerCase();
  const statusVal = document.getElementById("historyFilterStatus").value.toLowerCase();
  const mentorVal = document.getElementById("historyFilterMentorName").value.toLowerCase();
  const leaderDeptVal = document.getElementById("historyFilterLeaderDept").value.toLowerCase();
  const uploadStatusFilter = document.getElementById("uploadStatusFilter").value;

  filteredHistory = historyData.filter(team => {
    const matchesUploadStatus =
      uploadStatusFilter === "all" ||
      (uploadStatusFilter === "uploaded" && team.TeamUploads && team.TeamUploads.length > 0) ||
      (uploadStatusFilter === "not_uploaded" && (!team.TeamUploads || team.TeamUploads.length === 0));

    const matchesId = team.UserId.toLowerCase().includes(idVal);
    const matchesName = team.team_name.toLowerCase().includes(nameVal);
    const matchesMentor = mentorVal === "" || (team.mentor?.name || "").toLowerCase().includes(mentorVal);
    const matchesLeaderDept = leaderDeptVal === "" || (team.Students.find(s => s.is_leader)?.dept || "").toLowerCase().includes(leaderDeptVal);
    const matchesStatus =
      statusVal === "" ||
      team.TeamUploads.some(
        u =>
          (u.status || "").toLowerCase() === statusVal &&
          (!u.review_comment || u.review_comment.trim() === "")
      );


    return matchesUploadStatus && matchesId && matchesName && matchesMentor && matchesLeaderDept && matchesStatus;
  });

  // ✅ Only reset page when a new filter is applied
  if (resetPage) {
    historyCurrentPage = 1;
  }

  renderHistoryTableFiltered(filteredHistory);
}


// render filtered instead of all
function renderHistoryTableFiltered(filteredTeams) {
  const start = (historyCurrentPage - 1) * historyRowsPerPage;
  const end = start + historyRowsPerPage;
  const paginatedTeams = filteredTeams.slice(start, end);

  let html = paginatedTeams.map(team => `
    <div class="bg-white shadow rounded p-6 space-y-4 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-semibold text-blue-700">${team.UserId}</h2>
          <h2 class="text-2xl font-semibold text-blue-700">${team.team_name}</h2>
        </div>
        <div>
          ${
            team.isLocked
              ? `<button class="unlock-btn bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700" data-team-id="${team.UserId}">Unlock</button>`
              : `<button class="lock-btn bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700" data-team-id="${team.UserId}">Lock</button>`
          }
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <p><strong>Email:</strong> ${team.email}</p>
        <p><strong>Mentor:</strong> ${team.mentor?.name || 'None'} (${team.mentor?.department || 'N/A'})</p>
        <p><strong>Mentor Email:</strong> ${team.mentor?.email || 'None'}</p>
        
        <img 
          src="${team?.profilePhoto || '/images/christmas-celebration-concept.jpg'}" 
          alt="Profile photo of ${team.team_name || 'Team Member'}"
          class="w-20 h-20 object-cover rounded-full border border-gray-300 shadow-sm"
        >
      </div>

      <div>
        <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Team Members</h3>
        <ul class="space-y-1 list-disc list-inside text-gray-600 text-sm">
          ${
            team.Students.map(s =>
              `<li>${s.student_name} (${s.register_no}) - ${s.dept} ${s.section} ${s.is_leader ? "<span class='text-blue-600 font-medium'>(Leader)</span>" : ""}</li>`
            ).join('')
          }
        </ul>
      </div>

      <!-- Problem Statement & Selected Idea -->
<div>
  <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Problem Statement & Selected Idea</h3>
  <p><strong>Problem Statement:</strong> ${team.ProblemStatements[0]?.problem_description || 'Not submitted yet'}</p>
  <p><strong>Selected Idea:</strong> ${team.ProblemStatements[0]?.selected_idea || 'Not selected yet'}</p>
</div>

      <div>
        <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Uploads</h3>
        <ul class="space-y-2 text-sm text-gray-700 list-disc list-inside">
          ${
            team.TeamUploads.length > 0
              ? team.TeamUploads.map(u => {
                  const daysPending = Math.floor(
                    (new Date() - new Date(u.uploaded_at)) / (1000 * 60 * 60 * 24)
                  );
                  const isPendingTooLong = u.status !== 'REVIEWED' && daysPending > 2;

                  // ✅ New view/download logic
                  let viewLink = "";
                  if (u.file_url) {
                    viewLink = `<a href="${u.file_url}" class="text-blue-600 underline" target="_blank">File-${u.week_number}</a>`;
                  } else {
                    let dataType = "";
                    if (u.week_number == 3) dataType = "idea";
                    else if (u.week_number == 4) dataType = "swot";
                    else if (u.week_number == 5) dataType = "value";

                    viewLink = `<a href="#" class="text-blue-600 underline view-link" data-week="${u.week_number}" data-type="${dataType}" data-id="${team.UserId}">File-${u.week_number}</a>`;
                  }

                  return `
                    <li>
                      ${viewLink}
                      <span class="text-xs text-gray-500 ml-1">(${new Date(u.uploaded_at).toLocaleString()})</span>
                      ${
                        isPendingTooLong
                          ? `<span class="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Pending > 2 days</span>`
                          : ''
                      }
                      <div class="ml-4 mt-1 text-gray-600">
                        <div>
                          <strong>Status:</strong>
                          <span class="font-medium ${
                            u.status === 'REVIEWED'
                              ? 'text-green-600'
                              : u.status === 'SUBMITTED'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                          }">
                            ${u.status || 'Pending'}
                          </span>
                        </div>
                        <div><strong>Comment:</strong> ${u.review_comment || 'No comment'}</div>
                      </div>

                      <div class="ml-4 mt-2">
                        <textarea 
                          id="admin-comment-${u.id}" 
                          rows="2" 
                          class="w-full p-2 border rounded text-sm"
                          placeholder="Write admin comment..."
                        >${localStorage.getItem("adminComment-" + u.id) || ""}</textarea>

                        <button 
                          class="mt-1 bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 admin-comment-btn"
                          data-upload-id="${u.id}"
                        >
                          Send Comment
                        </button>

                        ${
                          localStorage.getItem("adminComment-" + u.id)
                            ? `<span class="ml-2 text-green-600 text-xs font-medium">(Reviewed by Admin)</span>`
                            : ""
                        }
                      </div>
                    </li>
                  `;
                }).join('')
              : (() => {
                  let fallbackLinks = '';

                  if (team.IdeaSelection) {
                    fallbackLinks += `
                      <a href="#" class="text-blue-600 underline view-link" data-week="3" data-type="idea" data-id="${team.UserId}">View Idea Generation</a>
                    `;
                  }
                  if (team.SwotAnalysis) {
                    fallbackLinks += `
                      <a href="#" class="ml-4 text-blue-600 underline view-link" data-week="4" data-type="swot" data-id="${team.UserId}">View SWOT Analysis</a>
                    `;
                  }
                  if (team.ValueProposition) {
                    fallbackLinks += `
                      <a href="#" class="ml-4 text-blue-600 underline view-link" data-week="5" data-type="value" data-id="${team.UserId}">View Value Proposition</a>
                    `;
                  }

                  if (!fallbackLinks) {
                    fallbackLinks = `<span class="text-gray-600 italic">No data available yet</span>`;
                  }

                  return `<div class="ml-4">${fallbackLinks}</div>`;
                })()
          }
        </ul>
      </div>
    </div>
  `).join('');

  document.getElementById("historyContent").innerHTML = html;
  renderHistoryPaginationControlsFiltered(filteredTeams.length);

  // 🔒 Lock / Unlock handlers
  document.querySelectorAll(".lock-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const teamId = e.target.dataset.teamId;
      await toggleLock(teamId, true);
    });
  });

  document.querySelectorAll(".unlock-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const teamId = e.target.dataset.teamId;
      await toggleLock(teamId, false);
    });
  });

  // 👁️ View link handlers (mentor modal logic)
  document.querySelectorAll(".view-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const dataType = link.getAttribute("data-type");
      const teamId = link.getAttribute("data-id");

      if (dataType === "swot") {
        document.getElementById("swotModal").classList.remove("hidden");
        document.getElementById("swotIframe").src = `swot-admin.html?id=${teamId}&type=swot`;
      } else if (dataType === "idea") {
        document.getElementById("ideaModal").classList.remove("hidden");
        document.getElementById("ideaIframe").src = `idea-admin.html?id=${teamId}&type=idea`;
      } else if (dataType === "value") {
        document.getElementById("valueModal").classList.remove("hidden");
        document.getElementById("valueIframe").src = `value-admin.html?id=${teamId}&type=value`;
      }
    });
  });
}

// 🔐 Lock/unlock API
async function toggleLock(teamId, lock) {
  try {
    const token = localStorage.getItem("token");
    await axios.post(`/admin/teams/${teamId}/${lock ? "lock" : "unlock"}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(`Team ${teamId} ${lock ? "locked" : "unlocked"} successfully`);
  } catch (err) {
    console.error("Error updating lock state:", err);
    alert("Failed to update lock state");
  }
}

// 🧩 Modal close buttons
document.getElementById("closeSwotModal").addEventListener("click", () => {
  document.getElementById("swotModal").classList.add("hidden");
});
document.getElementById("closeIdeaModal").addEventListener("click", () => {
  document.getElementById("ideaModal").classList.add("hidden");
});
document.getElementById("closeValueModal").addEventListener("click", () => {
  document.getElementById("valueModal").classList.add("hidden");
});




document.getElementById("historyContent").addEventListener("click", (e) => {
  if (e.target.classList.contains("admin-comment-btn")) {
    const uploadId = e.target.dataset.uploadId;
    submitAdminComment(uploadId);
  }
});


function renderHistoryPaginationControlsFiltered(totalItems) {
  const totalPages = Math.ceil(totalItems / historyRowsPerPage);
  const container = document.getElementById("historyPaginationControls");

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  const createButton = (text, onClick, disabled = false) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'px-3 py-1 bg-gray-200 rounded mr-1';
    if (disabled) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btn.addEventListener('click', onClick);
    }
    return btn;
  };

  // Prev button
  container.appendChild(
    createButton(
      'Prev',
      () => historyPrevPageFiltered(),
      historyCurrentPage === 1
    )
  );

  // Page info span
  const pageInfo = document.createElement('span');
  pageInfo.className = 'px-3';
  pageInfo.textContent = `Page ${historyCurrentPage} of ${totalPages}`;
  container.appendChild(pageInfo);

  // Next button
  container.appendChild(
    createButton(
      'Next',
      () => historyNextPageFiltered(totalItems),
      historyCurrentPage === totalPages
    )
  );
}



function historyPrevPageFiltered() {
  if (historyCurrentPage > 1) {
    historyCurrentPage--;
    applyHistoryFilters(false); // don't reset to page 1
  }
}

function historyNextPageFiltered(totalItems) {
  const totalPages = Math.ceil(totalItems / historyRowsPerPage);
  if (historyCurrentPage < totalPages) {
    historyCurrentPage++;
    applyHistoryFilters(false); // don't reset to page 1
  }
}


function renderHistoryTable(filteredTeams = historyData) {
  const start = (historyCurrentPage - 1) * historyRowsPerPage;
  const end = start + historyRowsPerPage;
  const paginatedTeams = filteredTeams.slice(start, end);
  console.log(paginatedTeams)

  let html = paginatedTeams.map(team => `
    <div class="bg-white shadow rounded p-6 space-y-4 mb-6">
      <!-- Header: Team info + Lock/Unlock -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-semibold text-blue-700">${team.UserId}</h2>
          <h2 class="text-2xl font-semibold text-blue-700">${team.team_name}</h2>
        </div>
        <div>
          ${
            team.isLocked
              ? `<button class="unlock-btn bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700" data-team-id="${team.UserId}">Unlock</button>`
              : `<button class="lock-btn bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700" data-team-id="${team.UserId}">Lock</button>`
          }
        </div>
      </div>

      <!-- Mentor + Team Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <p><strong>Email:</strong> ${team.email}</p>
        <p><strong>Mentor:</strong> ${team.mentor?.name || 'None'} (${team.mentor?.department || 'N/A'})</p>
        <p><strong>Mentor Email:</strong> ${team.mentor?.email || 'None'}</p>
        
        <img 
          src="${team?.profilePhoto || '/images/christmas-celebration-concept.jpg'}" 
          alt="Profile photo of ${team.team_name || 'Team Member'}"
          class="w-20 h-20 object-cover rounded-full border border-gray-300 shadow-sm"
        >
      </div>

      <!-- Team Members -->
      <div>
        <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Team Members</h3>
        <ul class="space-y-1 list-disc list-inside text-gray-600 text-sm">
          ${
            team.Students.map(s =>
              `<li>${s.student_name} (${s.register_no}) - ${s.dept} ${s.section} ${s.is_leader ? "<span class='text-blue-600 font-medium'>(Leader)</span>" : ""}</li>`
            ).join('')
          }
        </ul>
      </div>

      <!-- Problem Statement & Selected Idea -->
<div>
  <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Problem Statement & Selected Idea</h3>
  <p><strong>Problem Statement:</strong> ${team.ProblemStatements[0]?.problem_description || 'Not submitted yet'}</p>
  <p><strong>Selected Idea:</strong> ${team.ProblemStatements[0]?.selected_idea || 'Not selected yet'}</p>
</div>

      <!-- Uploads -->
      <div>
        <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Uploads</h3>
        <ul class="space-y-2 text-sm text-gray-700 list-disc list-inside">
          ${
            team.TeamUploads.length > 0
              ? team.TeamUploads.map(u => {
                  const daysPending = Math.floor(
                    (new Date() - new Date(u.uploaded_at)) / (1000 * 60 * 60 * 24)
                  );
                  const isPendingTooLong = u.status !== 'REVIEWED' && daysPending > 2;

                  // ✅ Smart View/Download logic
                  let viewLink = "";
                  if (u.file_url) {
                    viewLink = `<a href="${u.file_url}" class="text-blue-600 underline" target="_blank">File-${u.week_number}</a>`;
                  } else {
                    let dataType = "";
                    if (u.week_number == 3) dataType = "idea";
                    else if (u.week_number == 4) dataType = "swot";
                    else if (u.week_number == 5) dataType = "value";

                    viewLink = `<a href="#" class="text-blue-600 underline view-link" data-week="${u.week_number}" data-type="${dataType}" data-id="${team.UserId}">File-${u.week_number}</a>`;
                  }

                  return `
                    <li>
                      ${viewLink}
                      <span class="text-xs text-gray-500 ml-1">(${new Date(u.uploaded_at).toLocaleString()})</span>
                      ${
                        isPendingTooLong
                          ? `<span class="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Pending > 2 days</span>`
                          : ''
                      }
                      <div class="ml-4 mt-1 text-gray-600">
                        <div>
                          <strong>Status:</strong>
                          <span class="font-medium ${
                            u.status === 'REVIEWED'
                              ? 'text-green-600'
                              : u.status === 'SUBMITTED'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                          }">
                            ${u.status || 'Pending'}
                          </span>
                        </div>
                        <div><strong>Comment:</strong> ${u.review_comment || 'No comment'}</div>
                      </div>

                      <div class="ml-4 mt-2">
                        <textarea 
                          id="admin-comment-${u.id}" 
                          rows="2" 
                          class="w-full p-2 border rounded text-sm"
                          placeholder="Write admin comment..."
                        >${localStorage.getItem("adminComment-" + u.id) || ""}</textarea>

                        <button 
                          class="mt-1 bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 admin-comment-btn"
                          data-upload-id="${u.id}"
                        >
                          Send Comment
                        </button>

                        ${
                          localStorage.getItem("adminComment-" + u.id)
                            ? `<span class="ml-2 text-green-600 text-xs font-medium">(Reviewed by Admin)</span>`
                            : ""
                        }
                      </div>
                    </li>
                  `;
                }).join('')
              : (() => {
                  // 🧩 Fallback: show “View” links even when TeamUploads is empty
                  let fallbackLinks = '';

                  if (team.IdeaSelection) {
                    fallbackLinks += `
                      <a href="#" class="text-blue-600 underline view-link" data-week="3" data-type="idea" data-id="${team.UserId}">View Idea Generation</a>
                    `;
                  }
                  if (team.SwotAnalysis) {
                    fallbackLinks += `
                      <a href="#" class="ml-4 text-blue-600 underline view-link" data-week="4" data-type="swot" data-id="${team.UserId}">View SWOT Analysis</a>
                    `;
                  }
                  if (team.ValueProposition) {
                    fallbackLinks += `
                      <a href="#" class="ml-4 text-blue-600 underline view-link" data-week="5" data-type="value" data-id="${team.UserId}">View Value Proposition</a>
                    `;
                  }

                  if (!fallbackLinks) {
                    fallbackLinks = `<span class="text-gray-600 italic">No data available yet</span>`;
                  }

                  return `<div class="ml-4">${fallbackLinks}</div>`;
                })()
          }
        </ul>
      </div>
    </div>
  `).join('');

  // 🧭 Render result
  document.getElementById("historyContent").innerHTML = html;
  renderHistoryPaginationControlsFiltered(filteredTeams.length);

  // 🔒 Lock / Unlock
  document.querySelectorAll(".lock-btn").forEach(btn =>
    btn.addEventListener("click", async (e) => {
      const teamId = e.target.dataset.teamId;
      await toggleLock(teamId, true);
    })
  );

  document.querySelectorAll(".unlock-btn").forEach(btn =>
    btn.addEventListener("click", async (e) => {
      const teamId = e.target.dataset.teamId;
      await toggleLock(teamId, false);
    })
  );

  // 👁️ View Links
  document.querySelectorAll(".view-link").forEach(link =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const dataType = link.getAttribute("data-type");
      const teamId = link.getAttribute("data-id");

      if (dataType === "swot") {
        document.getElementById("swotModal").classList.remove("hidden");
        document.getElementById("swotIframe").src = `swot-admin.html?id=${teamId}&type=swot`;
      } else if (dataType === "idea") {
        document.getElementById("ideaModal").classList.remove("hidden");
        document.getElementById("ideaIframe").src = `idea-admin.html?id=${teamId}&type=idea`;
      } else if (dataType === "value") {
        document.getElementById("valueModal").classList.remove("hidden");
        document.getElementById("valueIframe").src = `value-admin.html?id=${teamId}&type=value`;
      }
    })
  );
}


// Lock/unlock API call
async function toggleLock(teamId, lock) {
  try {
    const token = localStorage.getItem("token");
    await axios.post(`/admin/teams/${teamId}/${lock ? "lock" : "unlock"}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(`Team ${teamId} ${lock ? "locked" : "unlocked"} successfully`);
  } catch (err) {
    console.error("Error updating lock state:", err);
    alert("Failed to update lock state");
  }
}



function renderHistoryPaginationControls() {
  const totalPages = Math.ceil(historyData.length / historyRowsPerPage);
  const container = document.getElementById("historyPaginationControls");
  container.innerHTML = ''; // clear old

  if (historyCurrentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Prev";
    prevBtn.className = "px-3 py-1 bg-gray-200 rounded";
    prevBtn.addEventListener("click", historyPrevPage);
    container.appendChild(prevBtn);
  }

  const span = document.createElement("span");
  span.textContent = `Page ${historyCurrentPage} of ${totalPages}`;
  span.className = "px-3";
  container.appendChild(span);

  if (historyCurrentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "px-3 py-1 bg-gray-200 rounded";
    nextBtn.addEventListener("click", historyNextPage);
    container.appendChild(nextBtn);
  }
}


function historyPrevPage() {
  if (historyCurrentPage > 1) {
    historyCurrentPage--;
    renderHistoryTable();
  }
}

function historyNextPage() {
  const totalPages = Math.ceil(historyData.length / historyRowsPerPage);
  if (historyCurrentPage < totalPages) {
    historyCurrentPage++;
    renderHistoryTable();
  }
}

function renderTeams(teams) {
  const container = document.getElementById("teamsTable");
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = teams.slice(startIndex, startIndex + itemsPerPage);

  container.innerHTML = `
    <table class="min-w-full table-auto border rounded overflow-hidden shadow text-sm text-left">
      <thead class="bg-blue-100">
        <tr>
          <th class="p-3">Team ID</th>
          <th class="p-3">Team Name</th>
          <th class="p-3">Name</th>
          <th class="p-3">Section</th>
          <th class="p-3">Register No</th>
          <th class="p-3">Mobile</th>
          <th class="p-3">Email</th>
          <th class="p-3">Dept</th>
          <th class="p-3">Role</th>
          <th class="p-3">Mentor Name</th>
          <th class="p-3">Mentor Department</th>
          <th class="p-3">Actions</th>
        </tr>
      </thead>
      <tbody id="teamBody" class="bg-white divide-y">
        ${paginatedTeams.map((team) =>
    team.Students?.map((student, i) => `
            <tr>
              <td class="p-3">${i === 0 ? team.UserId : ''}</td>
              <td class="p-3 font-medium text-blue-800">${i === 0 ? team.team_name : ''}</td>
              <td class="p-3">${student.student_name || ''}</td>
              <td class="p-3">${student.section || ''}</td>
              <td class="p-3">${student.register_no || ''}</td>
              <td class="p-3">${i === 0 ? team.mobile : ''}</td>
              <td class="p-3">${i === 0 ? team.email : ''}</td>
              <td class="p-3">${student.dept || ''}</td>
              <td class="p-3">${student.is_leader ? 'TeamLeader' : `Student ${i}`}</td>
              <td class="p-3">${i === 0 ? (team.mentor?.name || 'Unassigned') : ''}</td>
              <td class="p-3">${i === 0 ? (team.mentor?.department || 'N/A') : ''}</td>
              <td class="p-3">
                <button class="edit-btn text-blue-600 hover:underline" data-team-id="${team.UserId}" data-reg="${student.register_no}">Edit</button>
                <button class="delete-btn text-red-600 hover:underline ml-2" data-team-id="${team.UserId}" data-reg="${student.register_no}" data-is-leader="${student.is_leader}">Delete</button>
              </td>
            </tr>
          `).join('')
  ).join('')}
      </tbody>
    </table>
  `;

  renderPaginationControls(teams.length);
  bindActionButtons(); // bind all buttons
}

let currentReassignPage = 1;
const reassignItemsPerPage = 10;

function renderReassignMentorTable() {
  const container = document.getElementById("reassignTableContainer");

  const startIndex = (currentReassignPage - 1) * reassignItemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + reassignItemsPerPage);

  const rows = paginatedTeams.map(team => {
    const leader = team.Students?.find(s => s.is_leader);
    return `
      <tr>
        <td class="p-3">${team.UserId}</td>
        <td class="p-3">${team.team_name}</td>
        <td class="p-3">${leader?.student_name || ''}</td>
        <td class="p-3">${team.email}</td>
        <td class="p-3">${leader?.dept || ''}</td>
        <td class="p-3">${leader?.section || ''}</td>
        <td class="p-3">${team.mobile}</td>
        <td class="p-3">${team.mentor?.name || 'Unassigned'}</td>
        <td class="p-3">${team.mentor?.department || 'N/A'}</td>
        <td class="p-3">
          <select id="reassign-${team.UserId}" class="border rounded px-2 py-1 text-sm">
            <option value="">Select Mentor</option>
            ${allMentors.map(m => `
              <option value="${m.MentorId}" ${team.mentor?.MentorId === m.MentorId ? "selected" : ""}>
                ${m.name} (${m.department})
              </option>
            `).join("")}
          </select>
          <button onclick="reassignMentor('${team.UserId}')" class="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-sm">Reassign</button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="min-w-full table-auto border rounded overflow-hidden shadow text-sm text-left mt-4">
      <thead class="bg-blue-100">
        <tr>
          <th class="p-3">Team ID</th>
          <th class="p-3">Team Name</th>
          <th class="p-3">Leader Name</th>
          <th class="p-3">Email</th>
          <th class="p-3">Dept</th>
          <th class="p-3">Section</th>
          <th class="p-3">Mobile</th>
          <th class="p-3">Mentor</th>
          <th class="p-3">Mentor Dept</th>
          <th class="p-3">Reassign</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div id="reassignPaginationControls" class="mt-4 flex flex-wrap gap-2"></div>
  `;

  renderReassignPaginationControls(filteredTeams.length);
}

function renderReassignPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / reassignItemsPerPage);
  const paginationContainer = document.getElementById("reassignPaginationControls");

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  paginationContainer.innerHTML = '';

  const createButton = (text, page, disabled = false, isActive = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `px-3 py-1 border rounded mr-1 ${isActive ? "bg-blue-500 text-white" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;
    if (!disabled) {
      btn.addEventListener("click", () => {
        currentReassignPage = page;
        renderReassignMentorTable();
      });
    } else {
      btn.disabled = true;
    }
    return btn;
  };

  paginationContainer.appendChild(createButton("Prev", currentReassignPage - 1, currentReassignPage === 1));

  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.appendChild(createButton(i, i, false, currentReassignPage === i));
  }

  paginationContainer.appendChild(createButton("Next", currentReassignPage + 1, currentReassignPage === totalPages));
}




function bindActionButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamId = btn.getAttribute("data-team-id");
      const regNo = btn.getAttribute("data-reg");
      console.log(teamId, regNo)
      editStudent(teamId, regNo);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamId = btn.getAttribute("data-team-id");
      const regNo = btn.getAttribute("data-reg");
      const isLeader = btn.getAttribute("data-is-leader") === "true";
      deleteStudent(teamId, regNo, isLeader);
    });
  });
}

async function deleteStudent(teamId, registerNo, isLeader) {
  if (isLeader) {
    if (!confirm("This is the team leader. Deleting will remove the entire team. Proceed?")) return;
    await axios.delete(`/admin/delete-team/${teamId}`);
  } else {
    if (!confirm("Are you sure you want to delete this student from the team?")) return;
    await axios.delete(`/admin/delete-student/${teamId}/${registerNo}`);
  }
  fetchTeams();
}

async function editStudent(teamId, registerNo) {
  const team = filteredTeams.find(t => t.UserId === teamId);
  if (!team) return alert("Team not found");

  const student = team.Students.find(s =>
    String(s.register_no).trim() === String(registerNo).trim()
  );
  if (!student) return alert("Student not found");
  console.log(student)

  const newName = prompt("Enter new student name:", student.student_name);
  const newSection = prompt("Enter new section:", student.section);
  // const newreg=prompt("Enter new Register No:",student.register_no)
  const newDept = prompt("Enter new department:", student.dept);

  if (newName && newSection && newDept) {
    try {
      await axios.put('/admin/edit-student', {
        teamId,
        registerNo,
        student_name: newName,
        section: newSection,
        dept: newDept
      });
      fetchTeams();
    } catch (err) {
      console.error(err);
      alert("Failed to update student.");
    }
  }
}




function renderPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById("paginationControls");

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  // Clear existing buttons and listeners
  paginationContainer.innerHTML = '';

  const createButton = (text, page, disabled = false, isActive = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `px-3 py-1 border rounded mr-1 ${isActive ? "bg-blue-500 text-white" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;
    if (!disabled) {
      btn.addEventListener("click", () => {
        currentPage = page;
        renderTeams(filteredTeams);
      });
    } else {
      btn.disabled = true;
    }
    return btn;
  };

  // Prev Button
  paginationContainer.appendChild(createButton("Prev", currentPage - 1, currentPage === 1));

  // Page Buttons
  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.appendChild(createButton(i, i, false, currentPage === i));
  }

  // Next Button
  paginationContainer.appendChild(createButton("Next", currentPage + 1, currentPage === totalPages));
}


window.changePage = function (page) {
  currentPage = page;
  renderTeams(filteredTeams); // re-render based on new page
}





function attachFilters() {
  const searchUserId = document.getElementById("searchUserId");
  const searchTeamName = document.getElementById("searchTeamName");
  const searchMentorDept = document.getElementById("searchMentorDept");
  const searchLeaderDept = document.getElementById("searchLeaderDept");
  const searchStudentName = document.getElementById("searchStudentName");

  [searchUserId, searchTeamName, searchMentorDept, searchLeaderDept, searchStudentName].forEach(input => {
    input.addEventListener("input", () => {
      currentPage = 1; // 🔥 Reset to first page
      const userVal = searchUserId.value.toLowerCase();
      const teamVal = searchTeamName.value.toLowerCase();
      const mentorVal = searchMentorDept.value.toLowerCase();
      const leaderVal = searchLeaderDept.value.toLowerCase();
      const studentnameVal = searchStudentName.value.toLowerCase();

      filteredTeams = currentTeams.filter(team =>
        team.UserId.toString().toLowerCase().includes(userVal) &&
        team.team_name.toLowerCase().includes(teamVal) &&
        (team.mentor?.department || "").toLowerCase().includes(mentorVal) &&
        (team.Students?.find(s => s.is_leader)?.dept || "").toLowerCase().includes(leaderVal) &&
        team.Students?.some(s => s.student_name.toLowerCase().includes(studentnameVal))
      );

      renderTeams(filteredTeams);
    });

  });
}

document.getElementById("exportExcel").addEventListener("click", () => {
  console.log(typeof XLSX);

  const rows = [
    ["SNo", "Team ID", "Team Name", "Name", "Register No", "Mobile", "Email", "Dept", "Section", "Role", "Mentor Name"]
  ];

  let idx = 1
  filteredTeams.forEach(team => {
    team.Students?.forEach((student, i) => {
      rows.push([
        i == 0 ? idx++ : "",
        i === 0 ? team.UserId : "",
        i === 0 ? team.team_name : "",
        student.student_name || "",
        student.register_no || "",
        i === 0 ? team.mobile : "",
        i === 0 ? team.email : "",
        student.dept || "",
        student.section || "",
        student.is_leader ? "TeamLeader" : `Team Member ${i}`,
        i === 0 ? (team.mentor?.name || "Unassigned") : "",
      ]);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Teams");

  XLSX.writeFile(workbook, "filtered_teams_export.xlsx");
});


document.getElementById("exportHistoryExcel").addEventListener("click", () => {
  if (!filteredHistory.length) {
    alert("No data to export!");
    return;
  }

  // Find max week number across all teams
  const maxWeek = Math.max(
    0,
    ...filteredHistory.map(t =>
      t.TeamUploads ? t.TeamUploads.map(u => u.week_number || 0) : [0]
    ).flat()
  );

  // ✅ Added Problem Statement + Selected Idea columns
  const headers = [
    "SNo",
    "Team ID",
    "Team Name",
    "Name",
    "Register No",
    "Mobile",
    "Email",
    "Dept",
    "Section",
    "Role",
    "Mentor Name",
    "Mentor Email",
    "Status",
    "Problem Statement",
    "Selected Idea"
  ];

  for (let w = 1; w <= maxWeek; w++) {
    headers.push(`File ${w} Status`, `File ${w} Url`);
  }

  const rows = [headers];
  let idx2 = 1;

  filteredHistory.forEach(team => {
    const studentsSorted = [...(team.Students || [])].sort((a, b) => b.is_leader - a.is_leader);

    studentsSorted.forEach((student, i) => {
      const rowBase = [
        i === 0 ? idx2++ : "",
        i === 0 ? team.UserId : "",
        i === 0 ? team.team_name : "",
        student.student_name || "",
        student.register_no || "",
        i === 0 ? team.mobile : "",
        i === 0 ? team.email : "",
        student.dept || "",
        student.section || "",
        student.is_leader ? "TeamLeader" : `Team Member ${i}`,
        i === 0 ? (team.mentor?.name || "Unassigned") : "",
        i === 0 ? (team.mentor?.email || "Unassigned") : "",
        i === 0 ? (team.TeamUploads?.length ? "Uploaded" : "No Uploads") : "",
        // ✅ New fields — ProblemStatement + Selected Idea
        i === 0 ? (team.ProblemStatements[0]?.problem_description || "Not Submitted") : "",
        i === 0 ? (team.ProblemStatements[0]?.selected_idea || "Not Submitted") : ""
      ];

      if (i === 0) {
        for (let w = 1; w <= maxWeek; w++) {
          const upload = team.TeamUploads?.find(u => Number(u.week_number) === w);
          if (upload) {
            rowBase.push(upload.status || "Uploaded");
            rowBase.push(upload.file_url || "");
          } else {
            rowBase.push("No Upload");
            rowBase.push("");
          }
        }
      } else {
        for (let w = 1; w <= maxWeek; w++) {
          rowBase.push("", ""); // Empty for members
        }
      }

      rows.push(rowBase);
    });
  });

  // Create and export Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "History");
  XLSX.writeFile(wb, "history_export.xlsx");
});








async function fetchMentorsAndTeams() {
  // const [mentorsRes, teamsRes] = await Promise.all([
  //   axios.get('/admin/mentors'),
  //   axios.get('/admin/assigned-teams')
  // ]);

  // allMentors = mentorsRes.data;

  // const mentorSelect = document.getElementById("mentorSelect");
  // const teamSelect = document.getElementById("teamSelect");

  // mentorSelect.innerHTML = `<option value="">Select Mentor</option>`;
  // mentorsRes.data.forEach(m => {
  //   const opt = document.createElement("option");
  //   opt.value = m.MentorId;
  //   opt.textContent = `${m.name} (${m.department})`;
  //   mentorSelect.appendChild(opt);
  // });

  // teamSelect.innerHTML = `<option value="">Select Team</option>`;
  // teamsRes.data.forEach(t => {
  //   const opt = document.createElement("option");
  //   opt.value = t.UserId;
  //   opt.textContent = t.team_name;
  //   teamSelect.appendChild(opt);
  // });
  const mentorsRes = await axios.get('/admin/mentors');
  allMentors = mentorsRes.data;
}


// document.getElementById("assignBtn").addEventListener("click", async () => {
//   const team_id = document.getElementById("teamSelect").value;
//   const mentor_id = document.getElementById("mentorSelect").value;
//   await axios.put('/admin/assign-mentor', { team_id, mentor_id });
//   alert("Mentor assigned successfully");
//   location.reload();
// });

// document.getElementById("historySearch").addEventListener("keypress", async (e) => {
//   if (e.key === 'Enter') {
//     const teamId = e.target.value.trim();
//     const res = await axios.get(`/admin/team-history/${teamId}`);
//     const data = res.data;
//     console.log(data)

//     let html = `<h2 class="text-xl font-bold mb-2">${data.team_name}</h2>`;
//     html += `<p>Email: ${data.email}</p>`;
//     html += `<p>Mentor: ${data.mentor?.name || 'None'} (${data.mentor?.department || 'N/A'})</p>`;
//     html+=`<p>Mentor Email: ${data.mentor?.email || "None"}`;

//     html += `<h3 class="mt-4 font-semibold">Students:</h3><ul class="list-disc ml-6">`;
//     data.Students.forEach(s => {
//       html += `<li>${s.student_name} (${s.register_no}) - ${s.dept} -${s.section} ${s.is_leader ? "(Leader)" : ""} </li>`;
//     });
//     html += '</ul>';

//     html += `<h3 class="mt-4 font-semibold">Uploads:</h3><ul class="list-disc ml-6">`;
//     data.TeamUploads.forEach(u => {
//       html += `<li><a href="${u.file_url}" class="text-blue-600" target="_blank">Week -${u.week_number}</a> (${new Date(u.createdAt).toLocaleString()})</li>`;
//     });
//     html += '</ul>';

//     document.getElementById("historyContent").innerHTML = html;
//   }
// });


// document.getElementById("historySearch").addEventListener("keypress", async (e) => {
//   if (e.key === 'Enter') {
//     const teamId = e.target.value.trim();
//     const res = await axios.get(`/admin/team-history/${teamId}`);
//     const data = res.data;

//     let html = `
//       <div class="bg-white shadow rounded p-6 space-y-4">
//         <h2 class="text-2xl font-semibold text-blue-700">${data.team_name}</h2>

//         <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
//           <p><strong>Email:</strong> ${data.email}</p>
//           <p><strong>Mentor:</strong> ${data.mentor?.name || 'None'} (${data.mentor?.department || 'N/A'})</p>
//           <p><strong>Mentor Email:</strong> ${data.mentor?.email || 'None'}</p>
//         </div>

//         <div>
//           <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Team Members</h3>
//           <ul class="space-y-1 list-disc list-inside text-gray-600 text-sm">
//             ${data.Students.map(s =>
//       `<li>${s.student_name} (${s.register_no}) - ${s.dept} ${s.section} ${s.is_leader ? "<span class='text-blue-600 font-medium'>(Leader)</span>" : ""}</li>`
//     ).join('')}
//           </ul>
//         </div>

//         <div>
//   <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Uploads</h3>
//   <ul class="space-y-2 text-sm text-gray-700 list-disc list-inside">
//     ${data.TeamUploads.map(u => `
//       <li>
//         <a href="${u.file_url}" class="text-blue-600 underline" target="_blank">Week-${u.week_number}</a>
//         <span class="text-xs text-gray-500 ml-1">(${new Date(u.createdAt).toLocaleString()})</span>
//         <div class="ml-4 mt-1 text-gray-600">
//           <div><strong>Status:</strong> <span class="font-medium ${u.status === 'REVIEWED' ? 'text-green-600' : u.status === 'SUBMITTED' ? 'text-red-600' : 'text-yellow-600'}">${u.status || 'Pending'}</span></div>
//           <div><strong>Comment:</strong> ${u.review_comment || 'No comment'}</div>
//         </div>
//       </li>
//     `).join('')}
//   </ul>
// </div>

//       </div>
//     `;

//     document.getElementById("historyContent").innerHTML = html;
//   }
// });

function attachReassignFilters() {
  const teamIdInput = document.getElementById("filterTeamId");
  const teamNameInput = document.getElementById("filterTeamName");
  const leaderNameInput = document.getElementById("filterLeaderName");
  const mentorNameInput = document.getElementById("filterMentorName");

  [teamIdInput, teamNameInput, leaderNameInput, mentorNameInput].forEach(input => {
    input.addEventListener("input", () => {
      const idVal = teamIdInput.value.toLowerCase();
      const nameVal = teamNameInput.value.toLowerCase();
      const leaderVal = leaderNameInput.value.toLowerCase();
      const mentorVal = mentorNameInput.value.toLowerCase();

      const filtered = currentTeams.filter(team =>
        team.UserId.toLowerCase().includes(idVal) &&
        team.team_name.toLowerCase().includes(nameVal) &&
        (team.Students.find(s => s.is_leader)?.student_name || "").toLowerCase().includes(leaderVal) &&
        (team.mentor?.name || "").toLowerCase().includes(mentorVal)
      );

      filteredTeams = filtered;
      currentReassignPage = 1; // reset page when filtering
      renderReassignMentorTable();

    });
  });
}


window.editTeam = async (id) => {
  alert(`Edit functionality for team ${id} not implemented yet.`);
};

window.deleteTeam = async (id) => {
  if (confirm("Are you sure you want to delete this team?")) {
    await axios.delete(`/admin/delete-team/${id}`);
    fetchTeams();
  }
};

window.reassignMentor = async function (teamId) {
  const select = document.getElementById(`reassign-${teamId}`);
  const mentorId = select.value;
  if (!mentorId) return alert("Please select a mentor.");

  try {
    await axios.put('/admin/assign-mentor', {
      team_id: teamId,
      mentor_id: mentorId
    });
    alert("Mentor reassigned successfully.");
    fetchTeams();
  } catch (err) {
    console.error(err);
    alert("Failed to reassign mentor.");
  }
};


function attachTeamsGeneralSearch() {
  const searchInput = document.getElementById("teamsGeneralSearch");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    let filtered = currentTeams.filter(team =>
      JSON.stringify(team).toLowerCase().includes(query)
    );
    currentPage = 1;
    filteredTeams = filtered;
    renderTeams(filteredTeams);
  });
}


// TEAMS GENERAL SEARCH
function attachTeamsGeneralSearch() {
  const searchInput = document.getElementById("teamsGeneralSearch");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    filteredTeams = currentTeams.filter(team =>
      JSON.stringify(team).toLowerCase().includes(query)
    );
    currentPage = 1; // reset pagination
    renderTeams(filteredTeams);
  });
}

// ASSIGN GENERAL SEARCH
function attachAssignGeneralSearch() {
  const searchInput = document.getElementById("assignGeneralSearch");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    filteredAssign = allMentors.filter(assign =>
      JSON.stringify(assign).toLowerCase().includes(query)
    );
    assignCurrentPage = 1;
    renderAssign(filteredAssign);
  });
}

// HISTORY GENERAL SEARCH
function attachHistoryGeneralSearch() {
  const searchInput = document.getElementById("historyGeneralSearch");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    filteredHistory = historyData.filter(record =>
      JSON.stringify(record).toLowerCase().includes(query)
    );
    historyCurrentPage = 1;
    renderHistoryTableFiltered(filteredHistory);
  });
}


document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  window.location.href = "/login.html";
});



try {
  fetchTeams();
  fetchMentorsAndTeams();
  attachReassignFilters()
  attachTeamsGeneralSearch();
  attachAssignGeneralSearch();
  attachHistoryGeneralSearch();
}
catch (err) {
  window.location.href = "/login.html";
  console.error(err);
}

// async function loadTimelineDates() {
//   const token = localStorage.getItem('token');
//   try {
//     const res = await axios.get('/rubrics/deadline/review1', {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     const { start, deadline } = res.data;

//     // Fill inputs
//     if (start) document.getElementById("review1Start").value = new Date(start).toISOString().slice(0, 16);
//     if (deadline) document.getElementById("review1Deadline").value = new Date(deadline).toISOString().slice(0, 16);

//     // Show display
//     if (start || deadline) {
//       document.getElementById("currentTimeline").classList.remove("hidden");
//       document.getElementById("currentStart").textContent = new Date(start).toLocaleString();
//       document.getElementById("currentEnd").textContent = new Date(deadline).toLocaleString();
//     }
//   } catch (err) {
//     console.error("Failed to load review1 deadline:", err);
//   }
// }


// document.getElementById("saveReview1").addEventListener("click", async () => {
//   const token = localStorage.getItem("token");
//   const startDate = document.getElementById("review1Start").value;
//   const deadline = document.getElementById("review1Deadline").value;

//   if (!startDate || !deadline) {
//     return alert("Please enter both start and deadline.");
//   }

//   try {
//     await axios.post("/rubrics/deadline/review1",
//       { start: startDate, deadline: deadline },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     alert("Timeline saved successfully!");
//     loadTimelineDates(); // refresh display
//   } catch (err) {
//     console.error("Failed to save timeline:", err);
//     alert("Failed to save timeline.");
//   }
// });


// Define all stages
const stages = [
  { key: "review1", label: "Review 1" },
  { key: "problem", label: "Problem Statement" },
  { key: "swot", label: "SWOT Analysis" },
  { key: "value", label: "Value Proposition" },
  { key: "review2", label: "Review 2" }
];

// Dynamically render sections
function renderTimelineSections() {
  const container = document.getElementById("timelineSections");
  container.innerHTML = "";

  stages.forEach(({ key, label }) => {
    container.innerHTML += `
      <div class="p-4 bg-white rounded shadow">
        <h3 class="text-md font-semibold mb-4">⏳ ${label} Timeline</h3>

        <div class="space-y-4">
          <div>
            <label class="block font-medium text-gray-700">Start Date</label>
            <input type="datetime-local" id="${key}Start" class="p-2 border rounded shadow-sm w-full max-w-sm" data-stage="${key}">
          </div>
          <div>
            <label class="block font-medium text-gray-700">Deadline</label>
            <input type="datetime-local" id="${key}Deadline" class="p-2 border rounded shadow-sm w-full max-w-sm" data-stage="${key}">
          </div>
          <button class="saveTimeline bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow" data-stage="${key}">
            💾 Save ${label}
          </button>
        </div>

        <!-- Current timeline display -->
        <div id="${key}CurrentTimeline" class="mt-4 p-3 bg-gray-50 rounded hidden">
          <p><strong>Start:</strong> <span id="${key}CurrentStart">-</span></p>
          <p><strong>Deadline:</strong> <span id="${key}CurrentEnd">-</span></p>
        </div>
      </div>
    `;
  });
}

// Load deadlines for all stages
async function loadAllTimelineDates() {
  const token = localStorage.getItem("token");
  for (let { key } of stages) {
    try {
      const res = await axios.get(`/rubrics/deadline/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { start, deadline } = res.data;

      if (start) document.getElementById(`${key}Start`).value = new Date(start).toISOString().slice(0, 16);
      if (deadline) document.getElementById(`${key}Deadline`).value = new Date(deadline).toISOString().slice(0, 16);

      if (start || deadline) {
        document.getElementById(`${key}CurrentTimeline`).classList.remove("hidden");
        document.getElementById(`${key}CurrentStart`).textContent = start ? new Date(start).toLocaleString() : "-";
        document.getElementById(`${key}CurrentEnd`).textContent = deadline ? new Date(deadline).toLocaleString() : "-";
      }
    } catch (err) {
      console.error(`Failed to load ${key} deadline:`, err);
    }
  }
}

// Save handler
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("saveTimeline")) {
    const stage = e.target.dataset.stage;
    const token = localStorage.getItem("token");
    const startDate = document.getElementById(`${stage}Start`).value;
    const deadline = document.getElementById(`${stage}Deadline`).value;

    if (!startDate || !deadline) {
      return alert("Please enter both start and deadline.");
    }

    try {
      await axios.post(`/rubrics/deadline/${stage}`,
        { start: startDate, deadline: deadline },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${stage} timeline saved successfully!`);
      loadAllTimelineDates(); // refresh
    } catch (err) {
      console.error(`Failed to save ${stage} timeline:`, err);
      alert("Failed to save timeline.");
    }
  }
});


async function submitAdminComment(uploadId) {
  const textarea = document.getElementById(`admin-comment-${uploadId}`);
  const comment = textarea.value.trim();

  if (!comment) {
    alert("Please enter a comment before sending.");
    return;
  }

  try {
    const response = await fetch(`/admin/uploads/${uploadId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ review_comment: comment })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to send comment");
    }

    // Save comment in localStorage
    localStorage.setItem("adminComment-" + uploadId, comment);

    alert("Comment mailed successfully ✅");

    // Re-render so "Reviewed by Admin" shows
    fetchAllTeamHistories() // re-fetch and re-render
  } catch (error) {
    console.error(error);
    alert("Error sending comment ❌");
  }
}


// Initialize timelines on page load
renderTimelineSections();
loadAllTimelineDates();



