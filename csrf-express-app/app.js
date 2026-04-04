const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const attackRoutes = require("./routes/attackRoutes");

const app = express();

global.users = [];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 30,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.use("/auth", authRoutes);
app.use("/attack", attackRoutes);

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).render("error", {
      message: "Form tampered with or CSRF token missing.",
    });
  }

  console.error(err.stack);
  res.status(500).render("error", {
    message: err.message || "Something went wrong",
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
