document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const userId = localStorage.getItem("userId");
  const resetMessage = document.getElementById("resetMessage");

  if (!newPassword || !confirmPassword) {
    resetMessage.textContent = "Please fill in all fields.";
    resetMessage.classList.remove("text-green-600");
    resetMessage.classList.add("text-red-600");
    return;
  }

  if (newPassword !== confirmPassword) {
    resetMessage.textContent = "Passwords do not match.";
    resetMessage.classList.remove("text-green-600");
    resetMessage.classList.add("text-red-600");
    return;
  }

  try {
    const response = await axios.post("/api/auth/reset-password", {
      userId,
      newPassword,
    });
    console.log(response)

    resetMessage.textContent = "Password updated successfully. Redirecting...";
    resetMessage.classList.remove("text-red-600");
    resetMessage.classList.add("text-green-600");

    setTimeout(() => {
      
        window.location.href = "/login.html";

    }, 1500);

  } catch (err) {
    resetMessage.textContent = err.response?.data?.message || "Reset failed";
    resetMessage.classList.remove("text-green-600");
    resetMessage.classList.add("text-red-600");
  }
});
