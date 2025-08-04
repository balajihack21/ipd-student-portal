const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active", "border-b-2", "border-blue-500"));
    contents.forEach(c => c.classList.add("hidden"));
    tab.classList.add("active", "border-b-2", "border-blue-500");
    document.getElementById(tab.dataset.tab).classList.remove("hidden");
  });
});

let currentTeams = [];
let filteredTeams = [];

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


function renderTeams(teams) {
  const container = document.getElementById("teamsTable");
  const paginationContainer = document.getElementById("paginationControls");
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = teams.slice(startIndex, startIndex + itemsPerPage);

  container.innerHTML = `
    <table id="teamsTableData" class="min-w-full table-auto border rounded overflow-hidden shadow text-sm text-left">
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
                ${i === 0 ? `
                  <button onclick="editTeam('${team.id}')" class="text-blue-600 hover:underline">Edit</button>
                  <button onclick="deleteTeam('${team.id}')" class="text-red-600 hover:underline ml-2">Delete</button>
                ` : ''}
              </td>
            </tr>
          `).join('')
        ).join('')}
      </tbody>
    </table>
  `;

  renderPaginationControls(teams.length);
}
function renderPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById("paginationControls");

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let buttons = `
    <button class="px-3 py-1 border rounded mr-1 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `
      <button class="px-3 py-1 border rounded mr-1 ${currentPage === i ? 'bg-blue-500 text-white' : ''}" onclick="changePage(${i})">${i}</button>
    `;
  }

  buttons += `
    <button class="px-3 py-1 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>
  `;

  paginationContainer.innerHTML = buttons;
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
  const searchStudentName=document.getElementById("searchStudentName");

  [searchUserId, searchTeamName, searchMentorDept, searchLeaderDept,searchStudentName].forEach(input => {
    input.addEventListener("input", () => {
      const userVal = searchUserId.value.toLowerCase();
      const teamVal = searchTeamName.value.toLowerCase();
      const mentorVal = searchMentorDept.value.toLowerCase();
      const leaderVal = searchLeaderDept.value.toLowerCase();
      const studentnameVal=searchStudentName.value.toLowerCase();

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
  const table = document.getElementById("teamsTableData");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Teams" });
  XLSX.writeFile(wb, "filtered_teams_export.xlsx");
});

async function fetchMentorsAndTeams() {
  const [mentorsRes, teamsRes] = await Promise.all([
    axios.get('/admin/mentors'),
    axios.get('/admin/assigned-teams')
  ]);
  const mentorSelect = document.getElementById("mentorSelect");
  const teamSelect = document.getElementById("teamSelect");

  mentorsRes.data.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.MentorId;
    opt.textContent = `${m.name} (${m.department})`;
    mentorSelect.appendChild(opt);
  });

  teamsRes.data.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.UserId;
    opt.textContent = t.team_name;
    teamSelect.appendChild(opt);
  });
}

document.getElementById("assignBtn").addEventListener("click", async () => {
  const team_id = document.getElementById("teamSelect").value;
  const mentor_id = document.getElementById("mentorSelect").value;
  await axios.put('/admin/assign-mentor', { team_id, mentor_id });
  alert("Mentor assigned successfully");
  location.reload();
});

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

document.getElementById("historySearch").addEventListener("keypress", async (e) => {
  if (e.key === 'Enter') {
    const teamId = e.target.value.trim();
    const res = await axios.get(`/admin/team-history/${teamId}`);
    const data = res.data;

    let html = `
      <div class="bg-white shadow rounded p-6 space-y-4">
        <h2 class="text-2xl font-semibold text-blue-700">${data.team_name}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Mentor:</strong> ${data.mentor?.name || 'None'} (${data.mentor?.department || 'N/A'})</p>
          <p><strong>Mentor Email:</strong> ${data.mentor?.email || 'None'}</p>
        </div>

        <div>
          <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Team Members</h3>
          <ul class="space-y-1 list-disc list-inside text-gray-600 text-sm">
            ${data.Students.map(s =>
              `<li>${s.student_name} (${s.register_no}) - ${s.dept} ${s.section} ${s.is_leader ? "<span class='text-blue-600 font-medium'>(Leader)</span>" : ""}</li>`
            ).join('')}
          </ul>
        </div>

        <div>
  <h3 class="text-lg font-medium text-gray-800 border-b pb-1 mb-2">Uploads</h3>
  <ul class="space-y-2 text-sm text-gray-700 list-disc list-inside">
    ${data.TeamUploads.map(u => `
      <li>
        <a href="${u.file_url}" class="text-blue-600 underline" target="_blank">Week-${u.week_number}</a>
        <span class="text-xs text-gray-500 ml-1">(${new Date(u.createdAt).toLocaleString()})</span>
        <div class="ml-4 mt-1 text-gray-600">
          <div><strong>Status:</strong> <span class="font-medium ${u.status === 'REVIEWED' ? 'text-green-600' : u.status === 'SUBMITTED' ? 'text-red-600' : 'text-yellow-600'}">${u.status || 'Pending'}</span></div>
          <div><strong>Comment:</strong> ${u.review_comment || 'No comment'}</div>
        </div>
      </li>
    `).join('')}
  </ul>
</div>

      </div>
    `;

    document.getElementById("historyContent").innerHTML = html;
  }
});

window.editTeam = async (id) => {
  alert(`Edit functionality for team ${id} not implemented yet.`);
};

window.deleteTeam = async (id) => {
  if (confirm("Are you sure you want to delete this team?")) {
    await axios.delete(`/admin/delete-team/${id}`);
    fetchTeams();
  }
};

fetchTeams();
fetchMentorsAndTeams();
