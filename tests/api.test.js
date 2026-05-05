const request = require('supertest');

jest.mock('pg', () => {
  const mockQuery = jest.fn();
  const mockPool = {
    query: mockQuery,
    connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
  };
  return { Pool: jest.fn(() => mockPool) };
});

const { app } = require('../app');
const { Pool } = require('pg');
const mockPool = new Pool();

describe('API сотрудников', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/employees возвращает список', async () => {
    const mockEmployees = [
      {
        id: 1,
        full_name: 'Иван Иванов',
        birth_date: '2001-01-01',
        passport: '4512 345678',
        contacts: '+7 (999) 111-22-33',
        address: 'г. Ярославль',
        department: 'IT',
        position: 'Разработчик',
        salary: '100000.00',
        hire_date: '2025-01-10',
        fired: false,
      },
    ];

    mockPool.query.mockResolvedValueOnce({ rows: mockEmployees });

    const response = await request(app).get('/api/employees');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockEmployees);
  });


test('POST /api/employees создаёт сотрудника', async () => {
  const newEmployee = {
    full_name: 'Петр Петров',
    birth_date: '1995-05-05',
    passport: '1234567890',
    contacts: '+7 (999) 222-33-44',
    address: 'г. Москва',
    department: 'Sales',
    position: 'Менеджер',
    salary: '70000.00',
    hire_date: '2025-02-01',
  };

  const createdEmployee = { id: 2, ...newEmployee, fired: false };

  mockPool.query.mockResolvedValueOnce({ rows: [createdEmployee] });

  const res = await request(app)
    .post('/api/employees')
    .send(newEmployee)
    .set('Content-Type', 'application/json');

  expect(res.status).toBe(200);
  expect(res.body).toEqual(createdEmployee);
  expect(mockPool.query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO employees'),
    expect.any(Array)
  );
});

test('PUT /api/employees/:id редактирует сотрудника', async () => {
  mockPool.query.mockResolvedValueOnce({ rows: [{ fired: false }] });
  
  const updatedEmployee = { id: 1, full_name: 'Иван Изменённый', fired: false };
  mockPool.query.mockResolvedValueOnce({ rows: [updatedEmployee] });

  const res = await request(app)
    .put('/api/employees/1')
    .send({ full_name: 'Иван Изменённый' })
    .set('Content-Type', 'application/json');

  expect(res.status).toBe(200);
  expect(res.body.full_name).toBe('Иван Изменённый');
});

test('PUT /api/employees/:id не даёт редактировать уволенного (403)', async () => {
  mockPool.query.mockResolvedValueOnce({ rows: [{ fired: true }] });

  const res = await request(app)
    .put('/api/employees/1')
    .send({ full_name: 'Новое имя' });

  expect(res.status).toBe(403);
  expect(res.body.error).toMatch(/невозможно редактировать/);
});

test('PATCH /api/employees/:id/fire увольняет сотрудника', async () => {
  const firedEmployee = { id: 1, full_name: 'Иван', fired: true };
  mockPool.query.mockResolvedValueOnce({ rows: [firedEmployee] });

  const res = await request(app).patch('/api/employees/1/fire');

  expect(res.status).toBe(200);
  expect(res.body.fired).toBe(true);
});

test('GET /api/employees?department=IT фильтрует по отделу', async () => {
  const filteredEmployees = [
    {
      id: 1,
      full_name: 'Иван Иванов',
      department: 'IT',
      position: 'Разработчик',
      fired: false,
    },
  ];

  mockPool.query.mockResolvedValueOnce({ rows: filteredEmployees });

  const res = await request(app).get('/api/employees?department=IT');

  expect(res.status).toBe(200);
  expect(res.body).toEqual(filteredEmployees);
  expect(mockPool.query).toHaveBeenCalledWith(
    expect.stringContaining('WHERE'),
    expect.arrayContaining(['%IT%'])
  );
});

test('GET /api/employees/search/:name находит сотрудника по ФИО', async () => {
  const found = [
    { id: 2, full_name: 'Петр Петров', department: 'Sales', fired: false },
  ];
  mockPool.query.mockResolvedValueOnce({ rows: found });

  const res = await request(app).get('/api/employees/search/Петр');

  expect(res.status).toBe(200);
  expect(res.body).toEqual(found);
  expect(mockPool.query).toHaveBeenCalledWith(
    expect.stringContaining('full_name ILIKE'),
    ['%Петр%']
  );
});
});