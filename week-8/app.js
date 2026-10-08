/* ============================================================
   SkyRoute Airways - Express.js backend
   Experiment 8: Mini Web Application using Node.js & Express.js
   JSON files are used as a simple database.
   ============================================================ */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- File paths (our "database") ---------- */
const USERS_FILE = path.join(__dirname, "users.json");
const BOOKINGS_FILE = path.join(__dirname, "bookings.json");
const FLIGHTS_FILE = path.join(__dirname, "flights.json");

/* ---------- Middleware ---------- */
app.use(express.json());                          // parse JSON bodies -> req.body
app.use(express.urlencoded({ extended: true }));  // parse form bodies -> req.body
app.use(express.static(path.join(__dirname, "public"))); // serve frontend files

/* ---------- JSON helpers ---------- */
function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const raw = fs.readFileSync(file, "utf-8").trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("Could not read " + file + ":", err.message);
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function makePNR() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) {
    pnr += chars[Math.floor(Math.random() * chars.length)];
  }
  return pnr;
}

/* ============================================================
   PAGE ROUTES  (GET)
   ============================================================ */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* ============================================================
   REGISTRATION  (POST /register)
   Stores the traveller in users.json without deleting old ones.
   ============================================================ */
app.post("/register", (req, res) => {
  const {
    fullName, dob, gender, email, mobile,
    username, password, address, city, passport
  } = req.body;

  // --- server side validation ---
  if (!fullName || !dob || !gender || !email || !mobile || !username || !password || !address) {
    return res.status(400).json({
      success: false,
      message: "Fill in every required field before creating the account."
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Enter a valid email address." });
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: "Mobile number must be 10 digits starting with 6-9." });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password needs at least 6 characters." });
  }

  const users = readJSON(USERS_FILE, []);

  // --- duplicate checks ---
  const takenUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (takenUser) {
    return res.status(409).json({ success: false, message: "That username is already taken. Pick another one." });
  }

  const takenMail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (takenMail) {
    return res.status(409).json({ success: false, message: "An account already exists with this email. Sign in instead." });
  }

  // --- calculate age from date of birth ---
  const birth = new Date(dob);
  let age = new Date().getFullYear() - birth.getFullYear();
  const m = new Date().getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && new Date().getDate() < birth.getDate())) age--;

  const newUser = {
    id: Date.now(),
    fullName,
    age,
    dob,
    gender,
    email,
    mobile,
    username,
    password,          // kept plain for this lab; hash with bcrypt in production
    address,
    city: city || "",
    passport: passport || "",
    skyMiles: 500,     // welcome bonus
    tier: "Blue",
    joinedOn: new Date().toISOString().split("T")[0]
  };

  users.push(newUser);        // old records stay, new one is appended
  writeJSON(USERS_FILE, users);

  res.status(201).json({
    success: true,
    message: "Account created. You can sign in now.",
    user: { username: newUser.username, fullName: newUser.fullName }
  });
});

/* ============================================================
   LOGIN  (POST /login)
   Reads users.json and validates the credentials.
   ============================================================ */
app.post("/login", (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: "Enter your username/email and password." });
  }

  const users = readJSON(USERS_FILE, []);
  const key = loginId.trim().toLowerCase();

  const user = users.find(u =>
    u.username.toLowerCase() === key || u.email.toLowerCase() === key
  );

  if (!user) {
    return res.status(401).json({ success: false, message: "No account found with that username or email." });
  }

  if (user.password !== password) {
    return res.status(401).json({ success: false, message: "Wrong password. Try again." });
  }

  // never send the password back to the browser
  const { password: _pw, ...safeUser } = user;

  res.json({ success: true, message: "Signed in", user: safeUser });
});

/* ============================================================
   FLIGHTS  (GET /api/flights)
   Optional query: ?from=HYD&to=DEL&date=2026-09-25
   ============================================================ */
app.get("/api/flights", (req, res) => {
  const { from, to } = req.query;
  let flights = readJSON(FLIGHTS_FILE, []);

  if (from) flights = flights.filter(f => f.fromCode === from.toUpperCase());
  if (to)   flights = flights.filter(f => f.toCode === to.toUpperCase());

  res.json({ success: true, count: flights.length, flights });
});

/* ============================================================
   BOOK A SEAT  (POST /api/bookings)
   ============================================================ */
app.post("/api/bookings", (req, res) => {
  const { username, flightId, travelDate, passengers, travelClass } = req.body;

  if (!username || !flightId || !travelDate || !passengers) {
    return res.status(400).json({ success: false, message: "Booking details are incomplete." });
  }

  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, message: "Session expired. Sign in again." });
  }

  const flights = readJSON(FLIGHTS_FILE, []);
  const flight = flights.find(f => f.id === flightId);
  if (!flight) {
    return res.status(404).json({ success: false, message: "That flight is no longer listed." });
  }

  const seats = Number(passengers);
  if (seats < 1 || seats > 6) {
    return res.status(400).json({ success: false, message: "Book between 1 and 6 seats per booking." });
  }
  if (flight.seatsLeft < seats) {
    return res.status(409).json({ success: false, message: "Only " + flight.seatsLeft + " seats left on this flight." });
  }

  const multiplier = travelClass === "Business" ? 2.4 : travelClass === "Premium" ? 1.5 : 1;
  const fare = Math.round(flight.price * multiplier * seats);

  const booking = {
    pnr: makePNR(),
    username,
    flightId: flight.id,
    airline: flight.airline,
    flightNo: flight.flightNo,
    from: flight.from,
    fromCode: flight.fromCode,
    to: flight.to,
    toCode: flight.toCode,
    depart: flight.depart,
    arrive: flight.arrive,
    duration: flight.duration,
    travelDate,
    travelClass: travelClass || "Economy",
    passengers: seats,
    fare,
    status: "Confirmed",
    bookedOn: new Date().toISOString()
  };

  // update seat inventory
  flight.seatsLeft -= seats;
  writeJSON(FLIGHTS_FILE, flights);

  const bookings = readJSON(BOOKINGS_FILE, []);
  bookings.push(booking);
  writeJSON(BOOKINGS_FILE, bookings);

  // reward sky miles
  user.skyMiles += seats * 120;
  if (user.skyMiles > 3000) user.tier = "Silver";
  if (user.skyMiles > 8000) user.tier = "Gold";
  writeJSON(USERS_FILE, users);

  res.status(201).json({ success: true, message: "Booking confirmed", booking, skyMiles: user.skyMiles });
});

/* ============================================================
   MY BOOKINGS  (GET /api/bookings/:username)
   ============================================================ */
app.get("/api/bookings/:username", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE, [])
    .filter(b => b.username === req.params.username)
    .reverse();

  res.json({ success: true, count: bookings.length, bookings });
});

/* ============================================================
   CANCEL A BOOKING  (POST /api/bookings/:pnr/cancel)
   ============================================================ */
app.post("/api/bookings/:pnr/cancel", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE, []);
  const booking = bookings.find(b => b.pnr === req.params.pnr);

  if (!booking) {
    return res.status(404).json({ success: false, message: "No booking found for PNR " + req.params.pnr });
  }
  if (booking.status === "Cancelled") {
    return res.status(400).json({ success: false, message: "This booking was already cancelled." });
  }

  booking.status = "Cancelled";
  writeJSON(BOOKINGS_FILE, bookings);

  // return the seats to inventory
  const flights = readJSON(FLIGHTS_FILE, []);
  const flight = flights.find(f => f.id === booking.flightId);
  if (flight) {
    flight.seatsLeft += booking.passengers;
    writeJSON(FLIGHTS_FILE, flights);
  }

  res.json({ success: true, message: "Booking " + booking.pnr + " cancelled", booking });
});

/* ---------- 404 fallback ---------- */
app.use((req, res) => {
  res.status(404).send("<h1 style='font-family:sans-serif'>404 &mdash; page not found</h1><a href='/'>Back to SkyRoute</a>");
});

app.listen(PORT, () => {
  console.log("SkyRoute Airways is running at http://localhost:" + PORT);
});
