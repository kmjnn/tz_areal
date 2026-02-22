let employees = [];
let editEmp = null;

async function loadEmployees(dept = '', pos = '') {
    try {
        const url = `/api/employees?department=${dept}&position=${pos}`;
        const res = await fetch(url);
        employees = await res.json();
        renderTable();
    }   catch (err){
        alert('Ошибка загрузки: ' + err.message);
    }
}

function renderTable(){
    const tabBody = document.getElementById('tableBody');
    tabBody.innerHTML = '';
    employees.forEach(emp => {
        const row = tabBody.insertRow();
        row.className = emp.fired ? 'fired' : '';
        row.innerHTML = `
            <td>${emp.full_name}</td>
            <td>${emp.birth_date || ''}</td>
            <td>${emp.passport || ''}</td>
            <td>${emp.contacts || ''}</td>
            <td>${emp.address || ''}</td>
            <td>${emp.department || ''}</td>
            <td>${emp.position || ''}</td>
            <td>${emp.salary ? emp.salary.toLocaleString() + ' ₽' : ''}</td>
            <td>${emp.hire_date || ''}</td>
            <td>
            <button onclick="editEmployee(${emp.id})" ${emp.fired ? 'disabled' : ''}>Редактировать</button>
            <button onclick="fireEmployee(${emp.id})" ${emp.fired ? 'disabled' : ''}>Уволить</button>
            </td>
        `;
    })
}

function applyMasks(){
    const passportInput = document.getElementById('passport');
    passportInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,4})(\d{0,6})/);
        e.target.value = !x[2] ? x[1] : x[1] + ' ' + x[2];
    })
    const contactsInput = document.getElementById('contacts');
    contactsInput.value = '';
    contactsInput.addEventListener('input', (e) => { 
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
    
        if (value.length > 0) {
        formattedValue = '+7 (';
        if (value.length > 0) formattedValue += value.slice(0, 3);
        if (value.length > 3) formattedValue += ') ' + value.slice(3, 6);
        if (value.length > 6) formattedValue += '-' + value.slice(6, 8);
        if (value.length > 8) formattedValue += '-' + value.slice(8, 10);
        }
        
        e.target.value = formattedValue;
        e.target.setSelectionRange(formattedValue.length, formattedValue.length);
    });
}

async function loadEmployees(dept = '', pos = '') {
  try {
    const url = `/api/employees?department=${dept}&position=${pos}`;
    const res = await fetch(url);
    employees = await res.json();
    renderTable();
  } catch (err) {
    alert('Ошибка загрузки: ' + err.message);
  }
}

async function searchEmployee(params) {
    const name = document.getElementById('searchName').value;
    if (!name) return loadEmployees();
    try{
        const res = await fetch(`/api/employees/search/${name}`);
        employees = await res.json();
        renderTable();
    } catch (err) {
        alert('Ошибка поиска: '+ err.message)
    }
    
}

function openModal(id = null) {
  editingId = id;
  document.getElementById('modalTitle').textContent = id ? 'Редактировать' : 'Новый сотрудник';
  if (id) {
    fetch(`/api/employees/${id}`).then(res => res.json()).then(emp => {
      Object.keys(emp).forEach(key => {
        const input = document.getElementById(key);
        if (input) input.value = emp[key] || '';
      });
    });
  } else {
    document.getElementById('employeeForm').reset();
  }
  document.getElementById('modal').style.display = 'block';
  applyMasks();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}


document.getElementById('employeeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    full_name: document.getElementById('full_name').value,
    birth_date: document.getElementById('birth_date').value,
    passport: document.getElementById('passport').value.replace(/\s/g, ''),
    contacts: document.getElementById('contacts').value,
    address: document.getElementById('address').value,
    department: document.getElementById('department').value,
    position: document.getElementById('position').value,
    salary: parseFloat(document.getElementById('salary').value) || 0,
    hire_date: document.getElementById('hire_date').value,
  };

  try {
    let res;
    if (editingId) {
      res = await fetch(`/api/employees/${editingId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    } else {
      res = await fetch('/api/employees', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    }
    if (res.ok) {
      closeModal();
      loadEmployees();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  } catch (err) {
    alert('Ошибка сохранения: ' + err.message);
  }
});

async function editEmployee(id) {
  openModal(id);
}

// уволить
async function fireEmployee(id) {
  if (confirm('Уволить сотрудника?')) {
    try {
      const res = await fetch(`/api/employees/${id}/fire`, { method: 'PATCH' });
      if (res.ok) loadEmployees();
      else alert('Ошибка увольнения');
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  }
}

//фильтрация
document.getElementById('filterDept').addEventListener('input', () => {
  const dept = document.getElementById('filterDept').value;
  const pos = document.getElementById('filterPos').value;
  loadEmployees(dept, pos);
});
document.getElementById('filterPos').addEventListener('input', () => {
  const dept = document.getElementById('filterDept').value;
  const pos = document.getElementById('filterPos').value;
  loadEmployees(dept, pos);
});


loadEmployees();
