import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// --- API ROUTES ---

// user Registration
app.post("/api/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, username, email, hashedPassword],
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Username or Email already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// user Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // user session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.email = user.email;
    req.session.isAdmin = user.is_admin;

    res.json({
      message: "Login successful",
      username: user.username,
      isAdmin: user.is_admin,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// 3. User Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// current User Info
app.get("/api/user", (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      username: req.session.username,
      email: req.session.email,
      isAdmin: req.session.isAdmin,
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// change Password
app.post("/api/change-password", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  const { newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.session.userId,
    ]);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Server error during password update" });
  }
});

// update Finish Rates (Admin Only)
app.post("/api/update-rates", async (req, res) => {
  if (!req.session.isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Admin access required." });
  }

  const { rates } = req.body; // pormat ani { id, min_rate, max_rate }

  try {
    for (const rate of rates) {
      await pool.execute(
        "UPDATE finish_rates SET display_name = ?, min_rate = ?, max_rate = ?, image_url = ? WHERE id = ?",
        [rate.display_name, rate.min_rate, rate.max_rate, rate.image_url, rate.id],
      );
    }
    res.json({ message: "Rates updated successfully" });
  } catch (error) {
    console.error("Update rates error:", error);
    res.status(500).json({ error: "Server error during rates update" });
  }
});

// add Project Location (Admin Only)
app.post("/api/add-location", async (req, res) => {
  if (!req.session.isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Admin access required." });
  }

  const {
    project_name,
    category,
    description,
    latitude,
    longitude,
    image_url,
  } = req.body;

  try {
    const [result] = await pool.execute(
      "INSERT INTO project_locations (project_name, category, description, latitude, longitude, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      [project_name, category, description, latitude, longitude, image_url],
    );
    res
      .status(201)
      .json({ message: "Location added successfully", id: result.insertId });
  } catch (error) {
    console.error("Add location error:", error);
    res.status(500).json({ error: "Server error during location addition" });
  }
});

// update Project Location (Admin Only)
app.put("/api/update-location/:id", async (req, res) => {
  if (!req.session.isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Admin access required." });
  }

  const { id } = req.params;
  const {
    project_name,
    category,
    description,
    latitude,
    longitude,
    image_url,
  } = req.body;

  try {
    await pool.execute(
      "UPDATE project_locations SET project_name = ?, category = ?, description = ?, latitude = ?, longitude = ?, image_url = ? WHERE id = ?",
      [project_name, category, description, latitude, longitude, image_url, id],
    );
    res.json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({ error: "Server error during location update" });
  }
});

// delete Project Location (Admin Only)
app.delete("/api/delete-location/:id", async (req, res) => {
  if (!req.session.isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Admin access required." });
  }

  const { id } = req.params;

  try {
    await pool.execute("DELETE FROM project_locations WHERE id = ?", [id]);
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Delete location error:", error);
    res.status(500).json({ error: "Server error during location deletion" });
  }
});

// add New Finish Type (Admin Only)
app.post("/api/add-rate", async (req, res) => {
  if (!req.session.isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Admin access required." });
  }

  const { finish_type, display_name, min_rate, max_rate, image_url } = req.body;

  try {
    const [result] = await pool.execute(
      "INSERT INTO finish_rates (finish_type, display_name, min_rate, max_rate, image_url) VALUES (?, ?, ?, ?, ?)",
      [finish_type, display_name, min_rate, max_rate, image_url],
    );
    res
      .status(201)
      .json({ message: "Rate added successfully", id: result.insertId });
  } catch (error) {
    console.error("Add rate error:", error);
    res.status(500).json({ error: "Server error during rate addition" });
  }
});

// delete Finish Type (Admin Only)
app.delete("/api/delete-rate/:id", async (req, res) => {
  if (!req.session.isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Admin access required." });
  }

  const { id } = req.params;

  try {
    await pool.execute("DELETE FROM finish_rates WHERE id = ?", [id]);
    res.json({ message: "Rate deleted successfully" });
  } catch (error) {
    console.error("Delete rate error:", error);
    res.status(500).json({ error: "Server error during rate deletion" });
  }
});

// calc
app.get("/api/finish-rates", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM finish_rates");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching rates:", error);
    res.status(500).json({ error: "Could not fetch finish rates" });
  }
});

// map
app.get("/api/project-locations", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM project_locations");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Could not fetch project locations" });
  }
});

// root route sa home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
  console.log("connected to the MySQL database pool.");
});
