window.onload = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { teamName, mobile, students = [], mentor = {}, progress = 0 ,profilePhoto} = res.data;
    document.getElementById("teamName").textContent = `${teamName}`;
    document.getElementById("contactNo").textContent = ` ${mobile}`;
    

    if (profilePhoto) {
  document.getElementById("profilePhoto").src = profilePhoto;
}

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
   
    document.getElementById("mentorName").innerHTML = `${mentor.title}${mentor.name}<br> ${mentor.designation} - ${mentor.department}<br> ${mentor.email}`;

    await loadUploadHistory();


    // // Progress
    // document.getElementById("progressFill").style.width = `${progress}%`;
    // document.getElementById("progressFill").textContent = `${progress}%`;

  } catch (err) {
    // alert("Error loading dashboard");
     window.location.href = "/login.html";
    console.error(err);
  }
};


// async function loadUploadHistory() {
//   try {
//     const token = localStorage.getItem("token");
//     const res = await axios.get("/api/upload-history", {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     const uploadDiv = document.getElementById("uploadHistory");
//     uploadDiv.innerHTML = ""; // clear previous

//     console.log(res)

//     res.data.forEach(upload => {
//       const item = document.createElement("div");
//       const date = new Date(upload.updatedAt).toLocaleString();
//       item.innerHTML = `
//         <div class="bg-gray-100 p-3 rounded shadow-sm flex justify-between items-center">
//           <div>
//             <strong>Week ${upload.week_number}</strong><br>
//             <span class="text-xs text-gray-500">${date}</span>
//           </div>
//           <a href="${upload.file_url}" target="_blank" class="text-blue-500 underline">View</a>

//         </div>
//       `;
//       uploadDiv.appendChild(item);
//     });


//   } catch (err) {
//     console.error("Error loading upload history", err);
//   }
// }

async function loadUploadHistory() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/upload-history", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const uploadDiv = document.getElementById("uploadHistory");
    uploadDiv.innerHTML = ""; // Clear previous entries

    res.data.forEach(upload => {
      const item = document.createElement("div");
      const date = new Date(upload.updatedAt).toLocaleString();
      const statusColor = upload.status === 'Approved' ? 'text-green-600'
                         : upload.status === 'Rejected' ? 'text-red-600'
                         : 'text-yellow-600';

      item.innerHTML = `
        <div class="bg-gray-100 p-3 rounded shadow-sm mb-3">
          <div class="flex justify-between items-center">
            <div>
              <strong>File ${upload.week_number}</strong><br>
              <span class="text-xs text-gray-500">${date}</span>
            </div>
            <a href="${upload.file_url}" target="_blank" class="text-blue-500 underline">View</a>
          </div>
          <div class="mt-2 ml-1 text-sm text-gray-700">
            <div><strong>Status:</strong> <span class="font-medium ${upload.status === 'REVIEWED' ? 'text-green-600' : upload.status === 'SUBMITTED' ? 'text-red-600' : 'text-yellow-600'}">${upload.status || 'Pending'}</span></div>
            <div><strong>Comment:</strong> ${upload.review_comment || 'No comment yet'}</div>
          </div>
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

// document.getElementById("uploadForm").addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const fileInput = document.getElementById("fileInput");
//   const weekNumber = parseInt(document.getElementById("weekNumber").value, 10);
//   const file = fileInput.files[0];

//   // Validation for empty fields
//   if (!file || !weekNumber) {
//     return alert("All fields required!");
//   }

//   // Restrict to only week 1 and week 2
//   if (![1, 2].includes(weekNumber)) {
//     return alert("You can only upload for Week 1 or Week 2.");
//   }

//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("week_number", weekNumber);

//   const token = localStorage.getItem("token");
//   const progressBar = document.getElementById("uploadProgressBar");
//   progressBar.style.width = "0%";
//   progressBar.textContent = "0%";

//   try {
//     const res = await axios.post("/api/upload", formData, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "multipart/form-data",
//       },
//       onUploadProgress: (progressEvent) => {
//         const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//         progressBar.style.width = `${percentCompleted}%`;
//         progressBar.textContent = `${percentCompleted}%`;
//       },
//     });

//     document.getElementById("uploadStatus").textContent = "Uploaded successfully!";
//     progressBar.style.backgroundColor = "#16a34a"; // green on success
//     alert("Uploaded Successfully!!");
//     console.log("Cloudinary URL:", res.data.url);

//     setTimeout(() => {
//       progressBar.style.width = "0%";
//       progressBar.textContent = "0%";
//       progressBar.style.backgroundColor = "#3b82f6"; // reset
//     }, 1000);

//     await loadUploadHistory();
//   } catch (err) {
//     document.getElementById("uploadStatus").textContent = "Upload failed!";
//     progressBar.style.backgroundColor = "#dc2626"; // red on error
//     console.error(err);
//   }
// });


// document.getElementById("uploadForm").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const files = document.getElementById("fileInput").files;
//   if (files.length !== 2) {
//     return alert("Please select exactly 2 files!");
//   }

//   const token = localStorage.getItem("token");
//   const progressBar = document.getElementById("uploadProgressBar");
//   progressBar.style.width = "0%";
//   progressBar.textContent = "0%";
//   progressBar.style.backgroundColor = "#3b82f6"; // reset to blue

//   try {
//     let totalUploaded = 0;
//     let totalSize = files[0].size + files[1].size;

//     // Upload both files sequentially
//     for (let i = 0; i < 2; i++) {
//       const formData = new FormData();
//       formData.append("file", files[i]);
//       formData.append("week_number", i + 1);

//       await axios.post("/api/upload", formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//         onUploadProgress: (progressEvent) => {
//           totalUploaded += progressEvent.loaded;
//           const percentCompleted = Math.round((totalUploaded / totalSize) * 100);
//           progressBar.style.width = `${percentCompleted}%`;
//           progressBar.textContent = `${percentCompleted}%`;
//         },
//       });
//     }

//     document.getElementById("uploadStatus").textContent = "Both files uploaded successfully!";
//     progressBar.style.backgroundColor = "#16a34a"; // green
//     alert("Both files uploaded successfully!!");

//     setTimeout(() => {
//       progressBar.style.width = "0%";
//       progressBar.textContent = "0%";
//       progressBar.style.backgroundColor = "#3b82f6"; // reset to blue
//     }, 2000);

//     await loadUploadHistory();
//   } catch (err) {
//     document.getElementById("uploadStatus").textContent = "Upload failed!";
//     progressBar.style.backgroundColor = "#dc2626"; // red
//     console.error(err);
//   }
// });
async function handleUpload(formId, fileId, progressId, statusId, weekNumber) {
  document.getElementById(formId).addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = document.getElementById(fileId).files[0];
    if (!file) return alert("Please select a file!");

    const token = localStorage.getItem("token");
    const progressBar = document.getElementById(progressId);
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    progressBar.style.backgroundColor = "#3b82f6"; // reset to blue

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("week_number", weekNumber); // 👈 keep schema intact

      await axios.post("/api/upload/none", formData, {
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

      document.getElementById(statusId).textContent = "Uploaded successfully!";
      progressBar.style.backgroundColor = "#16a34a"; // green
      
          setTimeout(() => {
      progressBar.style.width = "0%";
      progressBar.textContent = "0%";
      progressBar.style.backgroundColor = "#3b82f6"; // reset to blue
    }, 2000);

    alert("File Uploaded Successfully")
    await loadUploadHistory();
    } catch (err) {
      document.getElementById(statusId).textContent = "Upload failed!";
      progressBar.style.backgroundColor = "#dc2626"; // red
      console.error(err);
    }
  });
}

// Attach upload handlers (Week 1 for Problem, Week 2 for Affinity)
handleUpload("problemForm", "problemFile", "problemProgress", "problemStatus", 1);
handleUpload("affinityForm", "affinityFile", "affinityProgress", "affinityStatus", 2);





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


// document.getElementById('editProfileBtn').addEventListener('click', () => {
//   document.getElementById('editModal').classList.remove('hidden');

//   // Fill existing values (you might have them in JS already)
//   // const teamName = document.getElementById('teamName').textContent;
//   const mobile = document.getElementById('contactNo').textContent; // or fetch from API
//   // document.getElementById('editTeamName').value = teamName;
//   document.getElementById('editMobile').value = mobile;
// });

// document.getElementById('cancelBtn').addEventListener('click', () => {
//   document.getElementById('editModal').classList.add('hidden');
// });

// document.getElementById('editForm').addEventListener('submit', async function (e) {
//   e.preventDefault();
//   // const teamName = document.getElementById('editTeamName').value.trim();
//   const mobile = document.getElementById('editMobile').value.trim();
//   const updateMsg = document.getElementById('updateMsg');

//   try {
//     const token = localStorage.getItem("token");
//     const res = await axios.put('/api/profile', {
//       mobile
//     }, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     });

//     updateMsg.textContent = "Profile updated successfully!";
//     updateMsg.classList.remove("text-red-500");
//     updateMsg.classList.add("text-green-500");

//     // update UI
//     // document.getElementById('teamName').textContent = teamName;
//     document.getElementById("contactNo").textContent = mobile;

//     setTimeout(() => {
//       document.getElementById('editModal').classList.add('hidden');
//     }, 1000);
//   } catch (err) {
//     updateMsg.textContent = err.response?.data?.message || "Failed to update profile.";
//     updateMsg.classList.remove("text-green-500");
//     updateMsg.classList.add("text-red-500");
//   }
// });

// Open Modal & Populate Fields
document.getElementById('editProfileBtn').addEventListener('click', async () => {
  document.getElementById('editModal').classList.remove('hidden');
  const mobile = document.getElementById('contactNo').textContent.trim();
  document.getElementById('editMobile').value = mobile;

  // Fetch student list again
  const token = localStorage.getItem("token");
  const res = await axios.get("/api/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const { students = [] } = res.data;
  const container = document.getElementById("studentEditFields");
  container.innerHTML = "";

  students.forEach(s => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label class="block text-sm font-medium text-gray-700">
        ${s.student_name} (${s.register_no})
        <input type="text" data-student-id="${s.id}" value="${s.mobile || ''}" class="student-mobile mt-1 p-2 w-full border rounded" placeholder="Mobile Number" maxlength="10" />
      </label>
    `;
    container.appendChild(div);
  });
});

// Cancel Edit
document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('editModal').classList.add('hidden');
});

// Submit Edit
document.getElementById('editForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const mobile = document.getElementById('editMobile').value.trim();
  const updateMsg = document.getElementById('updateMsg');

  const studentInputs = document.querySelectorAll('.student-mobile');
  const studentMobiles = [];

  studentInputs.forEach(input => {
    studentMobiles.push({
      id: input.dataset.studentId,
      mobile: input.value.trim()
    });
  });

  try {
    const token = localStorage.getItem("token");
    await axios.put('/api/profile', {
      mobile,
      studentMobiles
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    updateMsg.textContent = "Profile updated successfully!";
    updateMsg.classList.remove("text-red-500");
    updateMsg.classList.add("text-green-500");

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

document.getElementById("photoInput").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("photo", file);
  console.log(file)
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  try {
    const token = localStorage.getItem("token");

    const res = await axios.post("/api/upload-profile-photo", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });

    const data = res.data;

    if (res.status === 200) {
      document.getElementById("profilePhoto").src = data.photoUrl;
      alert("Profile photo updated successfully!");
    }
  } catch (err) {
    console.error(err);
    const message = err.response?.data?.message || "Upload failed";
    alert(message);
  }
});


async function checkDeadlines() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("api/deadlines", {
    headers: { Authorization: `Bearer ${token}` },
  });
    const { problem_deadline, swot_deadline, value_deadline } = res.data;

    const now = new Date();

    // Hide upload section if any of the deadlines passed
    if (
      (problem_deadline && new Date(problem_deadline) < now) ||
      (swot_deadline && new Date(swot_deadline) < now) ||
      (value_deadline && new Date(value_deadline) < now)
    ) {
      document.getElementById("uploadSection").style.display = "none";
    }
  } catch (err) {
    console.error("Error checking deadlines:", err);
  }
}

// Run on page load
checkDeadlines();






