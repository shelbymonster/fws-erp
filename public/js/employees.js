// Employee management functionality with LocalStorage
let employees = [];
let currentEmployeeId = null;
let editingEmployeeId = null;

// Load employees from storage
function loadEmployees() {
    console.log('Loading employees from storage...');
    if (typeof erpStorage === 'undefined') {
        console.error('erpStorage is not defined!');
        return;
    }
    employees = erpStorage.getEmployees();
    console.log('Loaded employees:', employees);
}

// Display employees in the sidebar list
function displayEmployees() {
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '';
    
    if (employees.length === 0) {
        employeesList.innerHTML = '<p class="empty-list-message">No employees yet. Click "Add New Employee" to get started.</p>';
        return;
    }
    
    employees.forEach(employee => {
        const employeeItem = document.createElement('div');
        employeeItem.className = 'vendor-list-item';
        if (currentEmployeeId === employee.id) {
            employeeItem.classList.add('active');
        }
        employeeItem.innerHTML = `
            <span>${employee.firstName} ${employee.lastName}</span>
        `;
        employeeItem.onclick = () => showEmployeeProfile(employee.id);
        employeesList.appendChild(employeeItem);
    });
}

// Show employee profile
function showEmployeeProfile(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    currentEmployeeId = employeeId;
    
    // Update active state in list
    displayEmployees();
    
    // Hide empty state and show profile
    document.getElementById('employee-profile-empty').style.display = 'none';
    document.getElementById('employee-profile').style.display = 'block';
    
    // Display employee profile
    const profileContainer = document.getElementById('employee-profile');
    const payRateDisplay = employee.payType === 'hourly' ? `$${employee.payRate}/hr` : `$${employee.payRate.toLocaleString()}/year`;
    
    profileContainer.innerHTML = `
        <div class="vendor-profile-header">
            <h2>${employee.firstName} ${employee.lastName}</h2>
            <div class="vendor-actions">
                <button class="button button-warning" onclick="showEditEmployeeForm(${employee.id})">Edit Employee</button>
                <button class="button button-danger" onclick="deleteEmployee(${employee.id})">Delete Employee</button>
            </div>
        </div>
        
        <div class="vendor-profile-content">
            <div class="vendor-info-section">
                <h3>Employee Information</h3>
                <div class="vendor-info-grid">
                    <div class="vendor-info-item">
                        <label>Employee ID:</label>
                        <p><strong>${employee.employeeId || 'Not set'}</strong></p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Email Address:</label>
                        <p>${employee.email || 'Not provided'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Department:</label>
                        <p>${employee.department || 'Not specified'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Position:</label>
                        <p>${employee.position || 'Not specified'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Pay Type:</label>
                        <p>${employee.payType.charAt(0).toUpperCase() + employee.payType.slice(1)}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Pay Rate:</label>
                        <p>${payRateDisplay}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Hire Date:</label>
                        <p>${formatDate(employee.hireDate)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show add employee form
function showAddEmployeeForm() {
    editingEmployeeId = null;
    document.getElementById('employee-form-title').textContent = 'Add New Employee';
    document.getElementById('employee-form-submit').textContent = 'Add Employee';
    document.getElementById('employee-form').reset();
    
    // Clear and enable employeeId field
    const employeeIdInput = document.getElementById('employeeId');
    if (employeeIdInput) {
        employeeIdInput.value = '';
        employeeIdInput.removeAttribute('readonly');
    }
    
    const modal = document.getElementById('employee-form-modal');
    modal.style.display = 'flex';
    
    // Add click outside to close
    modal.onclick = function(event) {
        if (event.target === modal) {
            hideEmployeeForm();
        }
    };
}

// Show edit employee form
function showEditEmployeeForm(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    editingEmployeeId = employeeId;
    document.getElementById('employee-form-title').textContent = 'Edit Employee';
    document.getElementById('employee-form-submit').textContent = 'Update Employee';
    
    document.getElementById('employeeFirstName').value = employee.firstName;
    document.getElementById('employeeLastName').value = employee.lastName;
    
    // Set and make employeeId readonly when editing
    const employeeIdInput = document.getElementById('employeeId');
    if (employeeIdInput) {
        employeeIdInput.value = employee.employeeId || '';
        employeeIdInput.setAttribute('readonly', 'readonly');
    }
    
    document.getElementById('employeeEmail').value = employee.email || '';
    document.getElementById('employeeDepartment').value = employee.department || '';
    document.getElementById('employeePosition').value = employee.position || '';
    document.getElementById('payType').value = employee.payType;
    document.getElementById('payRate').value = employee.payRate;
    document.getElementById('hireDate').value = employee.hireDate;
    
    togglePayFields();
    
    document.getElementById('employee-form-modal').style.display = 'flex';
}

// Hide employee form
function hideEmployeeForm() {
    const modal = document.getElementById('employee-form-modal');
    modal.style.display = 'none';
    modal.onclick = null;
    document.getElementById('employee-form').reset();
    editingEmployeeId = null;
}

// Toggle pay fields based on pay type
function togglePayFields() {
    const payType = document.getElementById('payType').value;
    const payRateLabel = document.getElementById('payRateLabel');
    const payRateInput = document.getElementById('payRate');
    
    if (payType === 'hourly') {
        payRateLabel.textContent = 'Hourly Rate ($):';
        payRateInput.placeholder = '15.00';
    } else if (payType === 'salary') {
        payRateLabel.textContent = 'Annual Salary ($):';
        payRateInput.placeholder = '50000.00';
    }
}

// Auto-generate Employee ID from first and last name
function autoGenerateEmployeeId() {
    const firstNameInput = document.getElementById('employeeFirstName');
    const lastNameInput = document.getElementById('employeeLastName');
    const idInput = document.getElementById('employeeId');
    
    if (!firstNameInput || !lastNameInput || !idInput) return;
    if (editingEmployeeId) return; // Don't auto-generate when editing
    
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    
    if (!firstName || !lastName) {
        idInput.value = '';
        return;
    }
    
    // Generate base ID: First letter of first name + First 2 letters of last name
    const firstLetter = firstName.charAt(0).toUpperCase();
    const lastTwoLetters = lastName.substring(0, 2).toUpperCase();
    let baseId = firstLetter + lastTwoLetters;
    
    // If last name is too short, use what's available
    if (baseId.length < 2) {
        idInput.value = '';
        return;
    }
    
    // Check if this ID already exists
    let finalId = baseId;
    let counter = 1;
    
    while (employees.some(emp => emp.employeeId === finalId)) {
        finalId = baseId + counter;
        counter++
    }
    
    idInput.value = finalId;
}

// Save employee (add or update)
function saveEmployee(event) {
    event.preventDefault();
    
    const employeeId = document.getElementById('employeeId').value.trim().toUpperCase();
    
    // Validate employeeId format (2-5 alphanumeric characters)
    if (!/^[A-Z0-9]{2,5}$/.test(employeeId)) {
        alert('Employee ID must be 2-5 letters/numbers (e.g., JSM or JSM1)');
        return;
    }
    
    // Check for duplicate employeeId (when creating new or changing existing)
    const duplicateEmployee = employees.find(emp => 
        emp.employeeId === employeeId && 
        (!editingEmployeeId || emp.id !== editingEmployeeId)
    );
    
    if (duplicateEmployee) {
        alert(`Employee ID "${employeeId}" is already in use by ${duplicateEmployee.firstName} ${duplicateEmployee.lastName}. Please choose a different ID.`);
        return;
    }
    
    const employeeData = {
        employeeId: employeeId,
        firstName: document.getElementById('employeeFirstName').value,
        lastName: document.getElementById('employeeLastName').value,
        email: document.getElementById('employeeEmail').value || null,
        department: document.getElementById('employeeDepartment').value || null,
        position: document.getElementById('employeePosition').value || null,
        payType: document.getElementById('payType').value,
        payRate: parseFloat(document.getElementById('payRate').value),
        hireDate: document.getElementById('hireDate').value
    };
    
    if (editingEmployeeId) {
        // Update existing employee
        if (erpStorage.updateEmployee(editingEmployeeId, employeeData)) {
            loadEmployees();
            displayEmployees();
            showEmployeeProfile(editingEmployeeId);
            hideEmployeeForm();
            alert('Employee updated successfully!');
        } else {
            alert('Error updating employee. Please try again.');
        }
    } else {
        // Add new employee
        if (erpStorage.addEmployee(employeeData)) {
            loadEmployees();
            displayEmployees();
            hideEmployeeForm();
            alert('Employee added successfully!');
        } else {
            alert('Error saving employee. Please try again.');
        }
    }
}

// Delete employee
function deleteEmployee(id) {
    const employee = employees.find(e => e.id === id);
    if (!employee) {
        alert('Employee not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${employee.firstName} ${employee.lastName}"?\n\nThis will permanently remove this employee and cannot be undone.`)) {
        if (erpStorage.deleteEmployee(id)) {
            loadEmployees();
            displayEmployees();
            
            // Hide profile and show empty state
            currentEmployeeId = null;
            document.getElementById('employee-profile').style.display = 'none';
            document.getElementById('employee-profile-empty').style.display = 'flex';
            
            alert('Employee deleted successfully!');
        } else {
            alert('Error deleting employee. Please try again.');
        }
    }
}

// Search employees
function searchEmployees() {
    const searchTerm = document.getElementById('employeeSearchInput').value.toLowerCase();
    const searchClear = document.getElementById('employeeSearchClear');
    
    if (searchTerm) {
        searchClear.style.display = 'block';
    } else {
        searchClear.style.display = 'none';
    }
    
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '';
    
    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const email = (employee.email || '').toLowerCase();
        const department = (employee.department || '').toLowerCase();
        const position = (employee.position || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               department.includes(searchTerm) ||
               position.includes(searchTerm);
    });
    
    if (filteredEmployees.length === 0) {
        employeesList.innerHTML = '<p class="empty-list-message">No employees found matching your search.</p>';
        return;
    }
    
    filteredEmployees.forEach(employee => {
        const employeeItem = document.createElement('div');
        employeeItem.className = 'vendor-list-item';
        if (currentEmployeeId === employee.id) {
            employeeItem.classList.add('active');
        }
        employeeItem.innerHTML = `
            <span>${employee.firstName} ${employee.lastName}</span>
        `;
        employeeItem.onclick = () => showEmployeeProfile(employee.id);
        employeesList.appendChild(employeeItem);
    });
}

// Clear employee search
function clearEmployeeSearch() {
    document.getElementById('employeeSearchInput').value = '';
    document.getElementById('employeeSearchClear').style.display = 'none';
    displayEmployees();
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading skeleton
    if (typeof LoadingState !== 'undefined') {
        LoadingState.showListLoading('employees-list', 5);
    }
    
    // Simulate async load
    if (typeof LoadingState !== 'undefined') {
        await LoadingState.simulateAsync(() => {
            loadEmployees();
        }, 400);
    } else {
        loadEmployees();
    }
    
    displayEmployees();
    
    console.log('Employee management system loaded');
});
