# SkyRoute Airways — Mini Web Application

Experiment 8: a mini web application built with HTML, CSS, JavaScript, Node.js, Express.js and JSON as a simple database. The chosen scenario is an **airline ticket booking system**.

## How to run

```bash
cd SkyRouteBooking
npm install        # installs express
npm start          # or: node app.js
```

Open <http://localhost:3000>.

## Project structure

```
SkyRouteBooking/
├── app.js              Express server: routes, JSON read/write
├── users.json          registered travellers  (starts as [])
├── bookings.json       confirmed tickets      (starts as [])
├── flights.json        flight inventory (12 flights, pre-filled)
├── package.json
└── public/
    ├── index.html      landing page
    ├── register.html   registration form
    ├── login.html      login form
    ├── dashboard.html  booking dashboard
    ├── css/style.css
    └── js/script.js    validation + fetch calls for all pages
```

## Routes

| Method | Route | What it does |
|---|---|---|
| GET | `/` | landing page |
| GET | `/register` | registration page |
| POST | `/register` | reads `req.body`, validates, appends the user to `users.json` |
| GET | `/login` | login page |
| POST | `/login` | reads `users.json`, validates username/email + password |
| GET | `/dashboard` | dashboard page |
| GET | `/api/flights?from=&to=` | flight search from `flights.json` |
| POST | `/api/bookings` | books seats, generates a PNR, writes to `bookings.json` |
| GET | `/api/bookings/:username` | that traveller's bookings |
| POST | `/api/bookings/:pnr/cancel` | cancels a ticket and returns the seats to inventory |

## Application flow

Landing page → Register (data saved into `users.json`) → Login (credentials checked against `users.json`) → Dashboard (search flights, book a seat, get a PNR, view and cancel trips) → Logout back to the login page.

## Things worth pointing out in the viva

- **Old records are never lost.** `/register` reads the existing array, `push`es the new user and writes the whole array back, so every previous registration stays.
- **Validation runs twice.** The browser checks the form in `script.js` (name, DOB not in the future, 10-digit mobile starting 6–9, matching passwords) and the server checks again in `app.js`, because client-side checks can be bypassed.
- **Duplicate usernames and emails are rejected** with HTTP 409.
- **Login accepts either the username or the email**, case-insensitively, and the password is stripped out of the response before it is sent back to the browser.
- **Age is computed** from the date of birth at registration time.
- **Seat inventory is live.** Booking decrements `seatsLeft` in `flights.json`; cancelling adds the seats back.
- **Fare depends on cabin**: Economy ×1, Premium ×1.5, Business ×2.4, multiplied by the number of passengers.
- **Session handling** uses `sessionStorage` on the client; the dashboard redirects to `/login` if nobody is signed in.
- Passwords are stored as plain text because the exercise asks for it. In a real system you would hash them with `bcrypt` — say this if you are asked.

## Sample test data

Register a traveller, then sign in with the same credentials:

```
Name: Ravi Kumar      Username: ravi123
Email: ravi@gmail.com Password: ravi@123
Mobile: 9876543210    DOB: any past date
```

Then search HYD → DEL, pick SR 101, and book. A PNR like `EVAH4W` appears and the ticket shows up under **My trips**.
