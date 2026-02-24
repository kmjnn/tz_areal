require('dotenv').config();
const express = require('express');
const {Pool} = require('pg');
const cors = require('cors');
const path = require('path');
const { error } = require('console');

const app = express();
const PORT = process.env.PORT || 8080;

app.use (cors());
app.use(express.json());
app.use(express.static('web'));

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// все сотрудники
app.get('/api/employees', async (req, res) => {
    try {
        const { department, position } = req.query;
        let query = 'select * from employees';
        let params = [];
        let conditions = [];
        
        if (department && department.trim() !== '') {
            params.push(`%${department}%`);
            conditions.push(`department ilike $${params.length}`);
        }
        
        if (position && position.trim() !== '') {
            params.push(`%${position}%`);
            conditions.push(`position ilike $${params.length}`);
        }
        if (conditions.length > 0) {
            query += ' where ' + conditions.join(' and ');
        }
        query += ' order by fired asc, full_name asc';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//сортировка по имени
app.get('/api/employees/search/:name', async (req, res) => {
    try{
        const result = await pool.query('select * from employees where full_name ilike $1',
            [`%${req.params.name}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

//один по id
app.get('/api/employees/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            select 
                id, 
                full_name, 
                birth_date::text as birth_date,
                passport, 
                contacts, 
                address, 
                department, 
                position, 
                salary, 
                hire_date::text as hire_date,
                fired 
            from employees 
            where id = $1
        `, [req.params.id]);
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

//CRUD
//create
app.post('/api/employees', async (req, res) => {
    try{
        const{full_name, birth_date, passport, contacts, address, department, position, salary, hire_date} = req.body;
        const result = await pool.query(
            `insert into employees (full_name, birth_date, passport, contacts, address, department, position, salary, hire_date)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
            [full_name, birth_date, passport, contacts, address, department, position, salary, hire_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update
app.put('/api/employees/:id', async (req, res) => {
  try {
    const emp = await pool.query('select fired from employees where id = $1', [req.params.id]);
    if (emp.rows[0].fired) {
      return res.status(403).json({ error: 'Уволенного сотрудника невозможно редактировать' });
    }
    const fields = Object.keys(req.body).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = Object.values(req.body);
    values.push(req.params.id);
    const result = await pool.query(`update employees set ${fields} where id = $${values.length} returning *`, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//delete - dismissal
app.patch('/api/employees/:id/fire', async (req, res) => {
  try {
    const result = await pool.query('UPDATE employees SET fired = true WHERE id = $1 RETURNING *', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/api/test', (req, res) => {
    res.json({ message: 'Сервер работает!' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
