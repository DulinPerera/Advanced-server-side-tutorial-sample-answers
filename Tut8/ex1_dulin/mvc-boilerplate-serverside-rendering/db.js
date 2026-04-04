'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Tuts',
  password: '1234',
  port: 5432,
});

const setupTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alumni (
        id SERIAL PRIMARY KEY,
        full_name Varchar(100) NOT NULL,
        email Varchar(150) UNIQUE NOT NULL,
        password Varchar(255) NOT NULL,
        profile_image Varchar(255),
        linkedin_profile Varchar(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS qualifications (
        id SERIAL PRIMARY KEY,
        alumni_id INT REFERENCES alumni(id) ON DELETE CASCADE,
        type Varchar(50) NOT NULL,
        name Varchar(150) NOT NULL,
        institution Varchar(150) NOT NULL,
        year INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employment_history (
        id SERIAL PRIMARY KEY,
        alumni_id INT REFERENCES alumni(id) ON DELETE CASCADE,
        company Varchar(150) NOT NULL,
        role Varchar(150) NOT NULL,
        start_year INT,
        end_year INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables verified/created successfully.');
  } catch (err) {
    console.error('Error creating tables: ', err);
  }
};

module.exports = {
  pool,
  setupTables,
  query: (text, params) => pool.query(text, params),
};
