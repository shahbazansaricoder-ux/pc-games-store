(function () {
  const form = document.getElementById("loginForm");
  const err = document.getElementById("errBox");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.style.display = "none";

    const mobile = (document.getElementById("mobile").value || "").trim();
    const password = (document.getElementById("password").value || "").trim();

    const isMobileOk = /^[0-9]{10, 14}$/.test(mobile);
    const isPwdOk = password.length >= 4;

    if (!isMobileOk || !isPwdOk) {
      err.innerText = "Invalid phone or password format";
      err.style.display = "block";
      return;
    }

    try {
      const response = await axios.post(
        "https://spark-games-backend.vercel.app/api/login",
        {
          phone: mobile,
          password: password,
        },
      );

      if (response.data.success) {
        localStorage.setItem("adminSession", response.data.token);
        // You can redirect here
        window.location.href = "/manage-games.html";
      } else {
        err.innerText = response.data.message;
        err.style.display = "block";
      }
    } catch (error) {
      console.error("Login error:", error);
      err.innerText = error.response?.data?.message || "Server error";
      err.style.display = "block";
    }
  });
})();
