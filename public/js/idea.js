// {
//   "team_name": "Team Innovators",
//   "list_of_ideas": [
//     "Smart Recycling Bin",
//     "AI Study Assistant",
//     "Eco-Friendly Packaging"
//   ],
//   "ideas_scores": {
//     "Smart Recycling Bin": {
//       "Value": 4,
//       "Functionality": 5,
//       "Problem Relevance": 5,
//       "Innovation": 4
//     },
//     "AI Study Assistant": {
//       "Value": 5,
//       "Functionality": 4,
//       "Problem Relevance": 4,
//       "Innovation": 5
//     },
//     "Eco-Friendly Packaging": {
//       "Value": 3,
//       "Functionality": 3,
//       "Problem Relevance": 4,
//       "Innovation": 3
//     }
//   }
// }


// replace with your backend URL
const submitBtn = document.getElementById("submitBtn");
const teamInput = document.querySelector('input[placeholder="Enter team name"]');
const criteria = ["func", "problem", "appeal", "retention", "experience", "practical", "uniqueness", "design", "scalability", "tech"];

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

    // Collect ideas
    const ideaInputs = document.querySelectorAll(".idea-input");
    const list_of_ideas = Array.from(ideaInputs)
        .map(input => input.value.trim())
        .filter(val => val !== "");

    if (list_of_ideas.length === 0) {
        alert("Please enter at least one idea!");
        return;
    }

    // Prepare ideas_scores
    const ideas_scores = {};
    list_of_ideas.forEach((idea, index) => {
        const ideaKey = `Idea ${index + 1}`;
        ideas_scores[ideaKey] = {};
        criteria.forEach(crit => {
            const select = document.querySelector(`select[name="idea${index + 1}_${crit}"]`);
            ideas_scores[ideaKey][crit] = select && select.value ? parseInt(select.value) : null;
        });
    });

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        alert("User not authenticated!");
        return;
    }

    // Send POST request
    try {
        const res = await fetch(`api/idea`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ team_name, list_of_ideas, ideas_scores })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Ideas and scores saved successfully!");
            console.log(data);
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to save data");
    }
});






