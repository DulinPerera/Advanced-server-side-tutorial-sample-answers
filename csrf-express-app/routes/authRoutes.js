const express = require("express");
const bcrypt = require("bcryptjs");
const csrf = require("csurf");
const { requireLogin } = require("../middleware/authMiddleware");

const router = express.Router();
const csrfProtection = csrf();

router.get("/register", csrfProtection, (req, res) => {
  res.render("register", { csrfToken: req.csrfToken(), error: null });
});

router.post("/register", csrfProtection, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = global.users.find((u) => u.email === email);
    if (existingUser) {
      return res.render("register", {
        csrfToken: req.csrfToken(),
        error: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    global.users.push({
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
    });

    res.redirect("/auth/login");
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

router.get("/login", csrfProtection, (req, res) => {
  res.render("login", { csrfToken: req.csrfToken(), error: null });
});

router.post("/login", csrfProtection, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = global.users.find((u) => u.email === email);
    if (!user) {
      return res.render("login", {
        csrfToken: req.csrfToken(),
        error: "Invalid email or password",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("login", {
        csrfToken: req.csrfToken(),
        error: "Invalid email or password",
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    res.redirect("/auth/dashboard");
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

router.get("/dashboard", csrfProtection, requireLogin, (req, res) => {
  res.render("dashboard", { csrfToken: req.csrfToken() });
});

router.post("/logout", csrfProtection, requireLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.render("error", { message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

router.get("/check-auth", requireLogin, (req, res) => {
  res.send(`Authenticated as ${req.session.user.name}`);
});

module.exports = router;
