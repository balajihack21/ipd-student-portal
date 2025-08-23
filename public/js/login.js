document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const loginBtn = document.getElementById("loginBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");

  loginBtn.disabled = true;
  btnText.textContent = "Logging in...";
  btnSpinner.classList.remove("hidden");

  try {
    const response = await axios.post("/api/auth/login", { email, password });
    const { role, token, firstLogin, userId } = response.data;

    if (firstLogin) {
      localStorage.setItem("userId", userId);
      window.location.href = "/reset-password.html";
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
    }

    // Redirect based on role
   if (role === "admin") {
  window.location.href = "/admin-dashboard.html";
} else if (role === "mentor") {
  window.location.href = "/mentor-dashboard.html";
} else {
  window.location.href = "/dashboard.html";
}


  } catch (error) {
    const errorMsg = error.response?.data?.message || "Login failed";
    document.getElementById("error").innerText = errorMsg;
  } finally {
    loginBtn.disabled = false;
    btnText.textContent = "Login";
    btnSpinner.classList.add("hidden");
  }
});
