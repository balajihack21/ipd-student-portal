// replace with your backend URL
const submitBtn = document.getElementById("submitBtn");
const teamInput = document.querySelector('input[placeholder="Enter team name"]');
// Get selected idea input
const selectedIdeaInput = document.querySelector('input[placeholder="Enter selected idea"]');

const criteria = ["func", "problem", "appeal", "retention", "experience", "practical", "uniqueness", "degree","design", "scalability", "tech"];

// Function to update average scores
function updateAverageScores() {
    const ideaInputs = document.querySelectorAll(".idea-input");
    ideaInputs.forEach((input, index) => {
        const ideaIndex = index + 1;
        let sum = 0;
        let count = 0;
        criteria.forEach(crit => {
            const select = document.querySelector(`select[name="idea${ideaIndex}_${crit}"]`);
            if (select && select.value) {
                sum += parseInt(select.value);
                count++;
            }
        });
        const avgInput = document.querySelector(`input[name="idea${ideaIndex}_avg"]`);
        if (avgInput) avgInput.value = count > 0 ? (sum / count).toFixed(2) : "";
    });
}

// Attach change event to all selects
criteria.forEach(crit => {
    const selects = document.querySelectorAll(`select[name$="_${crit}"]`);
    selects.forEach(select => select.addEventListener("change", updateAverageScores));
});

// Handle submit button click
submitBtn.addEventListener("click", async () => {
    const team_name = teamInput.value.trim();
    if (!team_name) {
        alert("Please enter a team name!");
        return;
    }
    // Get selected idea
const selected_idea = selectedIdeaInput.value.trim();
if (!selected_idea) {
    alert("Please enter a selected idea!");
    return;
}


    // Collect ideas
    const ideaInputs = document.querySelectorAll(".idea-input");
    const list_of_ideas = Array.from(ideaInputs)
        .map(input => input.value.trim())
        .filter(val => val !== "");

    if (list_of_ideas.length === 0) {
        alert("Please enter at least one idea!");
        return;
    }

    // Prepare ideas_scores with actual idea text as keys
    const ideas_scores = {};
    let validationFailed = false;

    // Reset all highlights first
    document.querySelectorAll(".idea-input, select").forEach(el => {
        el.style.border = "";
    });

    list_of_ideas.forEach((idea, index) => {
        const ideaInput = document.querySelectorAll(".idea-input")[index];
        if (!idea) {
            ideaInput.style.border = "2px solid red";
            validationFailed = true;
            return;
        }

        ideas_scores[idea] = {};
        criteria.forEach(crit => {
            const select = document.querySelector(`select[name="idea${index + 1}_${crit}"]`);
            if (!select || !select.value) {
                select.style.border = "2px solid red";
                validationFailed = true;
            } else {
                ideas_scores[idea][crit] = parseInt(select.value);
            }
        });
    });

    if (validationFailed) {
        alert("Please fill all the fields before submitting!");
        return;
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        alert("User not authenticated!");
        return;
    }

    // Send POST request
    try {
        const res = await fetch(`/api/idea`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ team_name, list_of_ideas, ideas_scores, selected_idea })

        });

        const data = await res.json();
        if (res.ok) {
            if (res.status === 201) {
                alert("Ideas and scores created successfully!");
            } else if (res.status === 200) {
                alert("Ideas and scores updated successfully!");
            } else {
                alert("Ideas and scores saved successfully!");
            }
            console.log(data);
        } else {
            alert("Error: " + (data.error || data.message || "Unknown error"));
        }
    } catch (err) {
        console.error(err);
        alert("Failed to save data");
    }
});

// =============================
// Load existing data on page load
// =============================
async function loadExistingData() {
    const token = localStorage.getItem("token");
    if (!token) return; // user not logged in

    try {
        const res = await fetch(`/api/idea/mine`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (!data) return; // no previous data

            // Fill team name
            teamInput.value = data.team_name || "";

            const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.style.display = "none";

            // Fill ideas + scores
            const ideaInputs = document.querySelectorAll(".idea-input");
            data.list_of_ideas.forEach((idea, index) => {
                if (ideaInputs[index]) ideaInputs[index].value = idea;

                // Fill dropdowns
                const scores = data.ideas_scores[idea];
                if (scores) {
                    Object.entries(scores).forEach(([crit, val]) => {
                        const select = document.querySelector(`select[name="idea${index + 1}_${crit}"]`);
                        if (select) select.value = val;
                    });
                }
            });

            selectedIdeaInput.value=data.selected_idea

            // Update averages after filling
            updateAverageScores();
        }
    } catch (err) {
        console.error("Failed to fetch existing data:", err);
    }
}

// Call it when page loads
document.addEventListener("DOMContentLoaded", loadExistingData);
