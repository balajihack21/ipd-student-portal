document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await axios.post("/api/auth/login", {
      email,
      password,
    });
    console.log(response)

    if (response.data.firstLogin) {
       console.log(response.data.UserId)
      localStorage.setItem("userId", response.data.userId);
      window.location.href = "/reset-password.html";
    }
    else {
      localStorage.setItem("token", response.data.token);
      window.location.href = "/dashboard.html";
    }


    // Optionally redirect to dashboard
    // window.location.href = "/dashboard.html";
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Login failed";
    document.getElementById("error").innerText = errorMsg;
  }
});
