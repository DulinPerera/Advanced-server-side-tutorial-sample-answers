const express = require('express');
const session = require('express-session');
const path = require('path');  // important for views
const authRoutes = require('./routes/authRoutes');

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // views folder

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set false for local dev
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Serve EJS pages
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('dashboard', { user: { email: req.session.email } });
});

// API routes
app.use('/api/auth', authRoutes);

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));