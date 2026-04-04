const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

// In-memory user store (no DB needed for this exercise)
global.users = [];

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session setup
app.use(
    session({
        secret: "tut11-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 30, // 30 mins
        },
    })
);

// CSRF protection middleware
const csrfProtection = csrf({ cookie: false }); // uses session

// Make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ─── Auth guard ───────────────────────────────────────────────
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

// ─── Routes ───────────────────────────────────────────────────

// Home
app.get("/", (req, res) => {
    res.render("home");
});

// Register
app.get("/register", csrfProtection, (req, res) => {
    res.render("register", { csrfToken: req.csrfToken(), error: null });
});

app.post("/register", csrfProtection, async (req, res) => {
    const { name, email, password } = req.body;

    const exists = global.users.find((u) => u.email === email);
    if (exists) {
        return res.render("register", {
            csrfToken: req.csrfToken(),
            error: "Email already registered.",
        });
    }

    const hashed = await bcrypt.hash(password, 10);
    global.users.push({ id: Date.now(), name, email, password: hashed });
    res.redirect("/login");
});

// Login
app.get("/login", csrfProtection, (req, res) => {
    res.render("login", { csrfToken: req.csrfToken(), error: null });
});

app.post("/login", csrfProtection, async (req, res) => {
    const { email, password } = req.body;

    const user = global.users.find((u) => u.email === email);
    if (!user) {
        return res.render("login", {
            csrfToken: req.csrfToken(),
            error: "Invalid email or password.",
        });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.render("login", {
            csrfToken: req.csrfToken(),
            error: "Invalid email or password.",
        });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.redirect("/dashboard");
});

// Dashboard (protected)
app.get("/dashboard", csrfProtection, requireLogin, (req, res) => {
    res.render("dashboard", { csrfToken: req.csrfToken() });
});

// Logout (POST, CSRF protected)
app.post("/logout", csrfProtection, requireLogin, (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

// ─── CSRF Attack simulation ────────────────────────────────────
app.get("/attack", (req, res) => {
    res.render("attack");
});

// ─── CSRF Error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).render("error", {
            message: "CSRF token missing or invalid. Request blocked!",
        });
    }
    console.error(err.stack);
    res.status(500).render("error", { message: err.message || "Server error" });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Tut11 Ex1 running at http://localhost:${PORT}`);
});
