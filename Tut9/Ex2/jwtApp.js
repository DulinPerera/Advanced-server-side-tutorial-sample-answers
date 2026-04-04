const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET = "jwtsecretkey";
const users = [{ id: 1, email: "test@test.com", password: "password123", name: "Test User" }];

// Login Route
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    SECRET,
    { expiresIn: "1h" }
  );

  res.json({ message: "Login successful", token });
});

// Verify Token Middleware
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
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Public Route
app.get("/api/publicInfo", (req, res) => {
    res.status(200).send("You are viewing public info");
});

// Protected Route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

app.listen(4000, () => {
  console.log("Task 2 JWT app running on http://localhost:4000");
  console.log(`\nTest commands:`);
  console.log(`1. GET Public Info: curl http://localhost:4000/api/publicInfo`);
  console.log(`2. Login: curl -X POST -H "Content-Type: application/json" -d "{\\"email\\":\\"test@test.com\\",\\"password\\":\\"password123\\"}" http://localhost:4000/api/login`);
  console.log(`3. GET Private Info: curl -H "Authorization: Bearer <TOKEN>" http://localhost:4000/api/protected\n`);
});
