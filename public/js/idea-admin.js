window.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- Get URL params ---
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");
    const type = params.get("type");

    console.log("🔍 Params:", { userId, type });

    if (!userId || type.toLowerCase() !== "idea") {
      console.warn("⚠️ Missing or invalid parameters in URL.");
      return;
    }

    // --- Get token ---
    // const token = localStorage.getItem("token");
    // if (!token) {
    //   console.error("❌ No authentication token found.");
    //   return;
    // }

    // --- Fetch Idea Selection data from backend ---
    const res = await fetch(`/admin/ideas?userId=${encodeURIComponent(userId)}`, {
      method: "GET"
    });

    console.log("📡 Response status:", res.status);
    if (!res.ok) {
      console.error("❌ Failed to fetch idea data. Status:", res.status);
      return;
    }

    const data = await res.json();
    console.log("✅ Fetched idea data:", data);

    if (!Array.isArray(data) || data.length === 0 || !data[0].IdeaSelections) {
      console.warn("⚠️ No idea selection data found for this team.");
      return;
    }

    const ideaData = data[0].IdeaSelections;

    // --- Fill team name & selected idea ---
    const teamInput = document.querySelector('input[placeholder="Enter team name"]');
    const selectedIdeaInput = document.querySelector('input[placeholder="Enter selected idea"]');
    if (teamInput) teamInput.value = ideaData[0].team_name || "";
    if (selectedIdeaInput) selectedIdeaInput.value = ideaData[0].selected_idea || "";

    // --- Fill ideas ---
    const ideaInputs = document.querySelectorAll(".idea-input");
    ideaData[0].list_of_ideas.forEach((idea, index) => {
      if (ideaInputs[index]) ideaInputs[index].value = idea;

      // Fill scores if available
      const scores = ideaData[0].ideas_scores?.[idea];
      if (scores) {
        Object.entries(scores).forEach(([crit, val]) => {
          const select = document.querySelector(`select[name="idea${index + 1}_${crit}"]`);
          if (select) select.value = val;
        });
      }
    });

    // --- Update averages ---
    const criteria = ["func", "problem", "appeal", "retention", "experience", "practical", "uniqueness", "degree", "design", "scalability", "tech"];
    ideaData[0].list_of_ideas.forEach((_, index) => {
      let sum = 0;
      let count = 0;
      criteria.forEach((crit) => {
        const select = document.querySelector(`select[name="idea${index + 1}_${crit}"]`);
        if (select && select.value) {
          sum += parseInt(select.value);
          count++;
        }
      });
      const avgInput = document.querySelector(`input[name="idea${index + 1}_avg"]`);
      if (avgInput) avgInput.value = count > 0 ? (sum / count).toFixed(2) : "";
    });

    // --- Disable all inputs and selects ---
    document.querySelectorAll("input, select, textarea, button").forEach(el => {
      el.disabled = true;
      el.style.background = "#f5f5f5";
      el.style.pointerEvents = "none";
    });

    // --- Hide submit button ---
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.style.display = "none";

  } catch (err) {
    console.error("💥 Error loading mentor idea data:", err);
  }
});
