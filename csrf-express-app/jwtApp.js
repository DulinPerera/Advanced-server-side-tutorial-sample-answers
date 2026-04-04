const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET = "jwtsecretkey";
const users = [{ id: 1, email: "test@test.com", password: "123456" }];

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

app.listen(4000, () => {
  console.log("JWT app running on http://localhost:4000");
});
