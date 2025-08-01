document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginBtn = document.getElementById("loginBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");

  loginBtn.disabled = true;
  btnText.textContent = "Logging in...";
  btnSpinner.classList.remove("hidden");

  try {
    const response = await axios.post("/api/auth/login", { email, password });

    if (response.data.firstLogin) {
      localStorage.setItem("userId", response.data.userId);
      window.location.href = "/reset-password.html";
    } else {
      localStorage.setItem("token", response.data.token);
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
