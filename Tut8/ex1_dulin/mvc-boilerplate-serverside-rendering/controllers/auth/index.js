'use strict';

const db = require('../../db');
const bcrypt = require('bcrypt');

exports.name = 'auth';
exports.prefix = '';

exports.routes = [
  { method: 'get', path: '/register', handler: 'registerForm' },
  { method: 'post', path: '/register', handler: 'registerAction' },
  { method: 'get', path: '/login', handler: 'loginForm' },
  { method: 'post', path: '/login', handler: 'loginAction' },
  { method: 'get', path: '/logout', handler: 'logoutAction' }
];

exports.registerForm = function(req, res){
  res.render('register');
};

exports.registerAction = async function(req, res, next){
  const { full_name, email, password, confirm_password } = req.body;

  if (password !== confirm_password) {
    res.message('Passwords do not match');
    return res.redirect('back');
  }

  if (!email.endsWith('@my.westminster.ac.uk')) {
    res.message('Registration is restricted to @my.westminster.ac.uk domain emails only.');
    return res.redirect('back');
  }

  try {
    // Check if user already exists
    const existing = await db.query('SELECT * FROM alumni WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.message('Email is already registered.');
      return res.redirect('back');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO alumni (full_name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [full_name, email, hashedPassword]
    );

    res.message('Registration successful. Please login.');
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
};

exports.loginForm = function(req, res){
  res.render('login');
};

exports.loginAction = async function(req, res, next){
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM alumni WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.message('Invalid email or password.');
      return res.redirect('back');
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.message('Invalid email or password.');
      return res.redirect('back');
    }

    // Login successful
    req.session.userId = user.id;
    req.session.email = user.email;
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.logoutAction = function(req, res){
  req.session.destroy(function() {
    res.redirect('/login');
  });
};
