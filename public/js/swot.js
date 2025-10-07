document.addEventListener("DOMContentLoaded", async () => {
    const dateEl = document.getElementById("date");
    const token = localStorage.getItem("token");

    try {
        // Call API to check if SWOT already exists for this user
        const res = await fetch("/api/swot/mine", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log(data);

            if (data) {
                const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.style.display = "none";
                // Fill fields with existing data
                document.getElementById("teamName").innerText = data.team_name || "";
                document.getElementById("idea").innerText = data.selected_idea || "";
                document.getElementById("strengths").innerText = data.strengths || "";
                document.getElementById("weakness").innerText = data.weakness || "";
                document.getElementById("opportunities").innerText = data.opportunities || "";
                document.getElementById("threats").innerText = data.threats || "";
            }
        }
    } catch (err) {
        console.error("Error fetching SWOT:", err);
    }

    // Always show today's system date (not editable, not sent to backend)
    const today = new Date();
    dateEl.innerText = today.toLocaleDateString("en-GB");
    dateEl.style.pointerEvents = "none";
    dateEl.style.background = "#f5f5f5";
});

// Limit max characters for each field
const fields = ["teamName","idea","strengths","weakness","opportunities","threats"];
fields.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener("input", function() {
        if (this.innerText.length > 1000) {
            this.innerText = this.innerText.substring(0,1000);
            alert("Maximum 1000 characters allowed.");
        }
    });
});

// Function to collect data and send to backend
async function submitSwot() {
    try {
        const data = {
            teamName: document.getElementById("teamName").innerText.trim(),
            selectedIdea: document.getElementById("idea").innerText.trim(),
            strengths: document.getElementById("strengths").innerText.trim(),
            weakness: document.getElementById("weakness").innerText.trim(),
            opportunities: document.getElementById("opportunities").innerText.trim(),
            threats: document.getElementById("threats").innerText.trim()
        };

        // Basic validation
        if (!data.teamName || !data.selectedIdea) {
            alert("Team Name and Selected Idea are required");
            return;
        }

        const token = localStorage.getItem("token");

        const res = await fetch("/api/swot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data) // 🚫 no date sent
        });

        if (!res.ok) throw new Error("Failed to store SWOT analysis");

        const result = await res.json();
        alert("✅ SWOT Analysis saved successfully!");

        // Optionally clear fields after submission
        fields.forEach(id => document.getElementById(id).innerText = "");

    } catch (err) {
        console.error(err);
        alert("❌ Error saving SWOT Analysis: " + err.message);
    }
}

// Bind to submit button
document.getElementById("submitBtn").addEventListener("click", submitSwot);
