require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('web'));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// маршруты
app.get('/api/employees', async (req, res) => {
  try {
    const { department, position } = req.query;
    let query = 'SELECT * FROM employees';
    let params = [];
    let conditions = [];

    if (department && department.trim() !== '') {
      params.push(`%${department}%`);
      conditions.push(`department ILIKE $${params.length}`);
    }
    if (position && position.trim() !== '') {
      params.push(`%${position}%`);
      conditions.push(`position ILIKE $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY fired ASC, full_name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees/search/:name', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE full_name ILIKE $1',
      [`%${req.params.name}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, full_name, birth_date::text AS birth_date,
        passport, contacts, address, department, position,
        salary, hire_date::text AS hire_date, fired
      FROM employees WHERE id = $1
    `, [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { full_name, birth_date, passport, contacts, address, department, position, salary, hire_date } = req.body;
    const result = await pool.query(
      `INSERT INTO employees (full_name, birth_date, passport, contacts, address, department, position, salary, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [full_name, birth_date, passport, contacts, address, department, position, salary, hire_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const emp = await pool.query('SELECT fired FROM employees WHERE id = $1', [req.params.id]);
    if (emp.rows[0].fired) {
      return res.status(403).json({ error: 'Уволенного сотрудника невозможно редактировать' });
    }
    const fields = Object.keys(req.body).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = Object.values(req.body);
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE employees SET ${fields} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/employees/:id/fire', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE employees SET fired = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});


module.exports = { app, pool };