/* ==========================================================
   SkyRoute Airways — client side script
   One file serves every page; the page is picked up from
   <body data-page="...">
   ========================================================== */

const page = document.body.dataset.page;

/* ---------- small helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function showMsg(text, kind) {
  const box = $("#formMsg") || $("#searchMsg");
  if (!box) return;
  box.textContent = text;
  box.className = "msg show " + (kind === "ok" ? "ok" : "bad");
  box.scrollIntoView({ block: "nearest" });
}

function clearMsg() {
  const box = $("#formMsg") || $("#searchMsg");
  if (box) box.className = "msg";
}

function setError(name, text) {
  const slot = $('[data-error-for="' + name + '"]');
  const input = document.getElementById(name);
  if (slot) slot.textContent = text || "";
  if (input) input.classList.toggle("invalid", Boolean(text));
}

function clearErrors() {
  $$("[data-error-for]").forEach(el => (el.textContent = ""));
  $$(".invalid").forEach(el => el.classList.remove("invalid"));
}

function rupees(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function prettyDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* session helpers — the signed in traveller */
const session = {
  save(user) { sessionStorage.setItem("skyroute_user", JSON.stringify(user)); },
  get() {
    try { return JSON.parse(sessionStorage.getItem("skyroute_user")); }
    catch { return null; }
  },
  clear() { sessionStorage.removeItem("skyroute_user"); }
};

/* ==========================================================
   HOME PAGE — just a live clock on the departures board
   ========================================================== */
if (page === "home") {
  const clock = $("#boardClock");
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: false
    }) + " IST";
  };
  tick();
  setInterval(tick, 1000 * 30);
}

/* ==========================================================
   REGISTRATION PAGE
   ========================================================== */
if (page === "register") {
  const form = $("#registerForm");

  // stop people picking a future date of birth
  $("#dob").max = new Date().toISOString().split("T")[0];

  function validate(data) {
    let ok = true;
    clearErrors();

    if (!data.fullName || data.fullName.trim().length < 3) {
      setError("fullName", "Enter your full name as printed on your ID."); ok = false;
    }
    if (!data.dob) {
      setError("dob", "Pick your date of birth."); ok = false;
    } else if (new Date(data.dob) > new Date()) {
      setError("dob", "Date of birth cannot be in the future."); ok = false;
    }
    if (!data.gender) { setError("gender", "Select one option."); ok = false; }

    if (!/^[6-9]\d{9}$/.test(data.mobile || "")) {
      setError("mobile", "10 digits, starting with 6, 7, 8 or 9."); ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) {
      setError("email", "That email address does not look right."); ok = false;
    }
    if (!data.username || data.username.length < 4) {
      setError("username", "Use at least 4 characters."); ok = false;
    }
    if (!data.password || data.password.length < 6) {
      setError("password", "Use at least 6 characters."); ok = false;
    }
    if (data.password !== $("#confirm").value) {
      setError("confirm", "Both passwords must match."); ok = false;
    }
    if (!data.city) { setError("city", "Choose your home airport city."); ok = false; }
    if (!data.address || data.address.trim().length < 8) {
      setError("address", "Enter a billing address we can print on the invoice."); ok = false;
    }
    return ok;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg();

    const gender = $('input[name="gender"]:checked');
    const data = {
      fullName: $("#fullName").value.trim(),
      dob: $("#dob").value,
      gender: gender ? gender.value : "",
      email: $("#email").value.trim(),
      mobile: $("#mobile").value.trim(),
      username: $("#username").value.trim(),
      password: $("#password").value,
      address: $("#address").value.trim(),
      city: $("#city").value,
      passport: $("#passport").value.trim()
    };

    if (!validate(data)) {
      showMsg("Check the highlighted fields and try again.", "bad");
      return;
    }

    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.textContent = "Creating account…";

    try {
      // POST the form data to the Express backend
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const out = await res.json();

      if (out.success) {
        showMsg("Account created for " + out.user.username + ". Taking you to sign in…", "ok");
        form.reset();
        setTimeout(() => (window.location.href = "/login"), 1400);
      } else {
        showMsg(out.message, "bad");
        btn.disabled = false;
        btn.textContent = "Create account";
      }
    } catch (err) {
      showMsg("Could not reach the server. Is it still running?", "bad");
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });
}

/* ==========================================================
   LOGIN PAGE
   ========================================================== */
if (page === "login") {
  const form = $("#loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg();
    clearErrors();

    const loginId = $("#loginId").value.trim();
    const password = $("#password").value;

    let ok = true;
    if (!loginId) { setError("loginId", "Enter your username or email."); ok = false; }
    if (!password) { setError("password", "Enter your password."); ok = false; }
    if (!ok) return;

    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.textContent = "Checking…";

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password })
      });
      const out = await res.json();

      if (out.success) {
        session.save(out.user);
        showMsg("Signed in. Opening your dashboard…", "ok");
        setTimeout(() => (window.location.href = "/dashboard"), 700);
      } else {
        showMsg(out.message, "bad");
        btn.disabled = false;
        btn.textContent = "Sign in";
      }
    } catch (err) {
      showMsg("Could not reach the server. Is it still running?", "bad");
      btn.disabled = false;
      btn.textContent = "Sign in";
    }
  });
}

/* ==========================================================
   DASHBOARD
   ========================================================== */
if (page === "dashboard") {
  const user = session.get();

  // guard: nobody gets in without signing in
  if (!user) {
    window.location.href = "/login";
  } else {
    $("#greeting").textContent = "Welcome back, " + user.fullName.split(" ")[0];
    $("#greetingSub").textContent = "Signed in as " + user.username + " · home airport " + (user.city || "not set");
    $("#pName").textContent = user.fullName;
    $("#pMiles").textContent = Number(user.skyMiles || 0).toLocaleString("en-IN");
    $("#pTier").textContent = user.tier || "Blue";
    $("#footUser").textContent = user.username;

    $("#profileCards").innerHTML = [
      ["Email", user.email],
      ["Mobile", user.mobile],
      ["Date of birth", prettyDate(user.dob) + " · age " + user.age],
      ["Gender", user.gender],
      ["Passport", user.passport || "Not added yet"],
      ["Billing address", user.address],
      ["Member since", prettyDate(user.joinedOn)]
    ].map(([k, v]) => '<div class="card"><h3>' + k + "</h3><p>" + v + "</p></div>").join("");

    // default travel date = tomorrow
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    $("#date").value = tomorrow;
    $("#date").min = new Date().toISOString().split("T")[0];

    /* ---------- logout ---------- */
    $("#logoutBtn").addEventListener("click", () => {
      session.clear();
      window.location.href = "/login";
    });

    /* ---------- search flights ---------- */
    async function searchFlights() {
      const from = $("#from").value;
      const to = $("#to").value;
      const date = $("#date").value;
      clearMsg();

      if (from && to && from === to) {
        showMsg("Origin and destination cannot be the same airport.", "bad");
        return;
      }
      if (!date) {
        showMsg("Pick a travel date first.", "bad");
        return;
      }

      const res = await fetch("/api/flights?from=" + from + "&to=" + to);
      const out = await res.json();
      renderFlights(out.flights);
    }

    function renderFlights(flights) {
      const box = $("#results");
      if (!flights.length) {
        box.innerHTML = '<div class="empty"><b>No flights on that route</b>Try a different pair of airports, or set one of them to "Any".</div>';
        return;
      }

      const cabin = $("#cabin").value;
      const pax = Number($("#pax").value);
      const mult = cabin === "Business" ? 2.4 : cabin === "Premium" ? 1.5 : 1;

      box.innerHTML = flights.map(f => {
        const total = Math.round(f.price * mult * pax);
        const soldOut = f.seatsLeft < pax;
        return (
          '<div class="flight">' +
            '<div class="flight-no">' + f.flightNo + "<small>" + f.aircraft + "</small></div>" +
            '<div class="leg">' +
              "<div><div class='time'>" + f.depart + "</div><div class='code'>" + f.fromCode + " · " + f.from + "</div></div>" +
              "<div class='path'>" + f.duration + " · " + f.stops + "</div>" +
              "<div><div class='time'>" + f.arrive + "</div><div class='code'>" + f.toCode + " · " + f.to + "</div></div>" +
            "</div>" +
            '<div class="fare">' +
              "<b>" + rupees(total) + "</b>" +
              "<small>" + cabin + " · " + pax + (pax > 1 ? " travellers" : " traveller") + "</small>" +
              (f.seatsLeft <= 15 ? "<div class='seats-left'>Only " + f.seatsLeft + " seats left</div>" : "") +
              "<button class='btn btn-teal btn-small' style='margin-top:8px' data-book='" + f.id + "'" +
                (soldOut ? " disabled" : "") + ">" +
                (soldOut ? "Not enough seats" : "Book now") +
              "</button>" +
            "</div>" +
          "</div>"
        );
      }).join("");

      $$("[data-book]", box).forEach(btn => {
        btn.addEventListener("click", () => bookFlight(btn.dataset.book, btn));
      });
    }

    /* ---------- book a flight ---------- */
    async function bookFlight(flightId, btn) {
      btn.disabled = true;
      btn.textContent = "Booking…";

      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            flightId,
            travelDate: $("#date").value,
            passengers: Number($("#pax").value),
            travelClass: $("#cabin").value
          })
        });
        const out = await res.json();

        if (out.success) {
          user.skyMiles = out.skyMiles;
          session.save(user);
          $("#pMiles").textContent = Number(out.skyMiles).toLocaleString("en-IN");
          openModal(out.booking);
          loadTrips();
          searchFlights();   // refresh seat counts
        } else {
          showMsg(out.message, "bad");
          btn.disabled = false;
          btn.textContent = "Book now";
        }
      } catch (err) {
        showMsg("Booking failed. Check that the server is running.", "bad");
        btn.disabled = false;
        btn.textContent = "Book now";
      }
    }

    /* ---------- my trips ---------- */
    async function loadTrips() {
      const res = await fetch("/api/bookings/" + encodeURIComponent(user.username));
      const out = await res.json();
      const box = $("#tripList");

      $("#pTrips").textContent = out.bookings.filter(b => b.status === "Confirmed").length;

      if (!out.bookings.length) {
        box.innerHTML = '<div class="empty"><b>No trips yet</b>Search a route above and your booking will show up here.</div>';
        return;
      }

      box.innerHTML = out.bookings.map(b =>
        '<div class="ticket">' +
          '<div class="ticket-stub"><small>PNR</small><b>' + b.pnr + "</b></div>" +
          '<div class="ticket-body">' +
            "<div>" +
              "<h4>" + b.from + " → " + b.to + " · " + b.flightNo + "</h4>" +
              "<p>" + prettyDate(b.travelDate) + " · departs " + b.depart + " · arrives " + b.arrive + "</p>" +
              "<p>" + b.travelClass + " · " + b.passengers + (b.passengers > 1 ? " seats" : " seat") + " · " + rupees(b.fare) + "</p>" +
            "</div>" +
            "<div style='text-align:right'>" +
              '<span class="pill ' + (b.status === "Confirmed" ? "confirmed" : "cancelled") + '">' + b.status + "</span>" +
              (b.status === "Confirmed"
                ? "<div><button class='btn btn-outline btn-small' style='margin-top:10px' data-cancel='" + b.pnr + "'>Cancel booking</button></div>"
                : "") +
            "</div>" +
          "</div>" +
        "</div>"
      ).join("");

      $$("[data-cancel]", box).forEach(btn => {
        btn.addEventListener("click", () => cancelBooking(btn.dataset.cancel, btn));
      });
    }

    async function cancelBooking(pnr, btn) {
      if (!confirm("Cancel booking " + pnr + "? The seats go back on sale straight away.")) return;
      btn.disabled = true;
      btn.textContent = "Cancelling…";

      const res = await fetch("/api/bookings/" + pnr + "/cancel", { method: "POST" });
      const out = await res.json();

      if (out.success) {
        loadTrips();
        searchFlights();
      } else {
        showMsg(out.message, "bad");
        btn.disabled = false;
        btn.textContent = "Cancel booking";
      }
    }

    /* ---------- confirmation modal ---------- */
    function openModal(b) {
      $("#modalBody").innerHTML =
        "<p style='margin-bottom:14px'>" + b.from + " → " + b.to + " on " + prettyDate(b.travelDate) + "</p>" +
        "<div class='ticket'><div class='ticket-stub'><small>PNR</small><b>" + b.pnr + "</b></div>" +
        "<div class='ticket-body'><div><h4>" + b.flightNo + " · " + b.depart + " – " + b.arrive + "</h4>" +
        "<p>" + b.travelClass + " · " + b.passengers + " seat(s)</p>" +
        "<p><b>" + rupees(b.fare) + "</b> paid</p></div></div></div>";
      $("#modalBg").classList.add("show");
    }

    $("#modalClose").addEventListener("click", () => $("#modalBg").classList.remove("show"));
    $("#modalBg").addEventListener("click", (e) => {
      if (e.target.id === "modalBg") $("#modalBg").classList.remove("show");
    });

    /* ---------- wire up ---------- */
    $("#searchBtn").addEventListener("click", searchFlights);
    ["pax", "cabin"].forEach(id => $("#" + id).addEventListener("change", searchFlights));

    searchFlights();
    loadTrips();
  }
}
