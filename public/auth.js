async function checkLogin() {
  try {
    const response = await fetch("/api/user");
    const data = await response.json();

    const usernameEl = document.getElementById("username");
    const emailEl = document.getElementById("email");
    const fullNameEl = document.getElementById("fullName");

    if (data.loggedIn) {
      if (usernameEl) usernameEl.textContent = data.username;
      if (emailEl) emailEl.textContent = data.email;
      if (fullNameEl) fullNameEl.textContent = "Welcome Back!";

      const loginLink = document.querySelector('a[href="login.html"]');
      if (loginLink) {
        loginLink.textContent = "Logout";
        loginLink.href = "logout.html";
      }
    } else {
      const protectedPages = ["changePass.html", "logout.html"];
      const currentPage = window.location.pathname.split("/").pop();
      if (protectedPages.includes(currentPage)) {
        window.location.href = "login.html";
      }
    }
  } catch (error) {
    console.error("Error checking login:", error);
  }
}

async function handleLogout() {
  try {
    const response = await fetch("/api/logout", { method: "POST" });
    if (response.ok) {
      alert("Logged out successfully.");
      window.location.href = "index.html";
    } else {
      alert("Error during logout.");
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
}

async function handleSignUp() {
  const firstName = document.getElementById("txtFirstName").value;
  const lastName = document.getElementById("txtLastName").value;
  const username = document.getElementById("txtUsername").value;
  const email = document.getElementById("txtEmail").value;
  const password = document.getElementById("txtPassword").value;
  const confirmPassword = document.getElementById("txtConfirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const data = { firstName, lastName, username, email, password };

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Registration successful!");
      window.location.href = "login.html";
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("An error occurred during registration.");
  }
}

async function handleLogin() {
  const email = document.getElementById("txtEmail").value;
  const password = document.getElementById("txtPassword").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Login successful!");
      window.location.href = "index.html";
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("An error occurred during login.");
  }
}

async function handlePasswordChange() {
  const currentPassword = document.getElementById("txtCurrentPassword").value;
  const newPassword = document.getElementById("txtNewPassword").value;
  const confirmPassword = document.getElementById("txtConfirmPassword").value;

  if (!currentPassword || !newPassword || newPassword.trim() === "") {
    alert("All fields are required!");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (response.ok) {
      alert("Password updated successfully!");
      window.location.href = "index.html";
    } else {
      const result = await response.json();
      alert("Error: " + result.error);
    }
  } catch (error) {
    console.error("Change password error:", error);
    alert("An error occurred.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // check login if we are not on the login or registration page
  const publicPages = ["login.html", "registration.html"];
  const currentPage = window.location.pathname.split("/").pop();

  if (!publicPages.includes(currentPage)) {
    checkLogin();
  }
});
