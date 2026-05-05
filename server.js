const { app } = require('./app'); 
const { createDatabaseIfNotExists } = require('./dbInit'); 
const PORT = process.env.PORT || 8080;


const { Pool } = require('pg');

const adminPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});


async function initTable() {
    const { pool } = require('./app');
    const tableCheck = await pool.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'employees'
        );
    `);
    if (!tableCheck.rows[0].exists) {
        console.log('Создание таблицы employees...');
        await pool.query(`
            CREATE TABLE employees (
                id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                full_name VARCHAR(255) NOT NULL,
                birth_date DATE,
                passport VARCHAR(20),
                contacts VARCHAR(100),
                address TEXT,
                department VARCHAR(100),
                position VARCHAR(100),
                salary DECIMAL(10,2),
                hire_date DATE,
                fired BOOLEAN DEFAULT FALSE
            )
        `);
        console.log('Таблица employees создана');
    } else {
        console.log('Таблица employees уже существует');
    }
}

if (require.main === module) {
    (async () => {
        try {
            await createDatabaseIfNotExists();
            await initMainPool();
            await initTable();
            app.listen(PORT, () => {
                console.log(`Сервер запущен на http://localhost:${PORT}`);
            });
        } catch (err) {
            console.error('Не удалось запустить сервер:', err);
            process.exit(1);
        }
    })();
}