document.getElementById("resetForm").addEventListener("submit", async (e) => {
    e.preventDefault();
     const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const userId = localStorage.getItem("userId");
    console.log(newPassword,userId)
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

      document.getElementById("resetMessage").innerText = "Password updated. Redirecting...";
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 2000);
    } catch (err) {
      document.getElementById("resetMessage").innerText =
        err.response?.data?.message || "Reset failed";
    }
  });