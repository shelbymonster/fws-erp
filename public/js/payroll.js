// Payroll management functionality with LocalStorage
let employees = [];
let payrollRecords = [];

// Load data from storage
function loadPayrollData() {
    employees = JSON.parse(localStorage.getItem('erp_employees') || '[]');
    payrollRecords = JSON.parse(localStorage.getItem('erp_payroll_records') || '[]');
}

// Save data to storage
function savePayrollData() {
    localStorage.setItem('erp_payroll_records', JSON.stringify(payrollRecords));
}

// Display payroll records
function displayPayrollRecords() {
    const tbody = document.getElementById('payroll-tbody');
    tbody.innerHTML = '';
    
    payrollRecords.forEach(record => {
        const employee = employees.find(emp => emp.id === record.employeeId);
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
        
        // Format payment method display
        let paymentMethodDisplay = record.paymentMethod || 'Not specified';
        if (record.paymentMethod === 'check' && record.checkNumber) {
            paymentMethodDisplay = `Check #${record.checkNumber}`;
        } else if (record.paymentMethod === 'cash') {
            paymentMethodDisplay = 'Cash';
        } else if (record.paymentMethod === 'direct-deposit') {
            paymentMethodDisplay = 'Direct Deposit';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employeeName}</td>
            <td>${formatDate(record.payPeriodStart)} - ${formatDate(record.payPeriodEnd)}</td>
            <td>$${record.grossPay.toFixed(2)}</td>
            <td>$${record.totalDeductions.toFixed(2)}</td>
            <td>$${record.netPay.toFixed(2)}</td>
            <td>${paymentMethodDisplay}</td>
            <td>${formatDate(record.paidDate)}</td>
            <td>${formatDate(record.dateProcessed)}</td>
            <td>
                <button class="button button-info button-small" onclick="viewPayStub(${record.id})">View</button>
                <button class="button button-danger button-small" onclick="deletePayrollRecord(${record.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update payroll summary
function updatePayrollSummary() {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    let totalPayroll = 0;
    let totalDeductions = 0;
    let totalSalaries = 0;
    
    payrollRecords.forEach(record => {
        const recordDate = new Date(record.dateProcessed);
        if (recordDate >= thisMonth) {
            totalPayroll += record.netPay;
            totalDeductions += record.totalDeductions;
        }
    });
    
    employees.forEach(emp => {
        if (emp.payType === 'salary') {
            totalSalaries += emp.payRate / 12; // Monthly salary
        } else {
            totalSalaries += emp.payRate * 40 * 4; // Assuming 40 hrs/week * 4 weeks
        }
    });
    
    const avgSalary = employees.length > 0 ? totalSalaries / employees.length : 0;
    
    document.getElementById('total-payroll').textContent = totalPayroll.toFixed(2);
    document.getElementById('total-employees').textContent = employees.length;
    document.getElementById('avg-salary').textContent = avgSalary.toFixed(2);
    document.getElementById('total-deductions').textContent = totalDeductions.toFixed(2);
}

// Show process payroll form
function showProcessPayrollForm() {
    document.getElementById('process-payroll-form').style.display = 'block';
    populatePayrollEmployees();
    setDefaultPayPeriod();
    setDefaultPaidDate();
}

// Set default paid date (today)
function setDefaultPaidDate() {
    const today = new Date();
    document.getElementById('paidDate').value = today.toISOString().split('T')[0];
}

// Hide process payroll form
function hideProcessPayrollForm() {
    document.getElementById('process-payroll-form').style.display = 'none';
    clearPayrollForm();
}

// Toggle payment method fields
function togglePaymentFields() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const checkNumberLabel = document.getElementById('checkNumberLabel');
    const checkNumberInput = document.getElementById('checkNumber');
    
    if (paymentMethod === 'check') {
        checkNumberLabel.style.display = 'inline';
        checkNumberInput.style.display = 'inline';
        checkNumberInput.required = true;
    } else {
        checkNumberLabel.style.display = 'none';
        checkNumberInput.style.display = 'none';
        checkNumberInput.required = false;
        checkNumberInput.value = '';
    }
}

// Populate payroll employees dropdown
function populatePayrollEmployees() {
    const select = document.getElementById('payrollEmployee');
    select.innerHTML = '<option value="">Select employee...</option>';
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`;
        select.appendChild(option);
    });
    
    // Add change listener to show/hide hours field
    select.onchange = function() {
        const selectedEmployee = employees.find(emp => emp.id == this.value);
        const hoursLabel = document.getElementById('hoursLabel');
        const hoursInput = document.getElementById('hoursWorked');
        
        if (selectedEmployee && selectedEmployee.payType === 'hourly') {
            hoursLabel.style.display = 'inline';
            hoursInput.style.display = 'inline';
        } else {
            hoursLabel.style.display = 'none';
            hoursInput.style.display = 'none';
        }
    };
}

// Set default pay period (current week)
function setDefaultPayPeriod() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    document.getElementById('payPeriodStart').value = startOfWeek.toISOString().split('T')[0];
    document.getElementById('payPeriodEnd').value = endOfWeek.toISOString().split('T')[0];
}

// Calculate payroll
function calculatePayroll() {
    const employeeId = document.getElementById('payrollEmployee').value;
    const employee = employees.find(emp => emp.id == employeeId);
    
    if (!employee) {
        alert('Please select an employee.');
        return;
    }
    
    let grossPay = 0;
    
    if (employee.payType === 'hourly') {
        const hours = parseFloat(document.getElementById('hoursWorked').value) || 40;
        grossPay = employee.payRate * hours;
    } else {
        grossPay = employee.payRate / 26; // Bi-weekly salary
    }
    
    // Calculate deductions (simplified tax calculations)
    const federalTax = grossPay * 0.12; // 12% federal tax
    const stateTax = grossPay * 0.05; // 5% state tax
    const socialSecurity = grossPay * 0.062; // 6.2% social security
    const medicare = grossPay * 0.0145; // 1.45% medicare
    
    const totalDeductions = federalTax + stateTax + socialSecurity + medicare;
    const netPay = grossPay - totalDeductions;
    
    // Display calculations
    document.getElementById('grossPay').textContent = grossPay.toFixed(2);
    document.getElementById('federalTax').textContent = federalTax.toFixed(2);
    document.getElementById('stateTax').textContent = stateTax.toFixed(2);
    document.getElementById('socialSecurity').textContent = socialSecurity.toFixed(2);
    document.getElementById('medicare').textContent = medicare.toFixed(2);
    document.getElementById('netPay').textContent = netPay.toFixed(2);
    
    document.getElementById('payroll-calculations').style.display = 'block';
}

// Process payroll
function processPayroll(event) {
    event.preventDefault();
    
    const employeeId = document.getElementById('payrollEmployee').value;
    const employee = employees.find(emp => emp.id == employeeId);
    
    if (!employee) {
        alert('Please select an employee.');
        return;
    }
    
    const paymentMethod = document.getElementById('paymentMethod').value;
    if (!paymentMethod) {
        alert('Please select a payment method.');
        return;
    }
    
    // Validate check number if payment method is check
    if (paymentMethod === 'check') {
        const checkNumber = document.getElementById('checkNumber').value;
        if (!checkNumber) {
            alert('Please enter a check number.');
            return;
        }
    }
    
    // Get calculated values
    const grossPay = parseFloat(document.getElementById('grossPay').textContent);
    const federalTax = parseFloat(document.getElementById('federalTax').textContent);
    const stateTax = parseFloat(document.getElementById('stateTax').textContent);
    const socialSecurity = parseFloat(document.getElementById('socialSecurity').textContent);
    const medicare = parseFloat(document.getElementById('medicare').textContent);
    const netPay = parseFloat(document.getElementById('netPay').textContent);
    
    if (grossPay === 0) {
        alert('Please calculate payroll first.');
        return;
    }
    
    const payrollRecord = {
        id: Date.now(),
        employeeId: parseInt(employeeId),
        payPeriodStart: document.getElementById('payPeriodStart').value,
        payPeriodEnd: document.getElementById('payPeriodEnd').value,
        hoursWorked: employee.payType === 'hourly' ? parseFloat(document.getElementById('hoursWorked').value) || 40 : null,
        grossPay: grossPay,
        federalTax: federalTax,
        stateTax: stateTax,
        socialSecurity: socialSecurity,
        medicare: medicare,
        totalDeductions: federalTax + stateTax + socialSecurity + medicare,
        netPay: netPay,
        paymentMethod: paymentMethod,
        checkNumber: paymentMethod === 'check' ? document.getElementById('checkNumber').value : null,
        paidDate: document.getElementById('paidDate').value,
        dateProcessed: new Date().toISOString().split('T')[0]
    };
    
    payrollRecords.push(payrollRecord);
    savePayrollData();
    displayPayrollRecords();
    updatePayrollSummary();
    hideProcessPayrollForm();
    alert('Payroll processed successfully!');
}

// Clear forms
function clearPayrollForm() {
    document.getElementById('payrollEmployee').value = '';
    document.getElementById('hoursWorked').value = '';
    document.getElementById('paymentMethod').value = '';
    document.getElementById('checkNumber').value = '';
    document.getElementById('paidDate').value = '';
    document.getElementById('payroll-calculations').style.display = 'none';
    
    // Hide payment method fields
    document.getElementById('checkNumberLabel').style.display = 'none';
    document.getElementById('checkNumber').style.display = 'none';
    document.getElementById('checkNumber').required = false;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function deletePayrollRecord(id) {
    const record = payrollRecords.find(r => r.id === id);
    if (!record) {
        alert('Payroll record not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete payroll record for "${record.employeeName}"?\n\nPay Period: ${record.payPeriodStart} - ${record.payPeriodEnd}\nNet Pay: $${record.netPay.toFixed(2)}\n\nThis action cannot be undone.`)) {
        payrollRecords = payrollRecords.filter(r => r.id !== id);
        savePayrollData();
        displayPayrollRecords();
        updatePayrollSummary();
        alert('Payroll record deleted successfully!');
    }
}

function viewPayStub(id) {
    const record = payrollRecords.find(r => r.id === id);
    const employee = employees.find(emp => emp.id === record.employeeId);
    
    if (record && employee) {
        // Format payment method for display
        let paymentInfo = record.paymentMethod || 'Not specified';
        if (record.paymentMethod === 'check' && record.checkNumber) {
            paymentInfo = `Check #${record.checkNumber}`;
        } else if (record.paymentMethod === 'cash') {
            paymentInfo = 'Cash Payment';
        } else if (record.paymentMethod === 'direct-deposit') {
            paymentInfo = 'Direct Deposit';
        }
        
        alert(`Pay Stub:\n\nEmployee: ${employee.firstName} ${employee.lastName}\nPay Period: ${formatDate(record.payPeriodStart)} - ${formatDate(record.payPeriodEnd)}\nGross Pay: $${record.grossPay.toFixed(2)}\nTotal Deductions: $${record.totalDeductions.toFixed(2)}\nNet Pay: $${record.netPay.toFixed(2)}\nPayment Method: ${paymentInfo}\nPaid Date: ${formatDate(record.paidDate)}\nDate Processed: ${formatDate(record.dateProcessed)}`);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadPayrollData();
    displayPayrollRecords();
    updatePayrollSummary();
});

console.log('Payroll Management System loaded');
console.log('Features: Employee management, payroll processing, tax calculations');