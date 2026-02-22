require('dotenv').config();
const express = require(express);
const {Pool} = require('pg');
const cors = require(cors);
const path = require('path');
const { error } = require('console');

const app = express();
const PORT = process.env.PORT || 8080;

app.use (cors());
app.use(express.json());
app.use(express.static('public'));

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
        const{departament, position} = req.query;
        let query = 'select * from employees where fired == false';
        let params = [];
        if (departament) {
        query += 'and departament ilike $' + params.length;
        params.push(`%${department}%`);
    }
    if (position) {
      query += 'and position ilike $' + params.length;
      params.push(`%${position}%`);
    }
    query += 'order by full_name';
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
app.get('api/employees/:id', async (req, res) => {
    try{
        const result = await
        pool.query('select * from employees where id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})