const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active", "border-b-2", "border-blue-500"));
    contents.forEach(c => c.classList.add("hidden"));
    tab.classList.add("active", "border-b-2", "border-blue-500");
    document.getElementById(tab.dataset.tab).classList.remove("hidden");

    if (tab.dataset.tab === "assignTab") {
      renderReassignMentorTable();
    }
    if (tab.dataset.tab === "historyTab") {

      fetchAllTeamHistories();
    }


  });
});

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
    filteredHistory =[...historyData];
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

function applyHistoryFilters() {
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
    const matchesStatus = statusVal === "" || team.TeamUploads.some(u => (u.status || "").toLowerCase() === statusVal);

    return matchesUploadStatus && matchesId && matchesName && matchesMentor && matchesLeaderDept && matchesStatus;
  });

  // Reset pagination and re-render
  historyCurrentPage = 1;
  renderHistoryTableFiltered(filteredHistory);
}


// render filtered instead of all
function renderHistoryTableFiltered(filteredTeams) {

  const start = (historyCurrentPage - 1) * historyRowsPerPage;
  const end = start + historyRowsPerPage;
  const paginatedTeams = filteredTeams.slice(start, end);

  let html = paginatedTeams.map(team => `
    <div class="bg-white shadow rounded p-6 space-y-4 mb-6">
      <h2 class="text-2xl font-semibold text-blue-700">${team.UserId}</h2>
      <h2 class="text-2xl font-semibold text-blue-700">${team.team_name}</h2>
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
          ${team.Students.map(s =>
    `<li>${s.student_name} (${s.register_no}) - ${s.dept} ${s.section} ${s.is_leader ? "<span class='text-blue-600 font-medium'>(Leader)</span>" : ""}</li>`
  ).join('')}
        </ul>
      </div>
      <div>
  <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Uploads</h3>
  <ul class="space-y-2 text-sm text-gray-700 list-disc list-inside">
    ${team.TeamUploads.map(u => {
    const daysPending = Math.floor(
      (new Date() - new Date(u.uploaded_at)) / (1000 * 60 * 60 * 24)
    );
    const isPendingTooLong =
      u.status !== 'REVIEWED' && daysPending > 2;

    return `
        <li>
          <a href="${u.file_url}" class="text-blue-600 underline" target="_blank">Week-${u.week_number}</a>
          <span class="text-xs text-gray-500 ml-1">(${new Date(u.uploaded_at).toLocaleString()})</span>
          ${isPendingTooLong
        ? `<span class="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Pending > 2 days</span>`
        : ''}
          <div class="ml-4 mt-1 text-gray-600">
            <div>
              <strong>Status:</strong>
              <span class="font-medium ${u.status === 'REVIEWED'
        ? 'text-green-600'
        : u.status === 'SUBMITTED'
          ? 'text-red-600'
          : 'text-yellow-600'}">
                ${u.status || 'Pending'}
              </span>
            </div>
            <div><strong>Comment:</strong> ${u.review_comment || 'No comment'}</div>
          </div>
        </li>
      `;
  }).join('')}
  </ul>
</div>

    </div>
  `).join('');

  document.getElementById("historyContent").innerHTML = html;
  renderHistoryPaginationControlsFiltered(filteredTeams.length);
}

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
    applyHistoryFilters();
  }
}

function historyNextPageFiltered(totalItems) {
  const totalPages = Math.ceil(totalItems / historyRowsPerPage);
  if (historyCurrentPage < totalPages) {
    historyCurrentPage++;
    applyHistoryFilters();
  }
}

function renderHistoryTable() {
  const start = (historyCurrentPage - 1) * historyRowsPerPage;
  const end = start + historyRowsPerPage;
  const paginatedTeams = historyData.slice(start, end);

  let html = paginatedTeams.map(team => `
    <div class="bg-white shadow rounded p-6 space-y-4 mb-6">
    <h2 class="text-2xl font-semibold text-blue-700">${team.UserId}</h2>
      <h2 class="text-2xl font-semibold text-blue-700">${team.team_name}</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 items-center">
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
          ${team.Students.map(s =>
    `<li>${s.student_name} (${s.register_no}) - ${s.dept} ${s.section} ${s.is_leader ? "<span class='text-blue-600 font-medium'>(Leader)</span>" : ""}</li>`
  ).join('')}
        </ul>
      </div>

      <div>
  <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Uploads</h3>
  <ul class="space-y-2 text-sm text-gray-700 list-disc list-inside">
    ${team.TeamUploads.map(u => {
    const daysPending = Math.floor(
      (new Date() - new Date(u.uploaded_at)) / (1000 * 60 * 60 * 24)
    );
    const isPendingTooLong =
      u.status !== 'REVIEWED' && daysPending > 2;

    return `
        <li>
          <a href="${u.file_url}" class="text-blue-600 underline" target="_blank">Week-${u.week_number}</a>
          <span class="text-xs text-gray-500 ml-1">(${new Date(u.uploaded_at).toLocaleString()})</span>
          ${isPendingTooLong
        ? `<span class="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Pending > 2 days</span>`
        : ''}
          <div class="ml-4 mt-1 text-gray-600">
            <div>
              <strong>Status:</strong>
              <span class="font-medium ${u.status === 'REVIEWED'
        ? 'text-green-600'
        : u.status === 'SUBMITTED'
          ? 'text-red-600'
          : 'text-yellow-600'}">
                ${u.status || 'Pending'}
              </span>
            </div>
            <div><strong>Comment:</strong> ${u.review_comment || 'No comment'}</div>
          </div>
        </li>
      `;
  }).join('')}
  </ul>
</div>
    </div>
  `).join('');

  document.getElementById("historyContent").innerHTML = html;
  renderHistoryPaginationControls();
}

function renderHistoryPaginationControls() {
  const totalPages = Math.ceil(historyData.length / historyRowsPerPage);
  let buttons = '';

  if (historyCurrentPage > 1) {
    buttons += `<button onclick="historyPrevPage()" class="px-3 py-1 bg-gray-200 rounded">Prev</button>`;
  }

  buttons += `<span class="px-3">Page ${historyCurrentPage} of ${totalPages}</span>`;

  if (historyCurrentPage < totalPages) {
    buttons += `<button onclick="historyNextPage()" class="px-3 py-1 bg-gray-200 rounded">Next</button>`;
  }

  document.getElementById("historyPaginationControls").innerHTML = buttons;
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
    ["Team ID", "Team Name", "Name", "Register No", "Mobile", "Email", "Dept","Section", "Role", "Mentor Name"]
  ];

  filteredTeams.forEach(team => {
    team.Students?.forEach((student, i) => {
      rows.push([
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

  const headers = [
    "Team ID", "Team Name", "Name", "Register No", "Mobile", "Email", "Dept", "Section", "Role",
    "Mentor Name","Status"
  ];

  for (let w = 1; w <= maxWeek; w++) {
    headers.push(`Week ${w}`);
  }

  const rows = [headers];

  filteredHistory.forEach(team => {
    // Sort students so leader comes first
    const studentsSorted = [...(team.Students || [])].sort((a, b) => b.is_leader - a.is_leader);

    studentsSorted.forEach((student, i) => {
      const rowBase = [
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
      ];

      // Week columns
      if (i === 0) {
        if (team.TeamUploads && team.TeamUploads.length > 0) {
          for (let w = 1; w <= maxWeek; w++) {
            const upload = team.TeamUploads.find(u => u.week_number === w);
            rowBase.push(upload.status);
             rowBase.push(upload ? upload.file_url : "");
          }
        } else {
          // No uploads → Week 1 = "No uploads", rest blank
          rowBase.push("No uploads");
          for (let w = 2; w <= maxWeek; w++) {
            rowBase.push("");
          }
        }
      } else {
        // Other students get empty week columns
        for (let w = 1; w <= maxWeek; w++) {
          rowBase.push("");
        }
      }

      rows.push(rowBase);
    });
  });

  // Create XLSX
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
