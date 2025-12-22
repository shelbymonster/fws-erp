// Reports functionality for Simple ERP
let employees = [];
let payrollRecords = [];
let currentReportData = [];

// Load data from storage
function loadReportsData() {
    employees = JSON.parse(localStorage.getItem('erp_employees') || '[]');
    payrollRecords = JSON.parse(localStorage.getItem('erp_payroll_records') || '[]');
}

// Show payroll report options
function showPayrollReportOptions() {
    hideAllReports();
    document.getElementById('payroll-report-options').style.display = 'block';
    populateEmployeeDropdown();
    setDefaultDateRange();
}

// Show employee summary
function showEmployeeSummary() {
    hideAllReports();
    generateEmployeeSummaryReport();
    document.getElementById('employee-summary-report').style.display = 'block';
}

// Show tax summary
function showTaxSummary() {
    hideAllReports();
    generateTaxSummaryReport();
    document.getElementById('tax-summary-report').style.display = 'block';
}

// Hide all report sections
function hideAllReports() {
    document.getElementById('payroll-report-options').style.display = 'none';
    document.getElementById('report-results').style.display = 'none';
    document.getElementById('employee-summary-report').style.display = 'none';
    document.getElementById('tax-summary-report').style.display = 'none';
}

// Hide report options
function hideReportOptions() {
    document.getElementById('payroll-report-options').style.display = 'none';
}

// Toggle report options based on type
function toggleReportOptions() {
    const reportType = document.getElementById('reportType').value;
    
    // Hide all options first
    document.getElementById('dateRangeOptions').style.display = 'none';
    document.getElementById('employeeOptions').style.display = 'none';
    document.getElementById('paymentMethodOptions').style.display = 'none';
    
    // Show relevant options
    if (reportType === 'date-range') {
        document.getElementById('dateRangeOptions').style.display = 'flex';
    } else if (reportType === 'employee') {
        document.getElementById('employeeOptions').style.display = 'flex';
    } else if (reportType === 'payment-method') {
        document.getElementById('paymentMethodOptions').style.display = 'flex';
    }
}

// Populate employee dropdown
function populateEmployeeDropdown() {
    const select = document.getElementById('reportEmployee');
    select.innerHTML = '<option value="">Select employee...</option>';
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.firstName} ${employee.lastName}`;
        select.appendChild(option);
    });
}

// Set default date range (current month)
function setDefaultDateRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = lastDay.toISOString().split('T')[0];
}

// Generate payroll history report
function generatePayrollHistoryReport(event) {
    event.preventDefault();
    
    const reportType = document.getElementById('reportType').value;
    let filteredRecords = [...payrollRecords];
    let reportTitle = 'Payroll History Report';
    
    // Apply filters based on report type
    if (reportType === 'date-range') {
        const startDate = new Date(document.getElementById('reportStartDate').value);
        const endDate = new Date(document.getElementById('reportEndDate').value);
        
        filteredRecords = payrollRecords.filter(record => {
            const paidDate = new Date(record.paidDate);
            return paidDate >= startDate && paidDate <= endDate;
        });
        
        reportTitle = `Payroll Report: ${formatDate(startDate.toISOString().split('T')[0])} - ${formatDate(endDate.toISOString().split('T')[0])}`;
    } else if (reportType === 'employee') {
        const employeeId = parseInt(document.getElementById('reportEmployee').value);
        const employee = employees.find(emp => emp.id === employeeId);
        
        if (!employeeId) {
            alert('Please select an employee.');
            return;
        }
        
        filteredRecords = payrollRecords.filter(record => record.employeeId === employeeId);
        reportTitle = `Payroll Report: ${employee.firstName} ${employee.lastName}`;
    } else if (reportType === 'payment-method') {
        const paymentMethod = document.getElementById('reportPaymentMethod').value;
        
        if (paymentMethod) {
            filteredRecords = payrollRecords.filter(record => record.paymentMethod === paymentMethod);
            reportTitle = `Payroll Report: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Payments`;
        }
    }
    
    currentReportData = filteredRecords;
    displayPayrollReport(filteredRecords, reportTitle);
}

// Display payroll report
function displayPayrollReport(records, title) {
    document.getElementById('report-title').textContent = title;
    
    // Generate summary statistics
    const totalGross = records.reduce((sum, record) => sum + record.grossPay, 0);
    const totalDeductions = records.reduce((sum, record) => sum + record.totalDeductions, 0);
    const totalNet = records.reduce((sum, record) => sum + record.netPay, 0);
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalGross.toFixed(2)}</div>
            <div class="report-stat-label">Total Gross Pay</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalDeductions.toFixed(2)}</div>
            <div class="report-stat-label">Total Deductions</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalNet.toFixed(2)}</div>
            <div class="report-stat-label">Total Net Pay</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${records.length}</div>
            <div class="report-stat-label">Total Records</div>
        </div>
    `;
    
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Generate table headers
    const headersHTML = `
        <tr>
            <th>Employee</th>
            <th>Pay Period</th>
            <th>Hours</th>
            <th>Gross Pay</th>
            <th>Federal Tax</th>
            <th>State Tax</th>
            <th>Social Security</th>
            <th>Medicare</th>
            <th>Total Deductions</th>
            <th>Net Pay</th>
            <th>Payment Method</th>
            <th>Paid Date</th>
        </tr>
    `;
    
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Generate table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    records.forEach(record => {
        const employee = employees.find(emp => emp.id === record.employeeId);
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
        
        const hours = record.hoursWorked ? record.hoursWorked.toFixed(1) : 'Salary';
        
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
            <td>${hours}</td>
            <td>$${record.grossPay.toFixed(2)}</td>
            <td>$${record.federalTax.toFixed(2)}</td>
            <td>$${record.stateTax.toFixed(2)}</td>
            <td>$${record.socialSecurity.toFixed(2)}</td>
            <td>$${record.medicare.toFixed(2)}</td>
            <td>$${record.totalDeductions.toFixed(2)}</td>
            <td>$${record.netPay.toFixed(2)}</td>
            <td>${paymentMethodDisplay}</td>
            <td>${formatDate(record.paidDate)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Generate totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Gross Pay:</span>
            <span>$${totalGross.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Deductions:</span>
            <span>$${totalDeductions.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Net Pay:</span>
            <span>$${totalNet.toFixed(2)}</span>
        </div>
    `;
    
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('payroll-report-options').style.display = 'none';
    document.getElementById('report-results').style.display = 'block';
}

// Generate employee summary report
function generateEmployeeSummaryReport() {
    const container = document.getElementById('employee-summary-container');
    container.innerHTML = '';
    
    employees.forEach(employee => {
        const employeeRecords = payrollRecords.filter(record => record.employeeId === employee.id);
        const totalGross = employeeRecords.reduce((sum, record) => sum + record.grossPay, 0);
        const totalNet = employeeRecords.reduce((sum, record) => sum + record.netPay, 0);
        const totalDeductions = employeeRecords.reduce((sum, record) => sum + record.totalDeductions, 0);
        const avgPay = employeeRecords.length > 0 ? totalNet / employeeRecords.length : 0;
        
        const department = employee.department || 'Not specified';
        const position = employee.position || 'Not specified';
        
        const cardHTML = `
            <div class="employee-card">
                <h4>${employee.firstName} ${employee.lastName}</h4>
                <div class="employee-stats">
                    <div class="employee-stat">
                        <span>Employee Number:</span>
                        <span>${employee.employeeNumber || 'N/A'}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Department:</span>
                        <span>${department}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Position:</span>
                        <span>${position}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Pay Type:</span>
                        <span>${employee.payType.charAt(0).toUpperCase() + employee.payType.slice(1)}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Pay Rate:</span>
                        <span>$${employee.payRate}${employee.payType === 'hourly' ? '/hr' : '/year'}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Hire Date:</span>
                        <span>${formatDate(employee.hireDate)}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Total Paychecks:</span>
                        <span>${employeeRecords.length}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Total Gross Pay:</span>
                        <span>$${totalGross.toFixed(2)}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Total Deductions:</span>
                        <span>$${totalDeductions.toFixed(2)}</span>
                    </div>
                    <div class="employee-stat">
                        <span>Total Net Pay:</span>
                        <span><strong>$${totalNet.toFixed(2)}</strong></span>
                    </div>
                    <div class="employee-stat">
                        <span>Average Net Pay:</span>
                        <span>$${avgPay.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += cardHTML;
    });
}

// Generate tax summary report
function generateTaxSummaryReport() {
    const container = document.getElementById('tax-summary-container');
    
    const totalFederalTax = payrollRecords.reduce((sum, record) => sum + record.federalTax, 0);
    const totalStateTax = payrollRecords.reduce((sum, record) => sum + record.stateTax, 0);
    const totalSocialSecurity = payrollRecords.reduce((sum, record) => sum + record.socialSecurity, 0);
    const totalMedicare = payrollRecords.reduce((sum, record) => sum + record.medicare, 0);
    const totalTaxes = totalFederalTax + totalStateTax + totalSocialSecurity + totalMedicare;
    
    const taxBredownHTML = `
        <div class="tax-breakdown">
            <div class="tax-card">
                <h4>Federal Tax</h4>
                <div class="tax-amount">$${totalFederalTax.toFixed(2)}</div>
            </div>
            <div class="tax-card">
                <h4>State Tax</h4>
                <div class="tax-amount">$${totalStateTax.toFixed(2)}</div>
            </div>
            <div class="tax-card">
                <h4>Social Security</h4>
                <div class="tax-amount">$${totalSocialSecurity.toFixed(2)}</div>
            </div>
            <div class="tax-card">
                <h4>Medicare</h4>
                <div class="tax-amount">$${totalMedicare.toFixed(2)}</div>
            </div>
            <div class="tax-card tax-card-danger">
                <h4>Total Taxes</h4>
                <div class="tax-amount tax-amount-danger">$${totalTaxes.toFixed(2)}</div>
            </div>
        </div>
    `;
    
    container.innerHTML = taxBredownHTML;
}

// Export to PDF
function exportToPDF() {
    if (currentReportData.length === 0) {
        alert('No report data to export. Please generate a report first.');
        return;
    }
    
    // Create new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    // Add title
    const title = document.getElementById('report-title').textContent;
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add summary statistics
    const totalGross = currentReportData.reduce((sum, record) => sum + record.grossPay, 0);
    const totalNet = currentReportData.reduce((sum, record) => sum + record.netPay, 0);
    const totalRecords = currentReportData.length;
    
    doc.text(`Total Records: ${totalRecords}`, 20, 40);
    doc.text(`Total Gross Pay: $${totalGross.toFixed(2)}`, 100, 40);
    doc.text(`Total Net Pay: $${totalNet.toFixed(2)}`, 200, 40);
    
    // Save the PDF
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    alert('Report exported to PDF successfully!');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Financial Summary
function showFinancialSummary() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    const bills = erpStorage.getBills();
    const payrollRecords = JSON.parse(localStorage.getItem('erp_payroll_records') || '[]');
    const products = erpStorage.getProducts();
    
    // Revenue
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    // Expenses
    const paidBills = bills.filter(bill => bill.status === 'Paid');
    const billExpenses = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
    const payrollExpenses = payrollRecords.reduce((sum, record) => sum + record.netPay, 0);
    const totalExpenses = billExpenses + payrollExpenses;
    
    // Profit
    const netProfit = totalRevenue - totalExpenses;
    
    // Outstanding
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'Paid');
    const accountsReceivable = unpaidInvoices.reduce((sum, inv) => {
        // For partially paid invoices, only count the remaining balance
        if (inv.payments && inv.payments.length > 0) {
            const totalPaid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0);
            return sum + (inv.total - totalPaid);
        }
        return sum + inv.total;
    }, 0);
    const unpaidBills = bills.filter(bill => bill.status !== 'Paid');
    const accountsPayable = unpaidBills.reduce((sum, bill) => {
        // For partially paid bills, only count the remaining balance
        if (bill.payments && bill.payments.length > 0) {
            const totalPaid = bill.payments.reduce((pSum, p) => pSum + p.amount, 0);
            return sum + (bill.amount - totalPaid);
        }
        return sum + bill.amount;
    }, 0);
    
    // Inventory
    const inventoryValue = products.reduce((sum, prod) => sum + (prod.price * (prod.stock || 0)), 0);
    
    // Cash position
    const totalReceived = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0) + payrollExpenses;
    const cashPosition = totalReceived - totalPaid;
    
    // Display report
    document.getElementById('report-title').textContent = 'Financial Summary';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalRevenue.toFixed(2)}</div>
            <div class="report-stat-label">Total Revenue</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalExpenses.toFixed(2)}</div>
            <div class="report-stat-label">Total Expenses</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="${netProfit >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${netProfit.toFixed(2)}</div>
            <div class="report-stat-label">Net Profit</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="${cashPosition >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${cashPosition.toFixed(2)}</div>
            <div class="report-stat-label">Cash Position</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th class="report-table-left">Category</th>
            <th class="report-table-right">Amount</th>
            <th class="report-table-left">Details</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    const rows = [
        { category: 'Income', amount: totalRevenue, details: `${paidInvoices.length} paid invoices`, color: '#e8f5e8' },
        { category: 'Vendor Expenses', amount: billExpenses, details: `${paidBills.length} paid bills`, color: '#ffebee' },
        { category: 'Payroll Expenses', amount: payrollExpenses, details: `${payrollRecords.length} payroll records`, color: '#ffebee' },
        { category: 'Net Profit/Loss', amount: netProfit, details: netProfit >= 0 ? 'Profit' : 'Loss', color: netProfit >= 0 ? '#d4edda' : '#f8d7da', bold: true },
        { category: '', amount: 0, details: '', color: 'transparent' },
        { category: 'Accounts Receivable', amount: accountsReceivable, details: `${unpaidInvoices.length} unpaid invoices`, color: '#fff3cd' },
        { category: 'Accounts Payable', amount: accountsPayable, details: `${unpaidBills.length} unpaid bills`, color: '#fff3cd' },
        { category: 'Inventory Value', amount: inventoryValue, details: `${products.length} products in stock`, color: '#e7f3ff' },
        { category: '', amount: 0, details: '', color: 'transparent' },
        { category: 'Cash Position', amount: cashPosition, details: 'Money in - Money out', color: cashPosition >= 0 ? '#d4edda' : '#f8d7da', bold: true }
    ];
    
    rows.forEach(row => {
        if (row.category === '') {
            const spacer = document.createElement('tr');
            spacer.innerHTML = '<td colspan="3" class="report-table-spacer"></td>';
            tbody.appendChild(spacer);
        } else {
            const tr = document.createElement('tr');
            tr.style.backgroundColor = row.color;
            if (row.bold) tr.style.fontWeight = 'bold';
            tr.innerHTML = `
                <td><strong>${row.category}</strong></td>
                <td class="report-table-right ${row.amount < 0 ? 'text-danger' : ''}">$${row.amount.toFixed(2)}</td>
                <td>${row.details}</td>
            `;
            tbody.appendChild(tr);
        }
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Revenue:</span>
            <span class="text-success">$${totalRevenue.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Expenses:</span>
            <span class="text-danger">$${totalExpenses.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Net Profit:</span>
            <span class="${netProfit >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${netProfit.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

function showCashFlow() {
    alert('Cash flow reports coming soon! This will show money in vs. money out over time.');
}

// === SALES REPORTS ===

// Sales by Customer Report
function showCustomerReport() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    const customers = erpStorage.getCustomers();
    
    // Calculate sales by customer
    const customerSales = {};
    
    invoices.forEach(invoice => {
        if (!customerSales[invoice.customerId]) {
            customerSales[invoice.customerId] = {
                customerId: invoice.customerId,
                customerName: invoice.customerName,
                totalInvoices: 0,
                totalSales: 0,
                paidInvoices: 0,
                paidAmount: 0,
                unpaidInvoices: 0,
                unpaidAmount: 0
            };
        }
        
        customerSales[invoice.customerId].totalInvoices++;
        customerSales[invoice.customerId].totalSales += invoice.total;
        
        if (invoice.status === 'Paid') {
            customerSales[invoice.customerId].paidInvoices++;
            customerSales[invoice.customerId].paidAmount += invoice.total;
        } else {
            customerSales[invoice.customerId].unpaidInvoices++;
            customerSales[invoice.customerId].unpaidAmount += invoice.total;
        }
    });
    
    // Convert to array and sort by total sales
    const customerArray = Object.values(customerSales).sort((a, b) => b.totalSales - a.totalSales);
    
    // Calculate totals
    const totalSales = customerArray.reduce((sum, c) => sum + c.totalSales, 0);
    const totalPaid = customerArray.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalUnpaid = customerArray.reduce((sum, c) => sum + c.unpaidAmount, 0);
    
    // Display report
    document.getElementById('report-title').textContent = 'Sales by Customer';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${customerArray.length}</div>
            <div class="report-stat-label">Total Customers</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalSales.toFixed(2)}</div>
            <div class="report-stat-label">Total Sales</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalPaid.toFixed(2)}</div>
            <div class="report-stat-label">Paid Sales</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalUnpaid.toFixed(2)}</div>
            <div class="report-stat-label">Unpaid Sales</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Customer Name</th>
            <th>Total Invoices</th>
            <th>Total Sales</th>
            <th>Paid Invoices</th>
            <th>Paid Amount</th>
            <th>Unpaid Invoices</th>
            <th>Unpaid Amount</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    customerArray.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${customer.customerName}</strong></td>
            <td>${customer.totalInvoices}</td>
            <td>$${customer.totalSales.toFixed(2)}</td>
            <td>${customer.paidInvoices}</td>
            <td class="text-success">$${customer.paidAmount.toFixed(2)}</td>
            <td>${customer.unpaidInvoices}</td>
            <td class="text-danger">$${customer.unpaidAmount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Sales:</span>
            <span>$${totalSales.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Paid:</span>
            <span class="text-success">$${totalPaid.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Unpaid:</span>
            <span class="text-danger">$${totalUnpaid.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Sales by Product Report
function showSalesReport() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    const products = erpStorage.getProducts();
    
    // Calculate sales by product
    const productSales = {};
    
    invoices.forEach(invoice => {
        if (invoice.items && Array.isArray(invoice.items)) {
            invoice.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productId: item.productId,
                        productName: item.productName,
                        quantitySold: 0,
                        totalRevenue: 0,
                        numInvoices: 0
                    };
                }
                
                productSales[item.productId].quantitySold += item.quantity;
                productSales[item.productId].totalRevenue += item.total;
                productSales[item.productId].numInvoices++;
            });
        }
    });
    
    // Convert to array and sort by revenue
    const productArray = Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Calculate totals
    const totalRevenue = productArray.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalQuantity = productArray.reduce((sum, p) => sum + p.quantitySold, 0);
    
    // Display report
    document.getElementById('report-title').textContent = 'Sales by Product';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${productArray.length}</div>
            <div class="report-stat-label">Products Sold</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${totalQuantity}</div>
            <div class="report-stat-label">Total Units Sold</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalRevenue.toFixed(2)}</div>
            <div class="report-stat-label">Total Revenue</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${(totalRevenue / totalQuantity || 0).toFixed(2)}</div>
            <div class="report-stat-label">Avg Price per Unit</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Product Name</th>
            <th>Quantity Sold</th>
            <th>Total Revenue</th>
            <th>Number of Invoices</th>
            <th>Avg Price per Unit</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    productArray.forEach(product => {
        const avgPrice = product.totalRevenue / product.quantitySold;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${product.productName}</strong></td>
            <td>${product.quantitySold}</td>
            <td>$${product.totalRevenue.toFixed(2)}</td>
            <td>${product.numInvoices}</td>
            <td>$${avgPrice.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Units Sold:</span>
            <span>${totalQuantity}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Revenue:</span>
            <span>$${totalRevenue.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Invoice Report (Unpaid & Paid)
function showInvoiceReport() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    
    // Separate invoices by status
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'Paid');
    
    // Calculate totals
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalAmount = totalPaidAmount + totalUnpaidAmount;
    
    // Display report
    document.getElementById('report-title').textContent = 'Invoice Report - All Invoices';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${invoices.length}</div>
            <div class="report-stat-label">Total Invoices</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${paidInvoices.length}</div>
            <div class="report-stat-label">Paid Invoices</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${unpaidInvoices.length}</div>
            <div class="report-stat-label">Unpaid Invoices</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalAmount.toFixed(2)}</div>
            <div class="report-stat-label">Total Amount</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date Created</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Payment Date</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body - show unpaid first, then paid
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    // Sort unpaid by due date
    unpaidInvoices.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    unpaidInvoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.style.backgroundColor = invoice.status === 'Overdue' ? '#ffebee' : '#fff3cd';
        row.innerHTML = `
            <td><strong>${invoice.number}</strong></td>
            <td>${invoice.customerName}</td>
            <td>${formatDate(invoice.dateCreated)}</td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td>$${invoice.total.toFixed(2)}</td>
            <td class="${invoice.status === 'Overdue' ? 'table-status-overdue' : 'table-status-partial'} font-bold">${invoice.status}</td>
            <td>-</td>
        `;
        tbody.appendChild(row);
    });
    
    // Sort paid by payment date (most recent first)
    paidInvoices.sort((a, b) => new Date(b.paymentDate || b.dateCreated) - new Date(a.paymentDate || a.dateCreated));
    
    paidInvoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.style.backgroundColor = '#e8f5e8';
        row.innerHTML = `
            <td><strong>${invoice.number}</strong></td>
            <td>${invoice.customerName}</td>
            <td>${formatDate(invoice.dateCreated)}</td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td>$${invoice.total.toFixed(2)}</td>
            <td class="text-success font-bold">${invoice.status}</td>
            <td>${invoice.paymentDate ? formatDate(invoice.paymentDate) : '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Paid:</span>
            <span class="text-success">$${totalPaidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Unpaid:</span>
            <span class="text-danger">$${totalUnpaidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Amount:</span>
            <span>$${totalAmount.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Sales by Month Report
function showRevenueReport() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    
    // Calculate sales by month
    const monthlySales = {};
    
    invoices.forEach(invoice => {
        const date = new Date(invoice.dateCreated);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!monthlySales[monthKey]) {
            monthlySales[monthKey] = {
                month: monthName,
                totalInvoices: 0,
                totalSales: 0,
                paidInvoices: 0,
                paidAmount: 0,
                unpaidInvoices: 0,
                unpaidAmount: 0
            };
        }
        
        monthlySales[monthKey].totalInvoices++;
        monthlySales[monthKey].totalSales += invoice.total;
        
        if (invoice.status === 'Paid') {
            monthlySales[monthKey].paidInvoices++;
            monthlySales[monthKey].paidAmount += invoice.total;
        } else {
            monthlySales[monthKey].unpaidInvoices++;
            monthlySales[monthKey].unpaidAmount += invoice.total;
        }
    });
    
    // Convert to array and sort by month (most recent first)
    const monthArray = Object.keys(monthlySales).sort().reverse().map(key => monthlySales[key]);
    
    // Calculate totals
    const totalSales = monthArray.reduce((sum, m) => sum + m.totalSales, 0);
    const totalPaid = monthArray.reduce((sum, m) => sum + m.paidAmount, 0);
    const totalUnpaid = monthArray.reduce((sum, m) => sum + m.unpaidAmount, 0);
    const avgMonthlySales = totalSales / monthArray.length || 0;
    
    // Display report
    document.getElementById('report-title').textContent = 'Sales by Month';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${monthArray.length}</div>
            <div class="report-stat-label">Months with Sales</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalSales.toFixed(2)}</div>
            <div class="report-stat-label">Total Sales</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${avgMonthlySales.toFixed(2)}</div>
            <div class="report-stat-label">Avg Monthly Sales</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalUnpaid.toFixed(2)}</div>
            <div class="report-stat-label">Outstanding Balance</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Month</th>
            <th>Total Invoices</th>
            <th>Total Sales</th>
            <th>Paid Invoices</th>
            <th>Paid Amount</th>
            <th>Unpaid Invoices</th>
            <th>Unpaid Amount</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    monthArray.forEach(month => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${month.month}</strong></td>
            <td>${month.totalInvoices}</td>
            <td>$${month.totalSales.toFixed(2)}</td>
            <td>${month.paidInvoices}</td>
            <td class="text-success">$${month.paidAmount.toFixed(2)}</td>
            <td>${month.unpaidInvoices}</td>
            <td class="text-danger">$${month.unpaidAmount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Sales:</span>
            <span>$${totalSales.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Paid:</span>
            <span class="text-success">$${totalPaid.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Outstanding Balance:</span>
            <span class="text-danger">$${totalUnpaid.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// === EXPENSE REPORTS ===

// Expense Summary by Vendor
function showVendorReport() {
    hideAllReports();
    const bills = erpStorage.getBills();
    const vendors = erpStorage.getVendors();
    
    // Calculate expenses by vendor
    const vendorExpenses = {};
    
    bills.forEach(bill => {
        if (!vendorExpenses[bill.vendorId]) {
            vendorExpenses[bill.vendorId] = {
                vendorId: bill.vendorId,
                vendorName: bill.vendorName,
                totalBills: 0,
                totalExpenses: 0,
                paidBills: 0,
                paidAmount: 0,
                unpaidBills: 0,
                unpaidAmount: 0
            };
        }
        
        vendorExpenses[bill.vendorId].totalBills++;
        vendorExpenses[bill.vendorId].totalExpenses += bill.amount;
        
        if (bill.status === 'Paid') {
            vendorExpenses[bill.vendorId].paidBills++;
            vendorExpenses[bill.vendorId].paidAmount += bill.amount;
        } else {
            vendorExpenses[bill.vendorId].unpaidBills++;
            vendorExpenses[bill.vendorId].unpaidAmount += bill.amount;
        }
    });
    
    // Convert to array and sort by total expenses
    const vendorArray = Object.values(vendorExpenses).sort((a, b) => b.totalExpenses - a.totalExpenses);
    
    // Calculate totals
    const totalExpenses = vendorArray.reduce((sum, v) => sum + v.totalExpenses, 0);
    const totalPaid = vendorArray.reduce((sum, v) => sum + v.paidAmount, 0);
    const totalUnpaid = vendorArray.reduce((sum, v) => sum + v.unpaidAmount, 0);
    
    // Display report
    document.getElementById('report-title').textContent = 'Expenses by Vendor';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${vendorArray.length}</div>
            <div class="report-stat-label">Total Vendors</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalExpenses.toFixed(2)}</div>
            <div class="report-stat-label">Total Expenses</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalPaid.toFixed(2)}</div>
            <div class="report-stat-label">Paid Expenses</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalUnpaid.toFixed(2)}</div>
            <div class="report-stat-label">Unpaid Expenses</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Vendor Name</th>
            <th>Total Bills</th>
            <th>Total Expenses</th>
            <th>Paid Bills</th>
            <th>Paid Amount</th>
            <th>Unpaid Bills</th>
            <th>Unpaid Amount</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    vendorArray.forEach(vendor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${vendor.vendorName}</strong></td>
            <td>${vendor.totalBills}</td>
            <td>$${vendor.totalExpenses.toFixed(2)}</td>
            <td>${vendor.paidBills}</td>
            <td class="text-success">$${vendor.paidAmount.toFixed(2)}</td>
            <td>${vendor.unpaidBills}</td>
            <td class="text-danger">$${vendor.unpaidAmount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Expenses:</span>
            <span>$${totalExpenses.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Paid:</span>
            <span class="text-success">$${totalPaid.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Unpaid:</span>
            <span class="text-danger">$${totalUnpaid.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Bills Report (All Bills - Unpaid & Paid)
function showBillsReport() {
    hideAllReports();
    const bills = erpStorage.getBills();
    
    // Separate bills by status
    const paidBills = bills.filter(bill => bill.status === 'Paid');
    const unpaidBills = bills.filter(bill => bill.status !== 'Paid');
    
    // Calculate totals
    const totalPaidAmount = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalUnpaidAmount = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalAmount = totalPaidAmount + totalUnpaidAmount;
    
    // Display report
    document.getElementById('report-title').textContent = 'Bills Report - All Bills';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${bills.length}</div>
            <div class="report-stat-label">Total Bills</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${paidBills.length}</div>
            <div class="report-stat-label">Paid Bills</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${unpaidBills.length}</div>
            <div class="report-stat-label">Unpaid Bills</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalAmount.toFixed(2)}</div>
            <div class="report-stat-label">Total Amount</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Bill #</th>
            <th>Vendor</th>
            <th>Description</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Payment Date</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body - show unpaid first, then paid
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    // Sort unpaid by due date
    unpaidBills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    unpaidBills.forEach(bill => {
        const row = document.createElement('tr');
        row.style.backgroundColor = bill.status === 'Overdue' ? '#ffebee' : '#fff3cd';
        row.innerHTML = `
            <td><strong>${bill.billNumber || 'N/A'}</strong></td>
            <td>${bill.vendorName}</td>
            <td>${bill.description || '-'}</td>
            <td>${formatDate(bill.dueDate)}</td>
            <td>$${bill.amount.toFixed(2)}</td>
            <td class="${bill.status === 'Overdue' ? 'table-status-overdue' : 'table-status-partial'} font-bold">${bill.status}</td>
            <td>-</td>
        `;
        tbody.appendChild(row);
    });
    
    // Sort paid by payment date (most recent first)
    paidBills.sort((a, b) => new Date(b.paidDate || b.date) - new Date(a.paidDate || a.date));
    
    paidBills.forEach(bill => {
        const row = document.createElement('tr');
        row.style.backgroundColor = '#e8f5e8';
        row.innerHTML = `
            <td><strong>${bill.billNumber || 'N/A'}</strong></td>
            <td>${bill.vendorName}</td>
            <td>${bill.description || '-'}</td>
            <td>${formatDate(bill.dueDate)}</td>
            <td>$${bill.amount.toFixed(2)}</td>
            <td class="text-success font-bold">${bill.status}</td>
            <td>${bill.paidDate ? formatDate(bill.paidDate) : '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Paid:</span>
            <span class="text-success">$${totalPaidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Unpaid:</span>
            <span class="text-danger">$${totalUnpaidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Amount:</span>
            <span>$${totalAmount.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Expenses by Month
function showExpenseReport() {
    hideAllReports();
    const bills = erpStorage.getBills();
    
    // Calculate expenses by month
    const monthlyExpenses = {};
    
    bills.forEach(bill => {
        const date = new Date(bill.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!monthlyExpenses[monthKey]) {
            monthlyExpenses[monthKey] = {
                month: monthName,
                totalBills: 0,
                totalExpenses: 0,
                paidBills: 0,
                paidAmount: 0,
                unpaidBills: 0,
                unpaidAmount: 0
            };
        }
        
        monthlyExpenses[monthKey].totalBills++;
        monthlyExpenses[monthKey].totalExpenses += bill.amount;
        
        if (bill.status === 'Paid') {
            monthlyExpenses[monthKey].paidBills++;
            monthlyExpenses[monthKey].paidAmount += bill.amount;
        } else {
            monthlyExpenses[monthKey].unpaidBills++;
            monthlyExpenses[monthKey].unpaidAmount += bill.amount;
        }
    });
    
    // Convert to array and sort by month (most recent first)
    const monthArray = Object.keys(monthlyExpenses).sort().reverse().map(key => monthlyExpenses[key]);
    
    // Calculate totals
    const totalExpenses = monthArray.reduce((sum, m) => sum + m.totalExpenses, 0);
    const totalPaid = monthArray.reduce((sum, m) => sum + m.paidAmount, 0);
    const totalUnpaid = monthArray.reduce((sum, m) => sum + m.unpaidAmount, 0);
    const avgMonthlyExpenses = totalExpenses / monthArray.length || 0;
    
    // Display report
    document.getElementById('report-title').textContent = 'Expenses by Month';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${monthArray.length}</div>
            <div class="report-stat-label">Months with Expenses</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalExpenses.toFixed(2)}</div>
            <div class="report-stat-label">Total Expenses</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${avgMonthlyExpenses.toFixed(2)}</div>
            <div class="report-stat-label">Avg Monthly Expenses</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalUnpaid.toFixed(2)}</div>
            <div class="report-stat-label">Outstanding Balance</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Month</th>
            <th>Total Bills</th>
            <th>Total Expenses</th>
            <th>Paid Bills</th>
            <th>Paid Amount</th>
            <th>Unpaid Bills</th>
            <th>Unpaid Amount</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    monthArray.forEach(month => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${month.month}</strong></td>
            <td>${month.totalBills}</td>
            <td>$${month.totalExpenses.toFixed(2)}</td>
            <td>${month.paidBills}</td>
            <td class="text-success">$${month.paidAmount.toFixed(2)}</td>
            <td>${month.unpaidBills}</td>
            <td class="text-danger">$${month.unpaidAmount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Expenses:</span>
            <span>$${totalExpenses.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Paid:</span>
            <span class="text-success">$${totalPaid.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Outstanding Balance:</span>
            <span class="text-danger">$${totalUnpaid.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Cost Breakdown (Simple Summary)
function showCostReport() {
    hideAllReports();
    const bills = erpStorage.getBills();
    
    // Calculate overall cost breakdown
    const totalBills = bills.length;
    const paidBills = bills.filter(b => b.status === 'Paid');
    const unpaidBills = bills.filter(b => b.status !== 'Paid');
    const overdueBills = bills.filter(b => b.status === 'Overdue');
    
    const totalCosts = bills.reduce((sum, b) => sum + b.amount, 0);
    const paidCosts = paidBills.reduce((sum, b) => sum + b.amount, 0);
    const unpaidCosts = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
    const overdueCosts = overdueBills.reduce((sum, b) => sum + b.amount, 0);
    
    const avgBillAmount = totalCosts / totalBills || 0;
    
    // Display report
    document.getElementById('report-title').textContent = 'Cost Breakdown Summary';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">${totalBills}</div>
            <div class="report-stat-label">Total Bills</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalCosts.toFixed(2)}</div>
            <div class="report-stat-label">Total Costs</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${avgBillAmount.toFixed(2)}</div>
            <div class="report-stat-label">Avg Bill Amount</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${overdueCosts.toFixed(2)}</div>
            <div class="report-stat-label">Overdue Costs</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Status</th>
            <th>Number of Bills</th>
            <th>Total Amount</th>
            <th>Percentage of Total</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    const costData = [
        { status: 'Paid', count: paidBills.length, amount: paidCosts, color: '#5cb85c' },
        { status: 'Unpaid', count: unpaidBills.length, amount: unpaidCosts, color: '#f0ad4e' },
        { status: 'Overdue', count: overdueBills.length, amount: overdueCosts, color: '#d9534f' }
    ];
    
    costData.forEach(item => {
        const percentage = totalCosts > 0 ? (item.amount / totalCosts * 100).toFixed(1) : 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="font-bold" style="color: ${item.color};">${item.status}</td>
            <td>${item.count}</td>
            <td>$${item.amount.toFixed(2)}</td>
            <td>${percentage}%</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Bills:</span>
            <span>${totalBills}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Costs:</span>
            <span>$${totalCosts.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Inventory Reports
function showInventoryReport() {
    alert('Inventory Levels report coming soon! This will show current stock levels and availability.');
}

function showStockReport() {
    alert('Stock Movement report coming soon! This will track inventory in/out transactions.');
}

function showReorderReport() {
    alert('Reorder Report coming soon! This will show items that need restocking.');
}

function showValuationReport() {
    alert('Inventory Valuation report coming soon! This will show total inventory value.');
}

// === FINANCIAL REPORTS ===

// Profit & Loss Statement
function showProfitLossReport() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    const bills = erpStorage.getBills();
    const payrollRecords = JSON.parse(localStorage.getItem('erp_payroll_records') || '[]');
    
    // Calculate revenue (paid invoices only)
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    // Calculate expenses
    const paidBills = bills.filter(bill => bill.status === 'Paid');
    const billExpenses = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
    const payrollExpenses = payrollRecords.reduce((sum, record) => sum + record.netPay, 0);
    const totalExpenses = billExpenses + payrollExpenses;
    
    // Calculate profit
    const grossProfit = totalRevenue;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    
    // Display report
    document.getElementById('report-title').textContent = 'Profit & Loss Statement';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalRevenue.toFixed(2)}</div>
            <div class="report-stat-label">Total Revenue</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalExpenses.toFixed(2)}</div>
            <div class="report-stat-label">Total Expenses</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="${netProfit >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${netProfit.toFixed(2)}</div>
            <div class="report-stat-label">Net Profit</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="${profitMargin >= 0 ? 'conditional-positive' : 'conditional-negative'}">${profitMargin.toFixed(1)}%</div>
            <div class="report-stat-label">Profit Margin</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th class="report-table-left">Category</th>
            <th class="report-table-right">Amount</th>
            <th class="report-table-right">% of Revenue</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    // Revenue section
    const revenueRow = document.createElement('tr');
    revenueRow.style.backgroundColor = '#e8f5e8';
    revenueRow.innerHTML = `
        <td><strong>REVENUE (Income from Invoices)</strong></td>
        <td class="report-table-right"><strong>$${totalRevenue.toFixed(2)}</strong></td>
        <td class="report-table-right"><strong>100.0%</strong></td>
    `;
    tbody.appendChild(revenueRow);
    
    const revenueDetailRow = document.createElement('tr');
    revenueDetailRow.innerHTML = `
        <td class="report-table-padded">Paid Invoices (${paidInvoices.length})</td>
        <td class="report-table-right">$${totalRevenue.toFixed(2)}</td>
        <td class="report-table-right">100.0%</td>
    `;
    tbody.appendChild(revenueDetailRow);
    
    // Spacer
    const spacer1 = document.createElement('tr');
    spacer1.innerHTML = '<td colspan="3" class="report-table-spacer-10"></td>';
    tbody.appendChild(spacer1);
    
    // Expenses section
    const expensesHeaderRow = document.createElement('tr');
    expensesHeaderRow.style.backgroundColor = '#ffebee';
    expensesHeaderRow.innerHTML = `
        <td><strong>EXPENSES</strong></td>
        <td class="report-table-right"><strong>$${totalExpenses.toFixed(2)}</strong></td>
        <td class="report-table-right"><strong>${totalRevenue > 0 ? (totalExpenses / totalRevenue * 100).toFixed(1) : 0}%</strong></td>
    `;
    tbody.appendChild(expensesHeaderRow);
    
    // Bill expenses
    const billExpenseRow = document.createElement('tr');
    billExpenseRow.innerHTML = `
        <td class="report-table-padded">Bills & Vendor Expenses (${paidBills.length})</td>
        <td class="report-table-right">$${billExpenses.toFixed(2)}</td>
        <td class="report-table-right">${totalRevenue > 0 ? (billExpenses / totalRevenue * 100).toFixed(1) : 0}%</td>
    `;
    tbody.appendChild(billExpenseRow);
    
    // Payroll expenses
    const payrollExpenseRow = document.createElement('tr');
    payrollExpenseRow.innerHTML = `
        <td class="report-table-padded">Payroll Expenses (${payrollRecords.length})</td>
        <td class="report-table-right">$${payrollExpenses.toFixed(2)}</td>
        <td class="report-table-right">${totalRevenue > 0 ? (payrollExpenses / totalRevenue * 100).toFixed(1) : 0}%</td>
    `;
    tbody.appendChild(payrollExpenseRow);
    
    // Spacer
    const spacer2 = document.createElement('tr');
    spacer2.innerHTML = '<td colspan="3" class="report-table-spacer-10"></td>';
    tbody.appendChild(spacer2);
    
    // Net profit
    const profitRow = document.createElement('tr');
    profitRow.style.backgroundColor = netProfit >= 0 ? '#d4edda' : '#f8d7da';
    profitRow.style.fontWeight = 'bold';
    profitRow.style.fontSize = '16px';
    profitRow.innerHTML = `
        <td><strong>NET PROFIT</strong></td>
        <td class="report-table-right ${netProfit >= 0 ? 'conditional-positive' : 'conditional-negative'}"><strong>$${netProfit.toFixed(2)}</strong></td>
        <td class="report-table-right ${netProfit >= 0 ? 'conditional-positive' : 'conditional-negative'}"><strong>${profitMargin.toFixed(1)}%</strong></td>
    `;
    tbody.appendChild(profitRow);
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Revenue:</span>
            <span class="text-success">$${totalRevenue.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Expenses:</span>
            <span class="text-danger">$${totalExpenses.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Net Profit:</span>
            <span class="${netProfit >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${netProfit.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Cash Flow Report
function showCashFlowReport() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    const bills = erpStorage.getBills();
    const payrollRecords = JSON.parse(localStorage.getItem('erp_payroll_records') || '[]');
    
    // Calculate monthly cash flow
    const monthlyCashFlow = {};
    
    // Money in (paid invoices)
    invoices.filter(inv => inv.status === 'Paid' && inv.paymentDate).forEach(invoice => {
        const date = new Date(invoice.paymentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!monthlyCashFlow[monthKey]) {
            monthlyCashFlow[monthKey] = {
                month: monthName,
                moneyIn: 0,
                moneyOut: 0,
                netFlow: 0
            };
        }
        
        monthlyCashFlow[monthKey].moneyIn += invoice.total;
    });
    
    // Money out (paid bills)
    bills.filter(bill => bill.status === 'Paid' && bill.paidDate).forEach(bill => {
        const date = new Date(bill.paidDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!monthlyCashFlow[monthKey]) {
            monthlyCashFlow[monthKey] = {
                month: monthName,
                moneyIn: 0,
                moneyOut: 0,
                netFlow: 0
            };
        }
        
        monthlyCashFlow[monthKey].moneyOut += bill.amount;
    });
    
    // Money out (payroll)
    payrollRecords.forEach(record => {
        const date = new Date(record.paidDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!monthlyCashFlow[monthKey]) {
            monthlyCashFlow[monthKey] = {
                month: monthName,
                moneyIn: 0,
                moneyOut: 0,
                netFlow: 0
            };
        }
        
        monthlyCashFlow[monthKey].moneyOut += record.netPay;
    });
    
    // Calculate net flow for each month
    Object.values(monthlyCashFlow).forEach(month => {
        month.netFlow = month.moneyIn - month.moneyOut;
    });
    
    // Convert to array and sort
    const monthArray = Object.keys(monthlyCashFlow).sort().reverse().map(key => monthlyCashFlow[key]);
    
    // Calculate totals
    const totalMoneyIn = monthArray.reduce((sum, m) => sum + m.moneyIn, 0);
    const totalMoneyOut = monthArray.reduce((sum, m) => sum + m.moneyOut, 0);
    const totalNetFlow = totalMoneyIn - totalMoneyOut;
    const avgMonthlyFlow = totalNetFlow / monthArray.length || 0;
    
    // Display report
    document.getElementById('report-title').textContent = 'Cash Flow Report';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value" class="text-success">$${totalMoneyIn.toFixed(2)}</div>
            <div class="report-stat-label">Total Money In</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="text-danger">$${totalMoneyOut.toFixed(2)}</div>
            <div class="report-stat-label">Total Money Out</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="${totalNetFlow >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${totalNetFlow.toFixed(2)}</div>
            <div class="report-stat-label">Net Cash Flow</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="${avgMonthlyFlow >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${avgMonthlyFlow.toFixed(2)}</div>
            <div class="report-stat-label">Avg Monthly Flow</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th>Month</th>
            <th>Money In</th>
            <th>Money Out</th>
            <th>Net Cash Flow</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    monthArray.forEach(month => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${month.month}</strong></td>
            <td class="text-success">$${month.moneyIn.toFixed(2)}</td>
            <td class="text-danger">$${month.moneyOut.toFixed(2)}</td>
            <td class="${month.netFlow >= 0 ? 'conditional-positive' : 'conditional-negative'} font-bold">$${month.netFlow.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Money In:</span>
            <span class="text-success">$${totalMoneyIn.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Money Out:</span>
            <span class="text-danger">$${totalMoneyOut.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Net Cash Flow:</span>
            <span class="${totalNetFlow >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${totalNetFlow.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Balance Sheet
function showBalanceSheetReport() {
    hideAllReports();
    const invoices = erpStorage.getInvoices();
    const bills = erpStorage.getBills();
    const products = erpStorage.getProducts();
    
    // ASSETS
    // Cash (total paid invoices minus paid bills/payroll)
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalReceived = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    const paidBills = bills.filter(bill => bill.status === 'Paid');
    const totalPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
    
    const payrollRecords = JSON.parse(localStorage.getItem('erp_payroll_records') || '[]');
    const payrollPaid = payrollRecords.reduce((sum, record) => sum + record.netPay, 0);
    
    const cash = totalReceived - totalPaid - payrollPaid;
    
    // Accounts Receivable (unpaid invoices)
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'Paid');
    const accountsReceivable = unpaidInvoices.reduce((sum, inv) => {
        // For partially paid invoices, only count the remaining balance
        if (inv.payments && inv.payments.length > 0) {
            const totalPaid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0);
            return sum + (inv.total - totalPaid);
        }
        return sum + inv.total;
    }, 0);
    
    // Inventory value
    const inventoryValue = products.reduce((sum, prod) => sum + (prod.price * (prod.stock || 0)), 0);
    
    const totalAssets = cash + accountsReceivable + inventoryValue;
    
    // LIABILITIES
    // Accounts Payable (unpaid bills)
    const unpaidBills = bills.filter(bill => bill.status !== 'Paid');
    const accountsPayable = unpaidBills.reduce((sum, bill) => {
        // For partially paid bills, only count the remaining balance
        if (bill.payments && bill.payments.length > 0) {
            const totalPaid = bill.payments.reduce((pSum, p) => pSum + p.amount, 0);
            return sum + (bill.amount - totalPaid);
        }
        return sum + bill.amount;
    }, 0);
    
    const totalLiabilities = accountsPayable;
    
    // EQUITY
    const equity = totalAssets - totalLiabilities;
    
    // Display report
    document.getElementById('report-title').textContent = 'Balance Sheet';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalAssets.toFixed(2)}</div>
            <div class="report-stat-label">Total Assets</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalLiabilities.toFixed(2)}</div>
            <div class="report-stat-label">Total Liabilities</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value" class="${equity >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${equity.toFixed(2)}</div>
            <div class="report-stat-label">Owner's Equity</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : '∞'}</div>
            <div class="report-stat-label">Asset/Liability Ratio</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers
    const headersHTML = `
        <tr>
            <th class="report-table-left">Account</th>
            <th class="report-table-right">Amount</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    // Assets section
    const assetsHeaderRow = document.createElement('tr');
    assetsHeaderRow.style.backgroundColor = '#e8f5e8';
    assetsHeaderRow.innerHTML = `
        <td><strong>ASSETS</strong></td>
        <td class="report-table-right"><strong>$${totalAssets.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(assetsHeaderRow);
    
    const cashRow = document.createElement('tr');
    cashRow.innerHTML = `
        <td class="report-table-padded">Cash</td>
        <td class="report-table-right">$${cash.toFixed(2)}</td>
    `;
    tbody.appendChild(cashRow);
    
    const arRow = document.createElement('tr');
    arRow.innerHTML = `
        <td class="report-table-padded">Accounts Receivable (${unpaidInvoices.length} invoices)</td>
        <td class="report-table-right">$${accountsReceivable.toFixed(2)}</td>
    `;
    tbody.appendChild(arRow);
    
    const inventoryRow = document.createElement('tr');
    inventoryRow.innerHTML = `
        <td class="report-table-padded">Inventory (${products.length} products)</td>
        <td class="report-table-right">$${inventoryValue.toFixed(2)}</td>
    `;
    tbody.appendChild(inventoryRow);
    
    // Spacer
    const spacer1 = document.createElement('tr');
    spacer1.innerHTML = '<td colspan="2" class="report-table-spacer-10"></td>';
    tbody.appendChild(spacer1);
    
    // Liabilities section
    const liabilitiesHeaderRow = document.createElement('tr');
    liabilitiesHeaderRow.style.backgroundColor = '#ffebee';
    liabilitiesHeaderRow.innerHTML = `
        <td><strong>LIABILITIES</strong></td>
        <td class="report-table-right"><strong>$${totalLiabilities.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(liabilitiesHeaderRow);
    
    const apRow = document.createElement('tr');
    apRow.innerHTML = `
        <td class="report-table-padded">Accounts Payable (${unpaidBills.length} bills)</td>
        <td class="report-table-right">$${accountsPayable.toFixed(2)}</td>
    `;
    tbody.appendChild(apRow);
    
    // Spacer
    const spacer2 = document.createElement('tr');
    spacer2.innerHTML = '<td colspan="2" class="report-table-spacer-10"></td>';
    tbody.appendChild(spacer2);
    
    // Equity section
    const equityHeaderRow = document.createElement('tr');
    equityHeaderRow.style.backgroundColor = '#d4edda';
    equityHeaderRow.innerHTML = `
        <td><strong>OWNER'S EQUITY</strong></td>
        <td class="report-table-right"><strong>$${equity.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(equityHeaderRow);
    
    const equityRow = document.createElement('tr');
    equityRow.innerHTML = `
        <td class="report-table-padded">Retained Earnings</td>
        <td class="report-table-right">$${equity.toFixed(2)}</td>
    `;
    tbody.appendChild(equityRow);
    
    // Spacer
    const spacer3 = document.createElement('tr');
    spacer3.innerHTML = '<td colspan="2" class="report-table-spacer-10"></td>';
    tbody.appendChild(spacer3);
    
    // Total
    const totalRow = document.createElement('tr');
    totalRow.style.backgroundColor = '#f8f9fa';
    totalRow.style.fontWeight = 'bold';
    totalRow.innerHTML = `
        <td><strong>TOTAL LIABILITIES + EQUITY</strong></td>
        <td class="report-table-right"><strong>$${(totalLiabilities + equity).toFixed(2)}</strong></td>
    `;
    tbody.appendChild(totalRow);
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Assets:</span>
            <span>$${totalAssets.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Liabilities:</span>
            <span>$${totalLiabilities.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Owner's Equity:</span>
            <span class="${equity >= 0 ? 'conditional-positive' : 'conditional-negative'}">$${equity.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Business Analytics
function showPerformanceReport() {
    alert('Performance Metrics report coming soon! This will show key business performance indicators.');
}

function showTrendReport() {
    alert('Trend Analysis report coming soon! This will show business trends over time.');
}

function showForecastReport() {
    alert('Sales Forecast report coming soon! This will predict future sales based on historical data.');
}

function showComparisonReport() {
    alert('Period Comparison report coming soon! This will compare performance across different time periods.');
}

function showPayrollAnalysis() {
    hideAllReports();
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate payroll statistics by month
    const monthlyPayroll = {};
    const employeeStats = {};
    
    payrollRecords.forEach(record => {
        const paidDate = new Date(record.paidDate);
        const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = paidDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        // Monthly totals
        if (!monthlyPayroll[monthKey]) {
            monthlyPayroll[monthKey] = {
                month: monthName,
                grossPay: 0,
                deductions: 0,
                netPay: 0,
                recordCount: 0
            };
        }
        
        monthlyPayroll[monthKey].grossPay += record.grossPay;
        monthlyPayroll[monthKey].deductions += record.totalDeductions;
        monthlyPayroll[monthKey].netPay += record.netPay;
        monthlyPayroll[monthKey].recordCount++;
        
        // Employee statistics
        if (!employeeStats[record.employeeId]) {
            const employee = employees.find(emp => emp.id === record.employeeId);
            employeeStats[record.employeeId] = {
                employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
                totalGross: 0,
                totalNet: 0,
                paycheckCount: 0
            };
        }
        
        employeeStats[record.employeeId].totalGross += record.grossPay;
        employeeStats[record.employeeId].totalNet += record.netPay;
        employeeStats[record.employeeId].paycheckCount++;
    });
    
    // Convert to arrays
    const monthArray = Object.keys(monthlyPayroll).sort().reverse().map(key => monthlyPayroll[key]);
    const employeeArray = Object.values(employeeStats).sort((a, b) => b.totalGross - a.totalGross);
    
    // Calculate overall totals
    const totalGrossPay = payrollRecords.reduce((sum, r) => sum + r.grossPay, 0);
    const totalDeductions = payrollRecords.reduce((sum, r) => sum + r.totalDeductions, 0);
    const totalNetPay = payrollRecords.reduce((sum, r) => sum + r.netPay, 0);
    const avgDeductionRate = totalGrossPay > 0 ? (totalDeductions / totalGrossPay * 100) : 0;
    
    // Calculate current month payroll
    const currentMonthRecords = payrollRecords.filter(record => {
        const paidDate = new Date(record.paidDate);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    });
    const currentMonthTotal = currentMonthRecords.reduce((sum, r) => sum + r.netPay, 0);
    
    // Display report
    document.getElementById('report-title').textContent = 'Payroll Analysis';
    
    const summaryHTML = `
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalGrossPay.toFixed(2)}</div>
            <div class="report-stat-label">Total Gross Pay</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${totalNetPay.toFixed(2)}</div>
            <div class="report-stat-label">Total Net Pay</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">${avgDeductionRate.toFixed(1)}%</div>
            <div class="report-stat-label">Avg Deduction Rate</div>
        </div>
        <div class="report-stat-card">
            <div class="report-stat-value">$${currentMonthTotal.toFixed(2)}</div>
            <div class="report-stat-label">Current Month</div>
        </div>
    `;
    document.getElementById('report-summary').innerHTML = summaryHTML;
    
    // Table headers - Monthly Breakdown
    const headersHTML = `
        <tr>
            <th colspan="5" class="payroll-table-header-section">Monthly Payroll Breakdown</th>
        </tr>
        <tr>
            <th>Month</th>
            <th>Gross Pay</th>
            <th>Total Deductions</th>
            <th>Net Pay</th>
            <th>Paychecks</th>
        </tr>
    `;
    document.getElementById('report-table-head').innerHTML = headersHTML;
    
    // Table body - Monthly data
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';
    
    monthArray.forEach(month => {
        const deductionRate = month.grossPay > 0 ? (month.deductions / month.grossPay * 100).toFixed(1) : 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${month.month}</strong></td>
            <td>$${month.grossPay.toFixed(2)}</td>
            <td>$${month.deductions.toFixed(2)} <span class="payroll-deduction-rate">(${deductionRate}%)</span></td>
            <td class="text-success font-bold">$${month.netPay.toFixed(2)}</td>
            <td>${month.recordCount}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add employee breakdown section
    const employeeSectionRow = document.createElement('tr');
    employeeSectionRow.innerHTML = `
        <th colspan="5" class="payroll-table-header-section-border">Employee Payroll Totals</th>
    `;
    tbody.appendChild(employeeSectionRow);
    
    const employeeHeaderRow = document.createElement('tr');
    employeeHeaderRow.innerHTML = `
        <th>Employee</th>
        <th>Total Gross Pay</th>
        <th>Total Net Pay</th>
        <th>Avg per Paycheck</th>
        <th>Paychecks</th>
    `;
    tbody.appendChild(employeeHeaderRow);
    
    employeeArray.forEach(emp => {
        const avgPerCheck = emp.totalNet / emp.paycheckCount;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${emp.employeeName}</strong></td>
            <td>$${emp.totalGross.toFixed(2)}</td>
            <td class="text-success">$${emp.totalNet.toFixed(2)}</td>
            <td>$${avgPerCheck.toFixed(2)}</td>
            <td>${emp.paycheckCount}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals
    const totalsHTML = `
        <div class="total-row">
            <span>Total Gross Pay:</span>
            <span>$${totalGrossPay.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Total Deductions (${avgDeductionRate.toFixed(1)}%):</span>
            <span>$${totalDeductions.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total Net Pay:</span>
            <span>$${totalNetPay.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('report-totals').innerHTML = totalsHTML;
    
    document.getElementById('report-results').style.display = 'block';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadReportsData();
    console.log('Reports System loaded');
    console.log('Features: Payroll reports, Employee summaries, Tax summaries');
});

console.log('Reports & Analytics System loaded');
console.log('Features: Comprehensive payroll reporting, Employee analytics, Tax summaries');


