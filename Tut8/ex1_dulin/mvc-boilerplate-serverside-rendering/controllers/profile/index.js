'use strict';

const db = require('../../db');
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.session.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

exports.name = 'profile';
exports.prefix = '/profile';

// Protect all profile routes
exports.before = function(req, res, next) {
  if (!req.session.userId) {
    res.message('You must be logged in to view your profile.');
    return res.redirect('/login');
  }
  next();
};

exports.routes = [
  { method: 'get', path: '', handler: 'dashboard' },
  { method: 'post', path: '/update', handler: 'updateInfo' },
  // Need to export the multer middleware usage, 
  // but boot.js doesn't support an array of middlewares per custom route yet. 
  // We can just call upload inside the handler? Multer handles req/res directly, 
  // so we can wrap the handler.
  { method: 'post', path: '/upload', handler: 'uploadImage' },
  { method: 'post', path: '/qualification', handler: 'addQualification' },
  { method: 'post', path: '/employment', handler: 'addEmployment' },
  { method: 'get', path: '/qualification/:id/delete', handler: 'deleteQualification' },
  { method: 'get', path: '/employment/:id/delete', handler: 'deleteEmployment' }
];

exports.dashboard = async function(req, res, next) {
  try {
    const userResult = await db.query('SELECT * FROM alumni WHERE id = $1', [req.session.userId]);
    const qualResult = await db.query('SELECT * FROM qualifications WHERE alumni_id = $1 ORDER BY year DESC', [req.session.userId]);
    const empResult = await db.query('SELECT * FROM employment_history WHERE alumni_id = $1 ORDER BY start_year DESC', [req.session.userId]);

    if (userResult.rows.length === 0) {
      req.session.destroy();
      return res.redirect('/login');
    }

    res.render('dashboard', {
      user: userResult.rows[0],
      qualifications: qualResult.rows,
      employments: empResult.rows
    });
  } catch (err) {
    next(err);
  }
};

exports.updateInfo = async function(req, res, next) {
  const { full_name, linkedin_profile } = req.body;
  try {
    await db.query(
      'UPDATE alumni SET full_name = $1, linkedin_profile = $2 WHERE id = $3',
      [full_name, linkedin_profile, req.session.userId]
    );
    res.message('Profile updated successfully.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = function(req, res, next) {
  const uploadSingle = upload.single('profile_image');
  uploadSingle(req, res, async function(err) {
    if (err) {
      res.message('Error uploading image.');
      return res.redirect('/profile');
    }
    if (!req.file) {
      res.message('No image provided.');
      return res.redirect('/profile');
    }
    
    try {
      const filename = '/uploads/' + req.file.filename;
      await db.query('UPDATE alumni SET profile_image = $1 WHERE id = $2', [filename, req.session.userId]);
      res.message('Profile image uploaded successfully.');
      res.redirect('/profile');
    } catch (dbErr) {
      next(dbErr);
    }
  });
};

exports.addQualification = async function(req, res, next) {
  const { type, name, institution, year } = req.body;
  try {
    await db.query(
      'INSERT INTO qualifications (alumni_id, type, name, institution, year) VALUES ($1, $2, $3, $4, $5)',
      [req.session.userId, type, name, institution, year]
    );
    res.message('Qualification added.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.addEmployment = async function(req, res, next) {
  const { company, role, start_year, end_year } = req.body;
  try {
    await db.query(
      'INSERT INTO employment_history (alumni_id, company, role, start_year, end_year) VALUES ($1, $2, $3, $4, $5)',
      [req.session.userId, company, role, start_year, end_year || null]
    );
    res.message('Employment record added.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.deleteQualification = async function(req, res, next) {
  try {
    const qualId = req.params.id;
    await db.query('DELETE FROM qualifications WHERE id = $1 AND alumni_id = $2', [qualId, req.session.userId]);
    res.message('Qualification removed.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployment = async function(req, res, next) {
  try {
    const empId = req.params.id;
    await db.query('DELETE FROM employment_history WHERE id = $1 AND alumni_id = $2', [empId, req.session.userId]);
    res.message('Employment record removed.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};
