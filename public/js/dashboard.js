window.onload = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { teamName, mobile, students = [], mentor = {}, progress = 0, profilePhoto } = res.data;
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
      const date = new Date(upload.uploaded_at).toLocaleString();
      // Map week number to title
      const weekTitles = {
        1: "Problem Statement Canvas",
        2: "Affinity Diagram",
        3: "Idea Generation Canvas",
        4: "SWOT Analysis",
        5: "Value Proposition",
        6: "User Requirements",
        7: "Product Dimensions",
        8: "Performance Requirement",
        9: "Bill Of Materials",
        10: "2D Modelling",
        11: "3D Modelling",
        12: "DB Schema",
        13: "HLD",
        14: "Tech Stack Architecture",
        15: "User Flow Diagram",
        16:"Mock Up / Wireframe"
      };

      const title = weekTitles[upload.week_number] || `File ${upload.week_number}`;

      item.innerHTML = `
  <div class="bg-gray-100 p-3 rounded shadow-sm mb-3">
    <div class="flex justify-between items-center">
      <div>
        <strong>${title}</strong><br>
        <span class="text-xs text-gray-500">${date}</span>
      </div>
      <a href="#" class="text-blue-500 underline view-link">View</a>
    </div>
    <div class="mt-2 ml-1 text-sm text-gray-700">
      <div><strong>Status:</strong> 
        <span class="font-medium ${upload.status === 'REVIEWED'
          ? 'text-green-600'
          : upload.status === 'SUBMITTED'
            ? 'text-red-600'
            : 'text-yellow-600'
        }">
          ${upload.status || 'Pending'}
        </span>
      </div>
      <div><strong>Comment:</strong> ${upload.review_comment || 'No comment yet'}</div>
    </div>
  </div>
`;

      uploadDiv.appendChild(item);

      const viewLink = item.querySelector(".view-link");

      // If file_url exists, open in new tab
      if (upload.file_url) {
        viewLink.href = upload.file_url;
        viewLink.target = "_blank";
      } else {
        // Otherwise, open modal based on week_number
        viewLink.addEventListener("click", (e) => {
          e.preventDefault();
          if (upload.week_number === 4) {
            // Example: when showing SWOT modal
            document.getElementById("swotModal").classList.remove("hidden");
            const swotSubmitBtn = document.getElementById("swotSubmitBtn");
            if (swotSubmitBtn) swotSubmitBtn.style.display = "none";

            document.getElementById("swotIframe").src = "swot.html"; // replace with dynamic src if needed
          } else if (upload.week_number === 3) {
            document.getElementById("ideaModal").classList.remove("hidden");
            // Example: when showing SWOT modal
            const ideaSubmitBtn = document.getElementById("ideaSubmitBtn");
            if (ideaSubmitBtn) ideaSubmitBtn.style.display = "none";

            document.getElementById("ideaIframe").src = "idea.html"; // replace with dynamic src if needed
          } else if (upload.week_number === 5) {
            document.getElementById("valueModal").classList.remove("hidden");
            // Example: when showing SWOT modal
            const valueSubmitBtn = document.getElementById("valueSubmitBtn");
            if (valueSubmitBtn) valueSubmitBtn.style.display = "none";

            document.getElementById("valueIframe").src = "value.html";
          }
          else if (upload.week_number === 6) {
            document.getElementById("userReqModal").classList.remove("hidden");

            const submitBtn = document.getElementById("userReqSubmitBtn");
            if (submitBtn) submitBtn.style.display = "none";

            loadUserRequirementCanvasIntoModal();
          }

          else if (upload.week_number === 7) {

            openModal(
              "Product Dimensions",
              ["Parameter", "Dimension"],
              "dimensions"
            );

            disablePopupEditing(); // make read-only
            loadPopupData("dimensions");
          }

          else if (upload.week_number === 8) {

            openModal(
              "Performance Requirements",
              ["Parameter", "Expected Performance", "Justification"],
              "performance"
            );

            disablePopupEditing();
            loadPopupData("performance");
          }

          else if (upload.week_number === 9) {

            openModal(
              "Bill Of Materials",
              ["Component", "Material", "Quantity"],
              "bom"
            );

            disablePopupEditing();
            loadPopupData("bom");
          }

        });
      }
    });

    // Close buttons
    document.getElementById("closeSwotModal").addEventListener("click", () => {
      document.getElementById("swotModal").classList.add("hidden");
      //document.getElementById("swotIframe").src = ""; // reset iframe
    });

    document.getElementById("closeIdeaModal").addEventListener("click", () => {
      document.getElementById("ideaModal").classList.add("hidden");
      //document.getElementById("ideaIframe").src = ""; // reset iframe
    });

  } catch (err) {
    console.error("Error loading upload history", err);
  }
}


async function loadUserRequirementCanvasIntoModal() {

  try {
    const token = localStorage.getItem("token");

    const res = await axios.get("/api/user-requirements/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = res.data;

    if (!data) return;

    userReqRows.innerHTML = "";

    for (let i = 0; i < 10; i++) {

      const requirement = data.user_requirements?.[i] || "";
      const feature = data.product_features?.[i] || "";

      const row = document.createElement("div");
      row.className = "grid grid-cols-2 gap-4";

      row.innerHTML = `
        <input type="text"
          value="${requirement}"
          class="border p-2 rounded bg-gray-100"
          readonly />

        <input type="text"
          value="${feature}"
          class="border p-2 rounded bg-gray-100"
          readonly />
      `;

      userReqRows.appendChild(row);
    }

    document.getElementById("mustHave").value = data.must_have || "";
    document.getElementById("shouldHave").value = data.should_have || "";
    document.getElementById("couldHave").value = data.could_have || "";
    document.getElementById("wontHave").value = data.wont_have || "";

    document.getElementById("mustHave").readOnly = true;
    document.getElementById("shouldHave").readOnly = true;
    document.getElementById("couldHave").readOnly = true;
    document.getElementById("wontHave").readOnly = true;

  } catch (err) {
    console.error("Error loading into modal:", err);
  }
}

async function loadPopupData(type) {
  try {
    const token = localStorage.getItem("token");

    const endpointMap = {
      dimensions: "/api/product-dimensions/mine",
      performance: "/api/performance-requirements/mine",
      bom: "/api/bill-of-materials/mine"
    };

    const res = await axios.get(endpointMap[type], {
      headers: { Authorization: `Bearer ${token}` }
    });

    let rows = [];

    // Normalize backend response structure
    if (type === "dimensions") {
      rows = res.data.dimensions || [];
    }

    if (type === "performance") {
      rows = res.data.performance_data || [];
    }

    if (type === "bom") {
      rows = res.data.bom_data || [];
    }

    const inputs = document.querySelectorAll(".table-input");

    let index = 0;
    console.log(rows)

    rows.forEach(row => {
      Object.values(row).forEach(value => {
        if (inputs[index]) {
          inputs[index].value = value ?? "";
          index++;
        }
      });
    });

  } catch (err) {
    console.error("Error loading popup data:", err);
  }
}

function disablePopupEditing() {
  const inputs = document.querySelectorAll(".table-input");

  inputs.forEach(input => {
    input.readOnly = true;
    input.classList.add("bg-gray-100");
  });

  const saveBtn = document.getElementById("savePopupBtn");
  if (saveBtn) saveBtn.style.display = "none";
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

      await axios.post("/api/upload", formData, {
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
handleUpload("modelling2dForm", "modelling2dFile", "modelling2dProgress", "modelling2dStatus", 10);

handleUpload("modelling3dForm", "modelling3dFile", "modelling3dProgress", "modelling3dStatus", 11);

handleUpload("dbSchemaForm", "dbSchemaFile", "dbSchemaProgress", "dbSchemaStatus", 12);

handleUpload("hldForm", "hldFile", "hldProgress", "hldStatus", 13);

handleUpload("techStackForm", "techStackFile", "techStackProgress", "techStackStatus", 14);

handleUpload("userFlowForm", "userFlowFile", "userFlowProgress", "userFlowStatus", 15);

handleUpload("mockupForm", "mockupFile", "mockupProgress", "mockupStatus", 16);





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
    const res = await axios.get("/api/deadlines", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const {
      problem_deadline,
      swot_deadline,
      value_deadline,
      isLocked
    } = res.data;

    const now = new Date();

    // Get sections
    const uploadSection = document.getElementById("uploadSection"); // Problem Statement section
    const ideaSection = document.getElementById("addIdeaBtn")?.closest("div");
    const swotSection = document.getElementById("addSwotBtn")?.closest("div");
    const valueSection = document.getElementById("addValueBtn")?.closest("div");

    // Hide all initially
    if (uploadSection) uploadSection.style.display = "none";
    if (ideaSection) ideaSection.style.display = "none";
    if (swotSection) swotSection.style.display = "none";
    if (valueSection) valueSection.style.display = "none";

    // Helper: check if deadline is still valid
    const isBeforeDeadline = (deadline) => deadline && new Date(deadline) > now;

    // ✅ PROBLEM STATEMENT SECTION
    // Visible only if before deadline AND not locked
    if (!isLocked && isBeforeDeadline(problem_deadline)) {
      if (uploadSection) uploadSection.style.display = "block";
    }

    // ✅ IDEA & SWOT SECTION (only depend on swot_deadline)
    if (!isLocked && isBeforeDeadline(swot_deadline)) {
      if (ideaSection) ideaSection.style.display = "block";
      if (swotSection) swotSection.style.display = "block";
    }

    // ✅ VALUE PROPOSITION SECTION (only depend on value_deadline)
    if (isBeforeDeadline(value_deadline)) {
      if (valueSection) valueSection.style.display = "block";
    }

  } catch (err) {
    console.error("Error checking deadlines:", err);
  }
}



// // Modal controls
// const canvasModal = document.getElementById("canvasModal");
// document.getElementById("openCanvasBtn").addEventListener("click", () => {
//   canvasModal.classList.remove("hidden");
// });
// document.getElementById("closeCanvasBtn").addEventListener("click", () => {
//   canvasModal.classList.add("hidden");
// });

// // Form submission
// document.getElementById("canvasForm").addEventListener("submit", (e) => {
//   e.preventDefault();

//   // Value Proposition inputs
//   const gains = document.getElementById("gainCreators").value.trim();
//   const pains = document.getElementById("painRelievers").value.trim();
//   const products = document.getElementById("productsServices").value.trim();

//   // Customer Segment inputs
//   const customerGains = document.getElementById("customerGains").value.trim();
//   const customerPains = document.getElementById("customerPains").value.trim();
//   const customerJobs = document.getElementById("customerJobs").value.trim();

//   // Hide modal
//   canvasModal.classList.add("hidden");

// // Example data (replace with form inputs)

// // Render canvas using HTML + CSS + SVG
// canvasOutput.innerHTML = `
//   <div class="flex justify-center items-center w-full h-full relative bg-gray-50">
//     <!-- Left square -->
//     <div class="w-1/3 h-80 border-2 border-gray-400 relative p-4">
//       <h3 class="text-center font-bold mb-2">Value Proposition</h3>
//       <div class="absolute inset-0 flex flex-col justify-between p-4">
//         <div>
//           <h4 class="font-semibold">Gain Creators</h4>
//           <p class="text-gray-700 whitespace-pre-line">${gains}</p>
//         </div>
//         <div>
//           <h4 class="font-semibold">Pain Relievers</h4>
//           <p class="text-gray-700 whitespace-pre-line">${pains}</p>
//         </div>
//         <div>
//           <h4 class="font-semibold">Products & Services</h4>
//           <p class="text-gray-700 whitespace-pre-line">${products}</p>
//         </div>
//       </div>
//     </div>

//     <!-- Connecting line -->
//     <div class="w-16"></div>

//     <!-- Right circle -->
//     <div class="relative w-80 h-80 rounded-full border-2 border-gray-400 flex flex-col justify-center items-center p-6">
//       <h3 class="text-center font-bold mb-4">Customer Segment</h3>
//       <div class="absolute top-1/4 left-1/4 w-1/2 h-1/2 flex flex-col justify-between text-center">
//         <div>
//           <h4 class="font-semibold">Gains</h4>
//           <p class="text-gray-700 whitespace-pre-line">${customerGains}</p>
//         </div>
//         <div>
//           <h4 class="font-semibold">Pains</h4>
//           <p class="text-gray-700 whitespace-pre-line">${customerPains}</p>
//         </div>
//         <div>
//           <h4 class="font-semibold">Customer Jobs</h4>
//           <p class="text-gray-700 whitespace-pre-line">${customerJobs}</p>
//         </div>
//       </div>
//     </div>
//   </div>
// `;

// });


//     const addSwotBtn = document.getElementById('addSwotBtn');
// const swotModal = document.getElementById('swotModal');
// const closeSwotModal = document.getElementById('closeSwotModal');

// addSwotBtn.addEventListener('click', () => {
//     swotModal.style.display = 'block';
// });

// closeSwotModal.addEventListener('click', () => {
//   console.log("click")
//     swotModal.style.display = 'none';
// });

// // Optional: close modal on outside click
// window.addEventListener('click', (e) => {
//     if (e.target === swotModal) {
//         swotModal.style.display = 'none';
//     }
// });




// Run on page load
checkDeadlines();



// Open SWOT Modal
document.getElementById("addSwotBtn").addEventListener("click", () => {
  document.getElementById("swotModal").classList.remove("hidden");
});

// Close SWOT Modal
document.getElementById("closeSwotModal").addEventListener("click", async () => {
  document.getElementById("swotModal").classList.add("hidden");
  await loadUploadHistory();
});

// Optional: Close modal if user clicks outside the iframe box
document.getElementById("swotModal").addEventListener("click", (e) => {
  if (e.target.id === "swotModal") {
    document.getElementById("swotModal").classList.add("hidden");
  }
});



// Open SWOT Modal
document.getElementById("addIdeaBtn").addEventListener("click", () => {
  document.getElementById("ideaModal").classList.remove("hidden");
});

// Close SWOT Modal
document.getElementById("closeIdeaModal").addEventListener("click", async () => {
  document.getElementById("ideaModal").classList.add("hidden");
  await loadUploadHistory();
});

// Optional: Close modal if user clicks outside the iframe box
document.getElementById("ideaModal").addEventListener("click", (e) => {
  if (e.target.id === "ideaModal") {
    document.getElementById("ideaModal").classList.add("hidden");
  }
});




// Open SWOT Modal
document.getElementById("addValueBtn").addEventListener("click", () => {
  document.getElementById("valueModal").classList.remove("hidden");
});

// Close SWOT Modal
document.getElementById("closeValueModal").addEventListener("click", async () => {
  document.getElementById("valueModal").classList.add("hidden");
  await loadUploadHistory();
});

// Optional: Close modal if user clicks outside the iframe box
document.getElementById("valueModal").addEventListener("click", (e) => {
  if (e.target.id === "valueModal") {
    document.getElementById("valueModal").classList.add("hidden");
  }
});


// ====== Problem Statement Modal Logic ======
const problemModal = document.getElementById('problemModal');
const addProblemBtn = document.getElementById('addProblemBtn');
const closeProblemModal = document.getElementById('closeProblemModal');
const cancelProblemBtn = document.getElementById('cancelProblemBtn');
const problemForm = document.getElementById('problemStatementForm');
const problemMsg = document.getElementById('problemMessage');
const problemDescriptionInput = document.getElementById('problemDescription');
const selectedIdeaInput = document.getElementById('selectedIdea');
const problemDisplay = document.getElementById('problemDisplay');

let existingProblemId = null; // Track if a problem statement already exists

addProblemBtn.addEventListener('click', () => {
  problemModal.classList.remove('hidden');
});

closeProblemModal.addEventListener('click', () => {
  problemModal.classList.add('hidden');
});

cancelProblemBtn.addEventListener('click', () => {
  problemModal.classList.add('hidden');
});

// ====== Load Problem Statement on Page Load ======
async function loadProblemStatement() {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.get('/api/problem-statement/mine', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && response.data.problem_description) {
      const { id, problem_description, selected_idea, updatedAt } = response.data;
      existingProblemId = id; // store the ID for update

      // Update display
      problemDisplay.innerHTML = `
        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 class="font-semibold text-gray-800 mb-2">Problem Statement</h4>
          <p class="text-gray-700 mb-4 whitespace-pre-line">${problem_description}</p>

          <h4 class="font-semibold text-gray-800 mb-2">Selected Idea</h4>
          <p class="text-gray-700 whitespace-pre-line">${selected_idea}</p>

          <p class="text-sm text-gray-500 mt-3 text-right">Last updated: ${new Date(updatedAt).toLocaleString()}</p>
        </div>
      `;

      // Prefill form
      problemDescriptionInput.value = problem_description;
      selectedIdeaInput.value = selected_idea;
    } else {
      problemDisplay.innerHTML = `<p class="text-gray-500 text-sm italic">No problem statement added yet.</p>`;
      existingProblemId = null;
    }
  } catch (error) {
    console.error('Error loading problem statement:', error);
    problemDisplay.innerHTML = `<p class="text-red-600 text-sm">⚠️ Failed to load problem statement.</p>`;
  }
}

// ====== Submit or Update Problem Statement ======
problemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const problem_description = problemDescriptionInput.value.trim();
  const selected_idea = selectedIdeaInput.value.trim();

  if (!problem_description || !selected_idea) {
    problemMsg.textContent = '⚠️ Please fill in all fields.';
    problemMsg.classList.add('text-red-600');
    return;
  }

  try {
    const token = localStorage.getItem('token');

    let response;
    if (existingProblemId) {
      // Update existing
      response = await axios.put(`/api/problem-statement/${existingProblemId}`, {
        problem_description,
        selected_idea
      }, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      // Create new
      response = await axios.post('/api/problem-statement', {
        problem_description,
        selected_idea
      }, { headers: { Authorization: `Bearer ${token}` } });
    }

    if (response.status === 200 || response.status === 201) {
      problemMsg.textContent = '✅ Problem Statement saved successfully!';
      problemMsg.classList.remove('text-red-600');
      problemMsg.classList.add('text-green-600');

      existingProblemId = response.data.id || existingProblemId; // update ID if newly created

      // Update display immediately
      problemDisplay.innerHTML = `
        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 class="font-semibold text-gray-800 mb-2">Problem Statement</h4>
          <p class="text-gray-700 mb-4 whitespace-pre-line">${problem_description}</p>

          <h4 class="font-semibold text-gray-800 mb-2">Selected Idea</h4>
          <p class="text-gray-700 whitespace-pre-line">${selected_idea}</p>

          <p class="text-sm text-gray-500 mt-3 text-right">Last updated: ${new Date().toLocaleString()}</p>
        </div>
      `;

      setTimeout(() => {
        problemModal.classList.add('hidden');
      }, 1500);
    }
  } catch (error) {
    console.error('Error saving problem statement:', error);
    problemMsg.textContent = '❌ Failed to save. Please try again.';
    problemMsg.classList.add('text-red-600');
  }
});

let currentModalType = null; // track which modal is open

function openModal(title, headers, type) {

  currentModalType = type; // 👈 store type

  document.getElementById("modalTitle").innerText = title;

  let tableHTML = `<table class="w-full border border-collapse">`;
  tableHTML += "<thead><tr>";

  headers.forEach(h => {
    tableHTML += `<th class="border p-2 bg-gray-100">${h}</th>`;
  });

  tableHTML += "</tr></thead><tbody>";

  for (let i = 0; i < 10; i++) {
    tableHTML += "<tr>";
    headers.forEach(() => {
      tableHTML += `<td class="border p-1">
                <input type="text" class="w-full border p-1 rounded table-input" />
            </td>`;
    });
    tableHTML += "</tr>";
  }

  tableHTML += "</tbody></table>";

  document.getElementById("modalTableContainer").innerHTML = tableHTML;

  document.getElementById("popupModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("popupModal").classList.add("hidden");
}

const addDimensionsBtn = document.getElementById("addDimensionsBtn");

if (addDimensionsBtn) {
  addDimensionsBtn.addEventListener("click", function () {
    openModal(
      "Product Dimensions",
      ["Parameter", "Dimension"],
      "dimensions"
    );
  });
}

const addPerformanceBtn = document.getElementById("addPerformanceBtn");
if (addPerformanceBtn) {
  addPerformanceBtn.addEventListener("click", function () {
    openModal("Performance Requirements",
      ["Parameter", "Expected Performance", "Justification"],
      "performance");
  });
}

const addBomBtn = document.getElementById("addBomBtn");
if (addBomBtn) {
  addBomBtn.addEventListener("click", function () {
    openModal("Bill Of Materials",
      ["Component", "Material", "Quantity"],
      "bom");
  });
}

const savePopupBtn = document.getElementById("savePopupBtn");

if (savePopupBtn) {
  savePopupBtn.addEventListener("click", async function () {

    const token = localStorage.getItem("token");
    const rows = document.querySelectorAll("#modalTableContainer tbody tr");

    let formattedData = [];

    rows.forEach(row => {
      const inputs = row.querySelectorAll("input");
      const values = Array.from(inputs).map(i => i.value.trim());

      if (values.some(v => v !== "")) {
        formattedData.push(values);
      }
    });

    try {

      if (currentModalType === "dimensions") {

        const dimensions = formattedData.map(r => ({
          parameter: r[0],
          dimension: r[1]
        }));

        await axios.post("/api/product-dimensions", {
          dimensions
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await loadDimensions();
      }

      else if (currentModalType === "performance") {

        const performance_data = formattedData.map(r => ({
          parameter: r[0],
          expectedPerformance: r[1],
          justification: r[2]
        }));

        await axios.post("/api/performance-requirements", {
          performance_data
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await loadPerformance();
      }

      else if (currentModalType === "bom") {

        const bom_data = formattedData.map(r => ({
          component: r[0],
          material: r[1],
          quantity: r[2]
        }));

        await axios.post("/api/bill-of-materials", {
          bom_data
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await loadBOM();
      }

      alert("Saved Successfully ");
      closeModal();

    } catch (err) {
      console.error("Error saving:", err);
      alert("Failed to save ");
    }
  });

}


async function loadDimensions() {

  const token = localStorage.getItem("token");
  const res = await axios.get("/api/product-dimensions/mine", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const display = document.getElementById("dimensionsDisplay");

  if (!res.data || !res.data.dimensions) {
    display.innerHTML = `<p class="text-gray-500 italic">No data added yet.</p>`;
    return;
  }

  display.innerHTML = `
        <div class="border rounded p-4 bg-gray-50">
            <h3 class="font-semibold mb-2">Product Dimensions</h3>
            <ul class="list-disc ml-5">
                ${res.data.dimensions.map(d =>
    `<li><strong>${d.parameter}:</strong> ${d.dimension}</li>`
  ).join("")}
            </ul>
        </div>
    `;
}

async function loadPerformance() {

  const token = localStorage.getItem("token");
  const res = await axios.get("/api/performance-requirements/mine", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const display = document.getElementById("performanceDisplay");

  if (!res.data || !res.data.performance_data) {
    display.innerHTML = `<p class="text-gray-500 italic">No data added yet.</p>`;
    return;
  }

  display.innerHTML = `
        <div class="border rounded p-4 bg-gray-50">
            <h3 class="font-semibold mb-2">Performance Requirements</h3>
            <ul class="list-disc ml-5">
                ${res.data.performance_data.map(p =>
    `<li>
            <strong>${p.parameter}</strong> → ${p.expectedPerformance}
            <br><small>${p.justification}</small>
        </li>`
  ).join("")}
            </ul>
        </div>
    `;
}

async function loadBOM() {

  const token = localStorage.getItem("token");
  const res = await axios.get("/api/bill-of-materials/mine", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const display = document.getElementById("bomDisplay");

  if (!res.data || !res.data.bom_data) {
    display.innerHTML = `<p class="text-gray-500 italic">No data added yet.</p>`;
    return;
  }

  display.innerHTML = `
        <div class="border rounded p-4 bg-gray-50">
            <h3 class="font-semibold mb-2">Bill Of Materials</h3>
            <ul class="list-disc ml-5">
                ${res.data.bom_data.map(b =>
    `<li>
            <strong>${b.component}</strong> -
            ${b.material} -
            Qty: ${b.quantity}
        </li>`
  ).join("")}
            </ul>
        </div>
    `;
}

// ===============================
// Project Category & User Requirements Logic
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // ===== SAVE USER REQUIREMENT CANVAS =====

  const cancelBtn = document.getElementById("cancelPopupBtn");

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }
  const userReqForm = document.getElementById("userReqForm");

  if (userReqForm) {
    userReqForm.addEventListener("submit", async function (e) {

      e.preventDefault(); // 🚨 This fully stops page refresh

      const token = localStorage.getItem("token");

      const requirementInputs = userReqRows.querySelectorAll("input:nth-child(1)");
      const featureInputs = userReqRows.querySelectorAll("input:nth-child(2)");

      const user_requirements = [];
      const product_features = [];

      requirementInputs.forEach(input => {
        if (input.value.trim()) {
          user_requirements.push(input.value.trim());
        }
      });

      featureInputs.forEach(input => {
        if (input.value.trim()) {
          product_features.push(input.value.trim());
        }
      });

      const must_have = document.getElementById("mustHave")?.value || "";
      const should_have = document.getElementById("shouldHave")?.value || "";
      const could_have = document.getElementById("couldHave")?.value || "";
      const wont_have = document.getElementById("wontHave")?.value || "";

      try {
        await axios.post("/api/user-requirements", {
          user_requirements,
          product_features,
          must_have,
          should_have,
          could_have,
          wont_have
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        alert("User Requirement Canvas Saved Successfully ✅");

        userReqModal.classList.add("hidden");

        await loadUserRequirementCanvas();
        await loadUploadHistory();

      } catch (err) {
        console.error("Error saving canvas:", err);
        alert("Failed to save. Try again.");
      }
    });
  }
  const projectTypeSelect = document.getElementById("projectType");
  const categoryUploadSection = document.getElementById("categoryUploadSection");
  const hardwareSection = document.getElementById("hardwareSection");
  const softwareSection = document.getElementById("softwareSection");

  projectTypeSelect.addEventListener("change", function () {

    const value = this.value;

    // Reset
    categoryUploadSection.classList.add("hidden");
    hardwareSection.classList.add("hidden");
    softwareSection.classList.add("hidden");

    if (value === "hardware") {
      categoryUploadSection.classList.remove("hidden");
      hardwareSection.classList.remove("hidden");
    }

    else if (value === "software") {
      categoryUploadSection.classList.remove("hidden");
      softwareSection.classList.remove("hidden");
    }

    else if (value === "hybrid") {
      categoryUploadSection.classList.remove("hidden");
      hardwareSection.classList.remove("hidden");
      softwareSection.classList.remove("hidden");
    }
  });

  // Open Modal
  addUserReqBtn.addEventListener("click", function () {
    userReqModal.classList.remove("hidden");

    // Generate 10 rows dynamically
    userReqRows.innerHTML = "";

    for (let i = 1; i <= 10; i++) {
      const row = document.createElement("div");
      row.className = "grid grid-cols-2 gap-4";

      row.innerHTML = `
  <input type="text"
    placeholder="User Requirement ${i}"
    class="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

  <input type="text"
    placeholder="Product Feature ${i}"
    class="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
`;

      userReqRows.appendChild(row);
    }
  });

  // Close Modal
  closeUserReqModal.addEventListener("click", function () {
    userReqModal.classList.add("hidden");
  });

  cancelUserReqBtn.addEventListener("click", function () {
    userReqModal.classList.add("hidden");
  });

  // Close when clicking outside modal
  userReqModal.addEventListener("click", function (e) {
    if (e.target.id === "userReqModal") {
      userReqModal.classList.add("hidden");
    }
  });

});

async function loadUserRequirementCanvas() {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get("/api/user-requirements/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = res.data;
    const displayDiv = document.getElementById("userReqDisplay");

    if (!data) {
      displayDiv.innerHTML = `<p class="text-gray-500 italic">No data submitted yet.</p>`;
      return;
    }

    displayDiv.innerHTML = `
      <div class="bg-gray-50 border rounded-lg p-4 space-y-4">
        <h3 class="font-semibold text-lg">User Requirements</h3>
        <ul class="list-disc ml-5">
          ${data.user_requirements?.map(r => `<li>${r}</li>`).join("") || ""}
        </ul>

        <h3 class="font-semibold text-lg mt-4">Product Features</h3>
        <ul class="list-disc ml-5">
          ${data.product_features?.map(f => `<li>${f}</li>`).join("") || ""}
        </ul>

        <h3 class="font-semibold text-lg mt-4">MOSCOW Method</h3>
        <p><strong>Must Have:</strong> ${data.must_have || "-"}</p>
        <p><strong>Should Have:</strong> ${data.should_have || "-"}</p>
        <p><strong>Could Have:</strong> ${data.could_have || "-"}</p>
        <p><strong>Won’t Have:</strong> ${data.wont_have || "-"}</p>

        <p class="text-sm text-gray-500 text-right mt-2">
          Last Updated: ${new Date(data.updatedAt).toLocaleString()}
        </p>
      </div>
    `;
  } catch (err) {
    console.error("Error loading User Requirement Canvas:", err);
  }
}


// Load problem statement on page load
window.addEventListener('load', loadProblemStatement);

window.addEventListener('load', loadUserRequirementCanvas);

window.addEventListener("load", loadDimensions);
window.addEventListener("load", loadPerformance);
window.addEventListener("load", loadBOM);








