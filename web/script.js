let employees = [];

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
        const birthDate = emp.birth_date ? new Date(emp.birth_date).toLocaleDateString('ru-RU') : '';
        const hireDate = emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ru-RU') : '';

        row.innerHTML = `
            <td>${emp.full_name}</td>
            <td>${birthDate}</td>
            <td>${emp.passport || ''}</td>
            <td>${emp.contacts || ''}</td>
            <td>${emp.address || ''}</td>
            <td>${emp.department || ''}</td>
            <td>${emp.position || ''}</td>
            <td>${emp.salary ? Number(emp.salary).toLocaleString('ru-RU') + ' ₽' : ''}</td>
            <td>${hireDate}</td>
            <td>
                <button onclick="editEmployee(${emp.id})" ${emp.fired ? 'disabled' : ''}>Редактировать</button>
                <button onclick="fireEmployee(${emp.id})" ${emp.fired ? 'disabled' : ''}>Уволить</button>
            </td>
        `;
    });
}

function applyMasks(){
    const passportInput = document.getElementById('passport');
    passportInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,4})(\d{0,6})/);
        e.target.value = !x[2] ? x[1] : x[1] + ' ' + x[2];
    })
        const contactsInput = document.getElementById('contacts');
    
    contactsInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length === 0) {
            e.target.value = '';
            return;
        }

        if (value[0] === '8' || value[0] === '7') {
            value = '7' + value.slice(1);
        } else {
            value = '7' + value;
        }

        value = value.slice(0, 11);

        let formattedValue = '+7';
        if (value.length > 1) {
            formattedValue += ' (' + value.slice(1, 4);
        }
        if (value.length > 4) {
            formattedValue += ') ' + value.slice(4, 7);
        }
        if (value.length > 7) {
            formattedValue += '-' + value.slice(7, 9);
        }
        if (value.length > 9) {
            formattedValue += '-' + value.slice(9, 11);
        }
        
        e.target.value = formattedValue;
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

async function searchEmployee() {
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
    document.getElementById('modalTitle').textContent = id ? 'Редактировать сотрудника' : 'Новый сотрудник';
    
    if (id) {
        fetch(`/api/employees/${id}`)
          .then(res => res.json())
          .then(emp => {
                document.getElementById('full_name').value = emp.full_name || '';
                if (emp.birth_date) {
                    document.getElementById('birth_date').value = emp.birth_date.substring(0, 10);
                } else {
                    document.getElementById('birth_date').value = '';
                }
                
                document.getElementById('passport').value = emp.passport || '';
                document.getElementById('contacts').value = emp.contacts || '';
                document.getElementById('address').value = emp.address || '';
                document.getElementById('department').value = emp.department || '';
                document.getElementById('position').value = emp.position || '';
                document.getElementById('salary').value = emp.salary || '';
                if (emp.hire_date) {
                    document.getElementById('hire_date').value = emp.hire_date.substring(0, 10);
                } else {
                    document.getElementById('hire_date').value = '';
                }
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
