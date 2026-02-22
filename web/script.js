let employees = [];
let editEmp = null;

async function loadEmployees(dept = '', pos = '') {
    try {
        const url = `/api/employees?departament=${dept}&position=${pos}`;
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

async function searchEmployee(params) {
    const name = document.getElementById('searchName').ariaValueMax;
    if (!name) return loadEmployees();
    try{
        const res = await fetch(`/api/employees/search/${name}`);
        employees = await res.json();
        renderTable();
    } catch (err) {
        alert('Ошибка поиска: '+ err.message)
    }
    
}
