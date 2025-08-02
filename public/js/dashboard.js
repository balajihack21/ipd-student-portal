window.onload = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { teamName, mobile, students = [], mentor = {}, progress = 0 } = res.data;
    document.getElementById("teamName").textContent = `${teamName}`;
    document.getElementById("contactNo").textContent = ` ${mobile}`;

    // Populate students
    const studentCards = document.getElementById("studentCards");
    students.forEach(s => {
      const div = document.createElement("div");
      div.className = "student";
      div.innerHTML = `
        <strong>${s.student_name}</strong>${s.is_leader ? ' 🧑‍💼' : ''}<br>
        ${s.register_no}<br>
        ${s.dept} - ${s.section}
      `;
      studentCards.appendChild(div);
    });

    // // Mentor
    console.log(mentor)
    document.getElementById("mentorName").innerHTML = `${mentor.title}${mentor.name}<br> ${mentor.designation} - ${mentor.department}<br> ${mentor.email}`;

    await loadUploadHistory();


    // // Progress
    // document.getElementById("progressFill").style.width = `${progress}%`;
    // document.getElementById("progressFill").textContent = `${progress}%`;

  } catch (err) {
    alert("Error loading dashboard");
    console.error(err);
  }
};


async function loadUploadHistory() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/upload-history", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const uploadDiv = document.getElementById("uploadHistory");
    uploadDiv.innerHTML = ""; // clear previous

    console.log(res)

    res.data.forEach(upload => {
      const item = document.createElement("div");
      const date = new Date(upload.updatedAt).toLocaleString();
      item.innerHTML = `
        <div class="bg-gray-100 p-3 rounded shadow-sm flex justify-between items-center">
          <div>
            <strong>Week ${upload.week_number}</strong><br>
            <span class="text-xs text-gray-500">${date}</span>
          </div>
          <a href="${upload.file_url}" target="_blank" class="text-blue-500 underline">View</a>

        </div>
      `;
      uploadDiv.appendChild(item);
    });


  } catch (err) {
    console.error("Error loading upload history", err);
  }
}

document.getElementById("logout").addEventListener("click", (e) => {
  e.preventDefault()
  localStorage.removeItem('token');
  window.location.href = "/login.html";
})

// Toggle sidebar
document.getElementById('toggleSidebar').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('-translate-x-full');
});

// Active menu highlight
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    menuItems.forEach(i => i.classList.remove('text-blue-600', 'font-bold', 'active'));
    item.classList.add('text-blue-600', 'font-bold', 'active');
  });
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const weekNumber = document.getElementById("weekNumber").value;
  const file = fileInput.files[0];

  if (!file || !weekNumber) return alert("All fields required!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("week_number", weekNumber);

  const token = localStorage.getItem("token");
  const progressBar = document.getElementById("uploadProgressBar");
  progressBar.style.width = "0%";
  progressBar.textContent = "0%";

  try {
    const res = await axios.post("/api/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        progressBar.style.width = `${percentCompleted}%`;
        progressBar.textContent = `${percentCompleted}%`;
      },
    });

    document.getElementById("uploadStatus").textContent = "Uploaded successfully!";
    progressBar.style.backgroundColor = "#16a34a"; // green on success
    alert("Uploaded Successfully!!")
    console.log("Cloudinary URL:", res.data.url);

    setTimeout(() => {
      progressBar.style.width = "0%";
      progressBar.textContent = "0%";
      progressBar.style.backgroundColor = "#3b82f6"; // reset to default blue or whatever your original color is
    }, 1000);

    await loadUploadHistory(); // refresh uploads
  } catch (err) {
    document.getElementById("uploadStatus").textContent = "Upload failed!";
    progressBar.style.backgroundColor = "#dc2626"; // red on error
    console.error(err);
  }
});





// Upload file
// document.getElementById("uploadForm").addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const fileInput = document.getElementById("fileInput");
//   const file = fileInput.files[0];
//   if (!file) return;

//   const formData = new FormData();
//   formData.append("file", file);

//   const token = localStorage.getItem("token");

//   try {
//     const res = await axios.post("/api/upload", formData, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "multipart/form-data"
//       },
//     });

//     document.getElementById("uploadStatus").textContent = "Uploaded successfully!";
//   } catch (err) {
//     document.getElementById("uploadStatus").textContent = "Upload failed.";
//     console.error(err);
//   }
// });

// Load Template Files (static list or fetched from server)
const templates = [
  { name: "Affinity Diagram", file: "Affinity Diagram.docx" },
  { name: "Problem Statement Canvas_ACT", file: "Problem Statement Canvas_ACT.docx" }
];

function loadTemplateFiles() {
  const list = document.getElementById('templateList');
  templates.forEach(tpl => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `/templates/${tpl.file}`;
    a.textContent = tpl.name;
    a.className = "hover:underline";
    a.target = "_blank";
    li.appendChild(a);
    list.appendChild(li);
  });
}

loadTemplateFiles();


document.getElementById('editProfileBtn').addEventListener('click', () => {
  document.getElementById('editModal').classList.remove('hidden');

  // Fill existing values (you might have them in JS already)
  const teamName = document.getElementById('teamName').textContent;
  const mobile = document.getElementById('contactNo').textContent; // or fetch from API
  document.getElementById('editTeamName').value = teamName;
  document.getElementById('editMobile').value = mobile;
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('editModal').classList.add('hidden');
});

document.getElementById('editForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const teamName = document.getElementById('editTeamName').value.trim();
  const mobile = document.getElementById('editMobile').value.trim();
  const updateMsg = document.getElementById('updateMsg');

  try {
    const token = localStorage.getItem("token");
    const res = await axios.put('/api/profile', {
      team_name: teamName,
      mobile
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    updateMsg.textContent = "Profile updated successfully!";
    updateMsg.classList.remove("text-red-500");
    updateMsg.classList.add("text-green-500");

    // update UI
    document.getElementById('teamName').textContent = teamName;
    document.getElementById("contactNo").textContent = mobile;

    setTimeout(() => {
      document.getElementById('editModal').classList.add('hidden');
    }, 1000);
  } catch (err) {
    updateMsg.textContent = err.response?.data?.message || "Failed to update profile.";
    updateMsg.classList.remove("text-green-500");
    updateMsg.classList.add("text-red-500");
  }
});

// document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const teamName = document.getElementById("editTeamName").value.trim();
//   const mobile = document.getElementById("editMobile").value.trim();

//   const token = localStorage.getItem("token");

//   try {
//     const res = await axios.put("/api/profile", { team_name: teamName, mobile }, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     document.getElementById("editStatus").textContent = "Profile updated successfully!";
//     document.getElementById("editStatus").style.color = "green";

//     // Optionally refresh part of UI
//     document.getElementById("teamName").textContent = `${teamName}`;
//   } catch (err) {
//     console.error(err);
//     document.getElementById("editStatus").textContent = "Failed to update profile.";
//     document.getElementById("editStatus").style.color = "red";
//   }
// });



