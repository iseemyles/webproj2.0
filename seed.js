import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const seedRates = [
  {
    finish_type: "basic",
    display_name: "Basic/Bare",
    min_rate: 15000,
    max_rate: 23000,
    image_url: "images/bare_typefinish.jpg",
  },
  {
    finish_type: "standard",
    display_name: "Standard",
    min_rate: 25000,
    max_rate: 40000,
    image_url: "images/standard_housefinish.jpg",
  },
  {
    finish_type: "highend",
    display_name: "High-End/Luxury",
    min_rate: 40000,
    max_rate: 60000,
    image_url: "images/luxury_housefinish.jpg",
  },
  {
    finish_type: "iconic",
    display_name: "Iconic",
    min_rate: 65000,
    max_rate: 65000,
    image_url: "images/iconic_housefinish.jpg",
  },
];

async function seed() {
  try {
    console.log("Seeding admin account...");

    // Clear existing admin if exists
    await pool.execute("DELETE FROM users WHERE username = ?", ["admin"]);

    const hashedAdminPassword = await bcrypt.hash("admin123", 10);

    await pool.execute(
      "INSERT INTO users (first_name, last_name, username, email, password, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
      [
        "System",
        "Administrator",
        "admin",
        "admin@email.com",
        hashedAdminPassword,
        true,
      ],
    );

    console.log("Seeding finish rates...");

    // Clear existing rates
    await pool.execute("DELETE FROM finish_rates");

    for (const rate of seedRates) {
      await pool.execute(
        "INSERT INTO finish_rates (finish_type, display_name, min_rate, max_rate, image_url) VALUES (?, ?, ?, ?, ?)",
        [
          rate.finish_type,
          rate.display_name,
          rate.min_rate,
          rate.max_rate,
          rate.image_url,
        ],
      );
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
