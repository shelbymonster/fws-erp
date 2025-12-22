// Consolidated Bills Management System
let bills = [];
let vendors = [];
let currentSortOrder = {
    dateCreated: 'desc',
    dueDate: 'desc'
};

// Bill attachments storage (separate for flexibility)
let billAttachments = {};

// Payment types
const paymentTypes = [
    'Cash', 'Check', 'Credit Card', 'Debit Card', 'Bank Transfer',
    'ACH/Wire', 'PayPal', 'Venmo', 'Zelle', 'Other'
];

// Load data on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading state
    LoadingState.showTableLoading('bills-tbody', 10);
    
    // Simulate async load
    await LoadingState.simulateAsync(() => {
        loadData();
        updateOverdueBills();
    }, 400);
    
    displayBills();
    setupBillFormDefaults();
    migrateOldPartialPayments();
});

// Load data from storage
function loadData() {
    bills = erpStorage.getBills() || [];
    vendors = erpStorage.getVendors() || [];
    billAttachments = JSON.parse(localStorage.getItem('bill_attachments') || '{}');
}

// Migrate old percentage-based partial payments to dollar amounts
function migrateOldPartialPayments() {
    let updated = false;

    bills.forEach(bill => {
        if (bill.status && bill.status.includes('Partial') && bill.status.includes('%')) {
            const percentMatch = bill.status.match(/Partial \((\d+\.?\d*)%\)/);
            if (percentMatch) {
                const percentage = parseFloat(percentMatch[1]);
                const amountPaid = (bill.amount * percentage) / 100;
                
                if (!bill.payments) {
                    bill.payments = [];
                }
                
                if (bill.payments.length === 0) {
                    const migrationPayment = {
                        id: Date.now(),
                        type: 'Unknown',
                        date: bill.paidDate || bill.dateCreated,
                        amount: amountPaid,
                        reference: 'Migrated from old system',
                        notes: `Original status: ${bill.status}`,
                        recordedDate: new Date().toISOString()
                    };
                    
                    bill.payments.push(migrationPayment);
                }
                
                const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                bill.status = `Partial ($${totalPaid.toFixed(2)})`;
                updated = true;
            }
        }
    });

    if (updated) {
        erpStorage.setBills(bills);
        console.log('Migration complete - updated bill statuses');
    }
}

// Update overdue bills
function updateOverdueBills() {
    const today = new Date();
    bills.forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        if (bill.status === 'Unpaid' && dueDate < today) {
            bill.status = 'Overdue';
            erpStorage.updateBill(bill.id, { status: 'Overdue' });
        }
    });
}

// Setup bill form defaults
function setupBillFormDefaults() {
    // Bill form setup is now handled directly in showAddBillForm function
    // No need to wrap it here
}

// Update due date when bill date changes (30 days after bill date)
function updateBillDueDateFromBillDate() {
    const billDateField = document.getElementById('billDate');
    const dueDateField = document.getElementById('billDueDate');
    
    if (billDateField && dueDateField && billDateField.value) {
        const billDate = new Date(billDateField.value);
        const dueDate = new Date(billDate);
        dueDate.setDate(dueDate.getDate() + 30);
        dueDateField.value = dueDate.toISOString().split('T')[0];
    }
}

// Display bills
function displayBills(filter = 'all') {
    const tbody = document.getElementById('bills-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filteredBills = bills;
    
    if (filter !== 'all') {
        if (filter === 'overdue') {
            const today = new Date();
            filteredBills = bills.filter(bill => {
                const dueDate = new Date(bill.dueDate);
                return dueDate < today && bill.status !== 'Paid';
            });
        } else if (filter === 'paid') {
            filteredBills = bills.filter(bill => bill.status === 'Paid');
        } else if (filter === 'unpaid') {
            filteredBills = bills.filter(bill => bill.status === 'Unpaid');
        }
    }
    
    filteredBills.forEach(bill => {
        if (!bill || !bill.status) {
            console.warn('Skipping bill with missing data:', bill);
            return;
        }
        
        const row = document.createElement('tr');
        
        if (bill.status === 'Overdue') {
            row.className = 'table-status-overdue';
        } else if (bill.status === 'Paid') {
            row.className = 'table-status-paid';
        }
        
        const attachmentDisplay = bill.attachment ? 
            `<a href="#" onclick="return false;" class="attachment-link">${bill.attachment.name}</a>` : 
            'No';
        
        const paidDateDisplay = bill.status === 'Paid' && bill.paymentDate ? formatDate(bill.paymentDate) : '';
        
        // Get categories from items or show N/A
        let categoryDisplay = 'N/A';
        if (bill.items && bill.items.length > 0) {
            const categories = [...new Set(bill.items.map(item => item.category).filter(cat => cat))];
            categoryDisplay = categories.length > 0 ? categories.join(', ') : 'N/A';
        }
        
        // Safely handle amount display
        const billAmount = parseFloat(bill.amount) || 0;
        let amountDisplay;
        if (bill.isCredit) {
            const totalCreditAmount = Math.abs(billAmount);
            const usedAmount = bill.amountUsed || 0;
            const availableAmount = totalCreditAmount - usedAmount;
            amountDisplay = `<span style="color: #5cb85c;">($${availableAmount.toFixed(2)})</span>`;
        } else {
            amountDisplay = `$${billAmount.toFixed(2)}`;
        }
        
        row.innerHTML = `
            <td>${bill.vendorName || 'Unknown'}</td>
            <td>${bill.invoiceNumber || 'N/A'}</td>
            <td>${categoryDisplay}</td>
            <td>${bill.description || 'N/A'}</td>
            <td>${amountDisplay}</td>
            <td>${formatDate(bill.billDate || bill.dateCreated)}</td>
            <td>${formatDate(bill.dueDate)}</td>
            <td class="${getStatusClass(bill.status)}">${bill.status}</td>
            <td>${paidDateDisplay}</td>
            <td>${attachmentDisplay}</td>
            <td>
                ${getBillActionButtons(bill)}
                <button class="button button-info button-small" onclick="showAttachmentDialog(${bill.id})">Attach</button>
                <button class="button button-warning button-small" onclick="editBill(${bill.id})">Edit</button>
                <button class="button button-danger button-small" onclick="deleteBill(${bill.id})">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    updateBillsSummary();
}

// Get status color
function getStatusColor(status) {
    if (status === 'Paid') return '#5cb85c';
    if (status === 'Overdue') return '#d9534f';
    if (status && status.startsWith('Partial')) return '#f0ad4e';
    return '#666';
}

// Get status CSS class
function getStatusClass(status) {
    if (status === 'Paid') return 'text-success';
    if (status === 'Overdue') return 'text-danger';
    if (status === 'Credit' || status === 'Applied') return 'text-info';
    if (status && status.startsWith('Partial')) return 'text-warning';
    return 'text-muted';
}

// Get bill action buttons based on status
function getBillActionButtons(bill) {
    // For credits, show History button
    if (bill.isCredit) {
        return `<button class="button button-info button-small" onclick="showCreditHistory(${bill.id})">History</button>`;
    }
    
    // For regular bills, show payment buttons
    if (bill.status === 'Paid') {
        return `<button class="button button-success button-small" onclick="showPaymentHistory(${bill.id})">History</button>`;
    } else if (bill.status && bill.status.startsWith('Partial')) {
        return `
            <button class="button button-success button-small" onclick="showPaymentDialog(${bill.id})">Payment</button>
            <button class="button button-info button-small" onclick="showPaymentHistory(${bill.id})">History</button>
        `;
    } else {
        return `<button class="button button-success button-small" onclick="showPaymentDialog(${bill.id})">Payment</button>`;
    }
}

// Format dates
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Filter bills
function filterBills(filter) {
    displayBills(filter);
}

// Sort bills by date created
function sortBillsByDateCreated() {
    currentSortOrder.dateCreated = currentSortOrder.dateCreated === 'asc' ? 'desc' : 'asc';
    
    bills.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return currentSortOrder.dateCreated === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    displayBills();
}

// Sort bills by due date
function sortBillsByDueDate() {
    currentSortOrder.dueDate = currentSortOrder.dueDate === 'asc' ? 'desc' : 'asc';
    
    bills.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return currentSortOrder.dueDate === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    displayBills();
}

// Update bills summary
function updateBillsSummary() {
    // Add summary update logic if needed
}

// === PAYMENT DIALOG SYSTEM ===

function showPaymentDialog(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) {
        alert('Bill not found!');
        return;
    }

    if (bill.status === 'Paid') {
        showPaymentHistory(billId);
        return;
    }

    const totalPaid = bill.payments ? bill.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const remainingAmount = bill.amount - totalPaid;
    const isPartialPayment = totalPaid > 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Get available credits for this vendor
    const availableCredits = getAvailableCreditsForVendor(bill.vendorId);
    
    // Build payment type options including credits
    let paymentTypeOptions = `<option value="">Select payment method...</option>`;
    
    // Add vendor credits as payment options
    if (availableCredits.length > 0) {
        paymentTypeOptions += `<optgroup label="Available Vendor Credits">`;
        availableCredits.forEach(credit => {
            const totalCreditAmount = Math.abs(credit.amount);
            const usedAmount = credit.amountUsed || 0;
            const availableCreditAmount = totalCreditAmount - usedAmount;
            paymentTypeOptions += `<option value="credit-${credit.id}" data-credit-amount="${availableCreditAmount}">Credit Invoice #${credit.invoiceNumber || credit.id} - $${availableCreditAmount.toFixed(2)} available</option>`;
        });
        paymentTypeOptions += `</optgroup>`;
    }
    
    // Add regular payment methods
    paymentTypeOptions += `<optgroup label="Payment Methods">`;
    paymentTypeOptions += paymentTypes.map(type => `<option value="${type}">${type}</option>`).join('');
    paymentTypeOptions += `</optgroup>`;

    const dialogHTML = `
        <div id="payment-dialog" class="payment-dialog">
            <div class="payment-dialog-content">
                <h3 class="payment-dialog-header">
                    ${isPartialPayment ? 'Additional Payment' : 'Record Payment'}
                </h3>
                
                <div class="payment-info-box">
                    <div><strong>Vendor:</strong> ${bill.vendorName}</div>
                    <div><strong>Description:</strong> ${bill.description}</div>
                    <div class="bill-payment-total">
                        <strong>Original Amount:</strong> $${bill.amount.toFixed(2)}
                    </div>
                    ${isPartialPayment ? `
                        <div class="text-info">
                            <strong>Already Paid:</strong> $${totalPaid.toFixed(2)}
                        </div>
                        <div class="text-danger">
                            <strong>Remaining Balance:</strong> $${remainingAmount.toFixed(2)}
                        </div>
                    ` : ''}
                </div>
                
                <form id="payment-form">
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Type:</label>
                        <select id="paymentType" required class="payment-form-input" onchange="handlePaymentTypeChange()">
                            ${paymentTypeOptions}
                        </select>
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Date:</label>
                        <input type="date" id="paymentDate" value="${today}" required class="payment-form-input">
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Reference/Check Number:</label>
                        <input type="text" id="paymentReference" placeholder="Check #, Transaction ID, etc." class="payment-form-input">
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Amount:</label>
                        <input type="number" id="paymentAmount" value="${remainingAmount.toFixed(2)}" step="0.01" min="0.01" required class="payment-form-input">
                        <small class="payment-form-hint">Maximum remaining amount: $${remainingAmount.toFixed(2)}</small>
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Notes:</label>
                        <textarea id="paymentNotes" placeholder="Additional notes..." class="payment-form-input"></textarea>
                    </div>
                    
                    <div class="payment-actions">
                        <button type="button" onclick="closePaymentDialog()" class="payment-cancel-button">Cancel</button>
                        <button type="submit" class="payment-submit-button">Record Payment</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    closePaymentDialog();
    document.body.insertAdjacentHTML('beforeend', dialogHTML);

    document.getElementById('payment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        processPayment(billId);
    });
}

function processPayment(billId) {
    const paymentType = document.getElementById('paymentType').value;
    const paymentDate = document.getElementById('paymentDate').value;
    const paymentReference = document.getElementById('paymentReference').value;
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentNotes = document.getElementById('paymentNotes').value;

    if (!paymentType || !paymentDate || paymentAmount <= 0) {
        alert('Please fill in all required fields.');
        return;
    }

    const bill = bills.find(b => b.id === billId);
    if (!bill) {
        alert('Bill not found!');
        return;
    }

    const totalPaid = bill.payments ? bill.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const remainingAmount = bill.amount - totalPaid;
    
    // Check if payment exceeds remaining amount (with small tolerance for rounding)
    if (paymentAmount > remainingAmount + 0.01) {
        alert(`Payment amount ($${paymentAmount.toFixed(2)}) exceeds remaining balance ($${remainingAmount.toFixed(2)}). Please enter a valid amount.`);
        return;
    }
    
    // Check if this is a credit payment
    const isCreditPayment = paymentType.startsWith('credit-');
    let actualPaymentType = paymentType;
    let creditId = null;
    
    if (isCreditPayment) {
        creditId = parseInt(paymentType.replace('credit-', ''));
        const credit = bills.find(b => b.id === creditId);
        
        if (!credit || !credit.isCredit) {
            alert('This credit is no longer available.');
            return;
        }
        
        // Calculate available credit amount
        const totalCreditAmount = Math.abs(credit.amount);
        const usedAmount = credit.amountUsed || 0;
        const availableCreditAmount = totalCreditAmount - usedAmount;
        
        // Check if enough credit is available
        if (paymentAmount > availableCreditAmount + 0.01) {
            alert(`Only $${availableCreditAmount.toFixed(2)} is available from this credit. Please adjust the payment amount.`);
            return;
        }
        
        // Update credit tracking
        if (!credit.amountUsed) {
            credit.amountUsed = 0;
        }
        credit.amountUsed += paymentAmount;
        
        // Calculate remaining credit
        const remainingCredit = totalCreditAmount - credit.amountUsed;
        
        // Update credit status based on remaining amount
        if (remainingCredit <= 0.01) { // Account for floating point precision
            credit.status = 'Applied';
            credit.fullyAppliedDate = new Date().toISOString().split('T')[0];
        } else {
            credit.status = 'Credit'; // Keep as Credit if there's remaining balance
        }
        
        // Track where this credit was applied
        if (!credit.appliedTo) {
            credit.appliedTo = [];
        }
        credit.appliedTo.push({
            billId: billId,
            billInvoiceNumber: bill.invoiceNumber,
            amount: paymentAmount,
            date: paymentDate
        });
        
        erpStorage.updateBill(credit.id, credit);
        
        actualPaymentType = 'Vendor Credit';
        
        // Initialize creditsApplied if it doesn't exist
        if (!bill.creditsApplied) {
            bill.creditsApplied = [];
        }
        
        bill.creditsApplied.push({
            creditId: creditId,
            creditInvoiceNumber: credit.invoiceNumber,
            amount: paymentAmount,
            appliedDate: paymentDate
        });
    }

    const payment = {
        id: Date.now(),
        type: actualPaymentType,
        date: paymentDate,
        amount: paymentAmount,
        reference: isCreditPayment ? `Credit from Invoice #${bills.find(b => b.id === creditId)?.invoiceNumber || creditId}` : paymentReference,
        notes: isCreditPayment ? `Applied vendor credit` : paymentNotes,
        recordedDate: new Date().toISOString()
    };

    if (!bill.payments) {
        bill.payments = [];
    }
    bill.payments.push(payment);

    const newTotalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Use a small tolerance (1 cent) to handle rounding issues
    const tolerance = 0.01;
    const remaining = bill.amount - newTotalPaid;
    
    if (Math.abs(remaining) <= tolerance || newTotalPaid >= bill.amount) {
        // Bill is fully paid (or overpaid by less than 1 cent)
        bill.status = 'Paid';
        bill.paymentDate = paymentDate;
        bill.paymentType = actualPaymentType;
        bill.paymentReference = payment.reference;
    } else {
        // Bill is partially paid
        bill.status = `Partial ($${newTotalPaid.toFixed(2)})`;
    }

    erpStorage.setBills(bills);

    closePaymentDialog();
    loadData();
    displayBills();

    const message = bill.status === 'Paid' ? 
        'Payment recorded successfully! Bill is now fully paid.' :
        `Partial payment recorded! Paid $${newTotalPaid.toFixed(2)} of $${bill.amount.toFixed(2)} (remaining: $${remaining.toFixed(2)})`;
    
    alert(message);
}

// Handle payment type change to auto-fill credit amount
function handlePaymentTypeChange() {
    const paymentTypeSelect = document.getElementById('paymentType');
    const paymentAmountInput = document.getElementById('paymentAmount');
    const selectedOption = paymentTypeSelect.options[paymentTypeSelect.selectedIndex];
    
    if (paymentTypeSelect.value.startsWith('credit-')) {
        const creditAmount = parseFloat(selectedOption.getAttribute('data-credit-amount'));
        if (creditAmount) {
            // Get the remaining amount
            const currentAmount = parseFloat(paymentAmountInput.value) || 0;
            const maxAmount = parseFloat(paymentAmountInput.max) || currentAmount;
            
            // Set the payment amount to the lesser of credit amount or remaining balance
            paymentAmountInput.value = Math.min(creditAmount, maxAmount).toFixed(2);
        }
    }
}

function showPaymentHistory(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill || !bill.payments) {
        alert('No payment history found.');
        return;
    }

    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);

    const historyHTML = `
        <div id="payment-dialog" class="payment-dialog">
            <div class="payment-dialog-content">
                <h3 class="payment-dialog-header">Payment History</h3>
                
                <div class="payment-info-box">
                    <div><strong>Vendor:</strong> ${bill.vendorName}</div>
                    <div><strong>Description:</strong> ${bill.description}</div>
                    <div><strong>Bill Amount:</strong> $${bill.amount.toFixed(2)}</div>
                    <div class="text-success"><strong>Total Paid:</strong> $${totalPaid.toFixed(2)}</div>
                </div>
                
                <h4>Payment Records:</h4>
                ${bill.payments.map((payment, index) => `
                    <div class="payment-history-item">
                        <div class="payment-history-grid">
                            <div><strong>Payment #${index + 1}</strong></div>
                            <div class="payment-history-amount">$${payment.amount.toFixed(2)}</div>
                            <div><strong>Type:</strong> ${payment.type}</div>
                            <div><strong>Date:</strong> ${formatDate(payment.date)}</div>
                            ${payment.reference ? `<div><strong>Reference:</strong> ${payment.reference}</div>` : '<div></div>'}
                            ${payment.notes ? `<div class="payment-history-notes"><strong>Notes:</strong> ${payment.notes}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
                
                <div class="payment-actions">
                    <button onclick="closePaymentDialog()" class="payment-close-button">Close</button>
                </div>
            </div>
        </div>
    `;

    closePaymentDialog();
    document.body.insertAdjacentHTML('beforeend', historyHTML);
}

function showCreditHistory(billId) {
    const credit = bills.find(b => b.id === billId);
    if (!credit || !credit.isCredit) {
        alert('Credit not found.');
        return;
    }

    const totalCreditAmount = Math.abs(credit.amount);
    const usedAmount = credit.amountUsed || 0;
    const availableAmount = totalCreditAmount - usedAmount;
    const appliedTo = credit.appliedTo || [];

    let usageHistoryHTML = '';
    if (appliedTo.length > 0) {
        usageHistoryHTML = `
            <h4>Credit Usage History:</h4>
            ${appliedTo.map((application, index) => {
                const targetBill = bills.find(b => b.id === application.billId);
                return `
                    <div class="payment-history-item">
                        <div class="payment-history-grid">
                            <div><strong>Application #${index + 1}</strong></div>
                            <div class="payment-history-amount">$${application.amount.toFixed(2)}</div>
                            <div><strong>Applied To:</strong> Bill #${application.billInvoiceNumber || application.billId}</div>
                            <div><strong>Date:</strong> ${formatDate(application.date)}</div>
                            ${targetBill ? `<div><strong>Vendor:</strong> ${targetBill.vendorName}</div>` : '<div></div>'}
                            ${targetBill ? `<div><strong>Description:</strong> ${targetBill.description}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    } else {
        usageHistoryHTML = '<p class="text-muted">This credit has not been used yet.</p>';
    }

    const historyHTML = `
        <div id="payment-dialog" class="payment-dialog">
            <div class="payment-dialog-content">
                <h3 class="payment-dialog-header">Credit History</h3>
                
                <div class="payment-info-box">
                    <div><strong>Vendor:</strong> ${credit.vendorName}</div>
                    <div><strong>Invoice #:</strong> ${credit.invoiceNumber || credit.id}</div>
                    <div><strong>Description:</strong> ${credit.description}</div>
                    <div><strong>Credit Date:</strong> ${formatDate(credit.billDate)}</div>
                    <div><strong>Total Credit Amount:</strong> $${totalCreditAmount.toFixed(2)}</div>
                    <div class="text-warning"><strong>Amount Used:</strong> $${usedAmount.toFixed(2)}</div>
                    <div class="text-success"><strong>Amount Available:</strong> $${availableAmount.toFixed(2)}</div>
                </div>
                
                ${usageHistoryHTML}
                
                <div class="payment-actions">
                    <button onclick="closePaymentDialog()" class="payment-close-button">Close</button>
                </div>
            </div>
        </div>
    `;

    closePaymentDialog();
    document.body.insertAdjacentHTML('beforeend', historyHTML);
}

function showCreditHistory(billId) {
    const credit = bills.find(b => b.id === billId);
    if (!credit || !credit.isCredit) {
        alert('Credit not found.');
        return;
    }

    const totalCreditAmount = Math.abs(credit.amount);
    const usedAmount = credit.amountUsed || 0;
    const availableAmount = totalCreditAmount - usedAmount;
    const appliedTo = credit.appliedTo || [];

    let usageHistoryHTML = '';
    if (appliedTo.length > 0) {
        usageHistoryHTML = `
            <h4>Credit Usage History:</h4>
            ${appliedTo.map((application, index) => {
                const targetBill = bills.find(b => b.id === application.billId);
                return `
                    <div class="payment-history-item">
                        <div class="payment-history-grid">
                            <div><strong>Application #${index + 1}</strong></div>
                            <div class="payment-history-amount">$${application.amount.toFixed(2)}</div>
                            <div><strong>Applied To:</strong> Bill #${application.billInvoiceNumber || application.billId}</div>
                            <div><strong>Date:</strong> ${formatDate(application.date)}</div>
                            ${targetBill ? `<div><strong>Vendor:</strong> ${targetBill.vendorName}</div>` : '<div></div>'}
                            ${targetBill ? `<div><strong>Description:</strong> ${targetBill.description}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    } else {
        usageHistoryHTML = '<p class="text-muted">This credit has not been used yet.</p>';
    }

    const historyHTML = `
        <div id="payment-dialog" class="payment-dialog">
            <div class="payment-dialog-content">
                <h3 class="payment-dialog-header">Credit History</h3>
                
                <div class="payment-info-box">
                    <div><strong>Vendor:</strong> ${credit.vendorName}</div>
                    <div><strong>Invoice #:</strong> ${credit.invoiceNumber || credit.id}</div>
                    <div><strong>Description:</strong> ${credit.description}</div>
                    <div><strong>Credit Date:</strong> ${formatDate(credit.billDate)}</div>
                    <div><strong>Total Credit Amount:</strong> $${totalCreditAmount.toFixed(2)}</div>
                    <div class="text-warning"><strong>Amount Used:</strong> $${usedAmount.toFixed(2)}</div>
                    <div class="text-success"><strong>Amount Available:</strong> $${availableAmount.toFixed(2)}</div>
                </div>
                
                ${usageHistoryHTML}
                
                <div class="payment-actions">
                    <button onclick="closePaymentDialog()" class="payment-close-button">Close</button>
                </div>
            </div>
        </div>
    `;

    closePaymentDialog();
    document.body.insertAdjacentHTML('beforeend', historyHTML);
}

function closePaymentDialog() {
    const dialog = document.getElementById('payment-dialog');
    if (dialog) dialog.remove();
}

// === ATTACHMENT SYSTEM ===

function showAttachmentDialog(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) {
        alert('Bill not found!');
        return;
    }

    const dialogHTML = `
        <div id="attachment-dialog" class="attachment-dialog">
            <div class="attachment-dialog-content">
                <h3>Manage Attachments - ${bill.description}</h3>
                <p><strong>Vendor:</strong> ${bill.vendorName}</p>
                <p><strong>Amount:</strong> $${bill.amount.toFixed(2)}</p>
                
                <div class="attachment-current-section">
                    <h4>Current Attachments:</h4>
                    <div id="current-attachments">
                        ${renderAttachments(billId, bill)}
                    </div>
                </div>
                
                <div class="attachment-upload-section">
                    <h4>Add New Attachment:</h4>
                    <input type="file" id="attachment-file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls" class="attachment-file-input">
                    <button onclick="addAttachment(${billId})" class="button button-success">Upload Attachment</button>
                </div>
                
                <div class="attachment-actions">
                    <button onclick="closeAttachmentDialog()" class="button button-primary">Close</button>
                </div>
            </div>
        </div>
    `;

    closeAttachmentDialog();
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
}

function renderAttachments(billId, bill) {
    let html = '';

    if (bill.attachment) {
        html += `
            <div class="attachment-item-box">
                <span>${bill.attachment.name}</span>
                <span class="attachment-size-text">(${bill.attachment.size})</span>
                <button onclick="removeOriginalAttachment(${billId})" class="attachment-remove-button">Remove</button>
            </div>
        `;
    }

    const additionalAttachments = billAttachments[billId] || [];
    additionalAttachments.forEach((attachment, index) => {
        html += `
            <div class="attachment-item-box">
                <span>${attachment.name}</span>
                <span class="attachment-size-text">(${attachment.size})</span>
                <button onclick="removeAttachment(${billId}, ${index})" class="attachment-remove-button">Remove</button>
            </div>
        `;
    });

    if (html === '') {
        html = '<p class="text-muted">No attachments</p>';
    }

    return html;
}

function addAttachment(billId) {
    const fileInput = document.getElementById('attachment-file-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to attach.');
        return;
    }

    const attachment = {
        name: file.name,
        size: formatFileSize(file.size),
        dateAdded: new Date().toISOString(),
        type: file.type || 'unknown'
    };

    if (!billAttachments[billId]) {
        billAttachments[billId] = [];
    }
    billAttachments[billId].push(attachment);

    localStorage.setItem('bill_attachments', JSON.stringify(billAttachments));

    showAttachmentDialog(billId);
    displayBills();

    alert(`Attachment "${attachment.name}" added successfully!`);
}

function removeAttachment(billId, attachmentIndex) {
    if (!confirm('Are you sure you want to remove this attachment?')) return;

    if (billAttachments[billId]) {
        billAttachments[billId].splice(attachmentIndex, 1);
        
        if (billAttachments[billId].length === 0) {
            delete billAttachments[billId];
        }
        
        localStorage.setItem('bill_attachments', JSON.stringify(billAttachments));
        showAttachmentDialog(billId);
        displayBills();
    }
}

function removeOriginalAttachment(billId) {
    if (!confirm('Are you sure you want to remove this attachment?')) return;

    const bill = bills.find(b => b.id === billId);
    if (bill) {
        bill.attachment = null;
        erpStorage.setBills(bills);
        showAttachmentDialog(billId);
        displayBills();
    }
}

function closeAttachmentDialog() {
    const dialog = document.getElementById('attachment-dialog');
    if (dialog) dialog.remove();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show add bill form
function showAddBillForm() {
    const modal = document.getElementById('add-bill-form');
    modal.style.display = 'flex';
    populateVendors();
    populateBillProducts();
    
    // Clear bill date
    const billDateField = document.getElementById('billDate');
    if (billDateField) {
        billDateField.value = '';
    }
    
    // Clear due date
    const dueDateField = document.getElementById('billDueDate');
    if (dueDateField) {
        dueDateField.value = '';
    }
    
    // Add click outside to close
    modal.onclick = function(event) {
        if (event.target === modal) {
            hideAddBillForm();
        }
    };
    
    // Add ESC key to close
    document.addEventListener('keydown', billModalEscapeHandler);
    
    // Setup event listeners for initial item
    setTimeout(() => {
        setupBillItemListeners();
        updateBillTotal();
    }, 100);
}

// ESC key handler for bill modal
function billModalEscapeHandler(event) {
    if (event.key === 'Escape') {
        hideAddBillForm();
    }
}

// Populate products in bill items
function populateBillProducts() {
    const products = erpStorage.getProducts() || [];
    const selects = document.querySelectorAll('.item-product');
    
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select product...</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Stock: ${product.stock})`;
            select.appendChild(option);
        });
        if (currentValue) select.value = currentValue;
    });
}

// Add bill item
function addBillItem() {
    const itemsContainer = document.getElementById('bill-items');
    const newItem = document.createElement('div');
    newItem.className = 'bill-item';
    newItem.innerHTML = `
        <select class="item-category">
            <option value="">Category...</option>
            <option value="Equipment">Equipment</option>
            <option value="Insurance">Insurance</option>
            <option value="Inventory">Inventory</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Marketing">Marketing</option>
            <option value="Other">Other</option>
            <option value="Professional Fees">Professional Fees</option>
            <option value="Rent">Rent</option>
            <option value="Services">Services</option>
            <option value="Subscriptions">Subscriptions</option>
            <option value="Supplies">Supplies</option>
            <option value="Travel">Travel</option>
            <option value="Utilities">Utilities</option>
        </select>
        <select class="item-product hidden">
            <option value="">Select product...</option>
        </select>
        <input type="text" class="item-description" placeholder="Description">
        <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1">
        <input type="number" class="item-cost" placeholder="Cost" step="0.01">
        <button type="button" onclick="removeBillItem(this)" class="remove-button">Remove</button>
    `;
    itemsContainer.appendChild(newItem);
    
    // Populate products for new item
    const products = erpStorage.getProducts() || [];
    const newSelect = newItem.querySelector('.item-product');
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (Stock: ${product.stock})`;
        newSelect.appendChild(option);
    });
    
    // Add event listeners
    setupBillItemListeners(newItem);
    updateBillTotal();
}

// Remove bill item
function removeBillItem(button) {
    const itemsContainer = document.getElementById('bill-items');
    const items = itemsContainer.querySelectorAll('.bill-item');
    if (items.length > 1) {
        button.parentElement.remove();
        updateBillTotal();
    } else {
        alert('At least one item is required.');
    }
}

// Setup event listeners for bill items
function setupBillItemListeners(container = null) {
    const items = container ? [container] : document.querySelectorAll('.bill-item');
    
    items.forEach(item => {
        const categorySelect = item.querySelector('.item-category');
        const productSelect = item.querySelector('.item-product');
        const inputs = item.querySelectorAll('input');
        
        // Category change handler
        if (categorySelect) {
            categorySelect.removeEventListener('change', handleCategoryChange);
            categorySelect.addEventListener('change', handleCategoryChange);
        }
        
        // Update total on input changes
        inputs.forEach(input => {
            input.removeEventListener('change', updateBillTotal);
            input.removeEventListener('input', updateBillTotal);
            input.addEventListener('change', updateBillTotal);
            input.addEventListener('input', updateBillTotal);
        });
        
        if (productSelect) {
            productSelect.removeEventListener('change', updateBillTotal);
            productSelect.addEventListener('change', updateBillTotal);
        }
    });
}

// Handle category change for bill items
function handleCategoryChange(event) {
    const item = event.target.closest('.bill-item');
    const productSelect = item.querySelector('.item-product');
    const descriptionInput = item.querySelector('.item-description');
    
    if (event.target.value === 'Inventory') {
        productSelect.classList.remove('hidden');
        descriptionInput.classList.add('hidden');
        descriptionInput.required = false;
    } else {
        productSelect.classList.add('hidden');
        descriptionInput.classList.remove('hidden');
        descriptionInput.required = true;
        productSelect.value = '';
    }
}

// Update bill total
function updateBillTotal() {
    let total = 0;
    const items = document.querySelectorAll('.bill-item');
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity')?.value) || 0;
        const cost = parseFloat(item.querySelector('.item-cost')?.value) || 0;
        total += quantity * cost;
    });
    
    const totalEl = document.getElementById('bill-total');
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

// Hide add bill form
function hideAddBillForm() {
    document.getElementById('add-bill-form').style.display = 'none';
    const form = document.getElementById('add-bill-form').querySelector('form');
    form.reset();
    
    // Remove ESC key listener
    document.removeEventListener('keydown', billModalEscapeHandler);
    
    // Reset submit button text
    const submitButton = document.getElementById('billSubmitButton');
    if (submitButton) {
        submitButton.textContent = 'Add Bill';
    }
    
    // Reset payment fields visibility
    const paymentFields = document.getElementById('bill-payment-fields');
    if (paymentFields) paymentFields.style.display = 'none';
    const checkbox = document.getElementById('billAlreadyPaid');
    if (checkbox) checkbox.checked = false;
    
    // Reset to single item
    const itemsContainer = document.getElementById('bill-items');
    const items = itemsContainer.querySelectorAll('.bill-item');
    for (let i = 1; i < items.length; i++) {
        items[i].remove();
    }
    
    // Reset first item
    if (items[0]) {
        items[0].querySelector('.item-category').value = '';
        items[0].querySelector('.item-product').classList.add('hidden');
        items[0].querySelector('.item-description').classList.remove('hidden');
        items[0].querySelector('.item-description').value = '';
        items[0].querySelector('.item-quantity').value = '1';
        items[0].querySelector('.item-cost').value = '';
    }
    
    updateBillTotal();
}

// Toggle payment fields visibility
function togglePaymentFields() {
    const checkbox = document.getElementById('billAlreadyPaid');
    const paymentFields = document.getElementById('bill-payment-fields');
    const paymentDateField = document.getElementById('billPaymentDate');
    
    if (checkbox && paymentFields) {
        if (checkbox.checked) {
            paymentFields.style.display = 'block';
            // Set default payment date to today
            if (paymentDateField && !paymentDateField.value) {
                paymentDateField.value = new Date().toISOString().split('T')[0];
            }
        } else {
            paymentFields.style.display = 'none';
        }
    }
}

// Populate vendors dropdown
function populateVendors() {
    const select = document.getElementById('billVendor');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a vendor...</option>';
    
    vendors.forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor.id;
        option.textContent = vendor.name;
        select.appendChild(option);
    });
}

// Add new bill
function addBill(event) {
    event.preventDefault();
    
    const vendorId = parseInt(document.getElementById('billVendor').value);
    const vendor = vendors.find(v => v.id === vendorId);
    const invoiceNumber = document.getElementById('billInvoiceNumber')?.value || '';
    const billDate = document.getElementById('billDate')?.value || new Date().toISOString().split('T')[0];
    const dueDate = document.getElementById('billDueDate').value;
    
    if (!vendor) {
        alert('Please select a vendor.');
        return;
    }
    
    // Get all items
    const itemElements = document.querySelectorAll('.bill-item');
    const items = [];
    let total = 0;
    
    itemElements.forEach(itemEl => {
        const category = itemEl.querySelector('.item-category').value;
        const productId = parseInt(itemEl.querySelector('.item-product').value);
        const itemDescription = itemEl.querySelector('.item-description').value;
        const quantity = parseInt(itemEl.querySelector('.item-quantity').value);
        const cost = parseFloat(itemEl.querySelector('.item-cost').value);
        
        if (category && quantity && cost) {
            const item = {
                category: category,
                description: itemDescription,
                quantity: quantity,
                cost: cost,
                total: quantity * cost
            };
            
            // If inventory item, add product info
            if (category === 'Inventory' && productId) {
                const products = erpStorage.getProducts() || [];
                const product = products.find(p => p.id === productId);
                if (product) {
                    item.productId = productId;
                    item.productName = product.name;
                    item.description = product.name;
                }
            }
            
            items.push(item);
            total += item.total;
        }
    });
    
    if (items.length === 0) {
        alert('Please add at least one item with category, quantity, and cost.');
        return;
    }
    
    if (!dueDate) {
        alert('Please select a due date.');
        return;
    }
    
    // Generate description from items
    const description = items.map(item => item.description || item.category).join(', ');
    
    // Check if this is a vendor credit
    const isCredit = document.getElementById('billIsCredit')?.checked || false;
    if (isCredit) {
        total = -Math.abs(total); // Make sure it's negative
    }
    
    // Check if bill is already paid
    const alreadyPaid = document.getElementById('billAlreadyPaid')?.checked || false;
    
    const newBill = {
        vendorId: vendorId,
        vendorName: vendor.name,
        invoiceNumber: invoiceNumber,
        description: description,
        items: items,
        amount: total,
        billDate: billDate,
        dueDate: dueDate,
        dateCreated: new Date().toISOString().split('T')[0],
        status: isCredit ? 'Credit' : 'Unpaid',
        isCredit: isCredit,
        payments: [],
        creditsApplied: [] // Track which credits have been applied to this bill
    };
    
    // Handle file attachment if present
    const fileInput = document.getElementById('billAttachment');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        newBill.attachment = {
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type
        };
    }
    
    // Handle payment information if already paid
    if (alreadyPaid) {
        const paymentType = document.getElementById('billPaymentType')?.value;
        const paymentDate = document.getElementById('billPaymentDate')?.value;
        const paymentReference = document.getElementById('billPaymentReference')?.value || '';
        const paymentNotes = document.getElementById('billPaymentNotes')?.value || '';
        
        if (!paymentType || !paymentDate) {
            alert('Please fill in payment type and payment date.');
            return;
        }
        
        // Add payment record
        newBill.payments.push({
            id: Date.now(),
            type: paymentType,
            date: paymentDate,
            amount: total,
            reference: paymentReference,
            notes: paymentNotes,
            recordedDate: new Date().toISOString()
        });
        
        // Mark as paid
        newBill.status = 'Paid';
        newBill.paymentDate = paymentDate;
        newBill.paymentType = paymentType;
        newBill.paymentReference = paymentReference;
    }
    
    const savedBill = erpStorage.addBill(newBill);
    
    if (savedBill) {
        bills.push(savedBill);
        
        const statusMsg = alreadyPaid ? 'Bill added and marked as paid!' : 'Bill added successfully!';
        alert(statusMsg);
        hideAddBillForm();
        displayBills();
    } else {
        alert('Error adding bill.');
    }
}

// Edit bill
function editBill(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) {
        alert('Bill not found!');
        return;
    }
    
    // Show form with current values
    document.getElementById('add-bill-form').style.display = 'block';
    populateVendors();
    
    setTimeout(() => {
        document.getElementById('billVendor').value = bill.vendorId;
        
        if (document.getElementById('billInvoiceNumber')) {
            document.getElementById('billInvoiceNumber').value = bill.invoiceNumber || '';
        }
        
        if (document.getElementById('billDate')) {
            document.getElementById('billDate').value = bill.billDate || bill.dateCreated;
        }
        
        document.getElementById('billDueDate').value = bill.dueDate;
        
        // Clear existing items but keep the container structure
        const itemsContainer = document.getElementById('bill-items');
        const existingItems = itemsContainer.querySelectorAll('.bill-item');
        existingItems.forEach(item => item.remove());
        
        // Get products for dropdown
        const products = erpStorage.getProducts() || [];
        
        // Add bill items if they exist
        if (bill.items && bill.items.length > 0) {
            bill.items.forEach((item, index) => {
                // Create new item element
                const newItemDiv = document.createElement('div');
                newItemDiv.className = 'bill-item';
                newItemDiv.innerHTML = `
                    <select class="item-category">
                        <option value="">Category...</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Inventory">Inventory</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Other">Other</option>
                        <option value="Professional Fees">Professional Fees</option>
                        <option value="Rent">Rent</option>
                        <option value="Services">Services</option>
                        <option value="Subscriptions">Subscriptions</option>
                        <option value="Supplies">Supplies</option>
                        <option value="Travel">Travel</option>
                        <option value="Utilities">Utilities</option>
                    </select>
                    <select class="item-product hidden">
                        <option value="">Select product...</option>
                    </select>
                    <input type="text" class="item-description" placeholder="Description">
                    <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1">
                    <input type="number" class="item-cost" placeholder="Cost" step="0.01">
                    <button type="button" onclick="removeBillItem(this)" class="remove-button">Remove</button>
                `;
                itemsContainer.appendChild(newItemDiv);
                
                // Populate product dropdown
                const productSelect = newItemDiv.querySelector('.item-product');
                products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.name} (Stock: ${product.stock})`;
                    productSelect.appendChild(option);
                });
                
                // Set values
                newItemDiv.querySelector('.item-category').value = item.category || '';
                newItemDiv.querySelector('.item-description').value = item.description || '';
                newItemDiv.querySelector('.item-quantity').value = item.quantity || 1;
                newItemDiv.querySelector('.item-cost').value = item.cost || 0;
                
                if (item.productId) {
                    productSelect.value = item.productId;
                }
                
                // Show/hide product dropdown based on category
                if (item.category === 'Inventory') {
                    productSelect.classList.remove('hidden');
                }
                
                // Add event listeners
                setupBillItemListeners(newItemDiv);
            });
        } else {
            // If no items exist (old bill format), create one empty item
            const newItemDiv = document.createElement('div');
            newItemDiv.className = 'bill-item';
            newItemDiv.innerHTML = `
                <select class="item-category">
                    <option value="">Category...</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                    <option value="Professional Fees">Professional Fees</option>
                    <option value="Rent">Rent</option>
                    <option value="Services">Services</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Travel">Travel</option>
                    <option value="Utilities">Utilities</option>
                </select>
                <select class="item-product hidden">
                    <option value="">Select product...</option>
                </select>
                <input type="text" class="item-description" placeholder="Description">
                <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1">
                <input type="number" class="item-cost" placeholder="Cost" step="0.01">
                <button type="button" onclick="removeBillItem(this)" class="remove-button">Remove</button>
            `;
            itemsContainer.appendChild(newItemDiv);
            
            // Populate product dropdown
            const productSelect = newItemDiv.querySelector('.item-product');
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (Stock: ${product.stock})`;
                productSelect.appendChild(option);
            });
            
            // Set description and amount from old format
            newItemDiv.querySelector('.item-description').value = bill.description || '';
            newItemDiv.querySelector('.item-cost').value = bill.amount || 0;
            
            setupBillItemListeners(newItemDiv);
        }
        
        // Update totals
        updateBillTotal();
        
        // Change form submit to update instead of create
        const form = document.getElementById('add-bill-form').querySelector('form');
        form.onsubmit = function(event) {
            event.preventDefault();
            updateBill(billId);
        };
        
        // Change header text
        const formHeader = document.getElementById('add-bill-form').querySelector('h3');
        if (formHeader) {
            formHeader.textContent = 'Edit Bill';
        }
        
        // Change submit button text
        const submitButton = document.getElementById('billSubmitButton');
        if (submitButton) {
            submitButton.textContent = 'Update Bill';
        }
    }, 100);
}

// Update bill
function updateBill(billId) {
    const vendorId = parseInt(document.getElementById('billVendor').value);
    const vendor = vendors.find(v => v.id === vendorId);
    const invoiceNumber = document.getElementById('billInvoiceNumber')?.value || '';
    const billDate = document.getElementById('billDate')?.value || new Date().toISOString().split('T')[0];
    const dueDate = document.getElementById('billDueDate').value;
    
    if (!vendor) {
        alert('Please select a vendor.');
        return;
    }
    
    // Get all items
    const itemElements = document.querySelectorAll('.bill-item');
    const items = [];
    let total = 0;
    
    itemElements.forEach(itemEl => {
        const category = itemEl.querySelector('.item-category').value;
        const productId = parseInt(itemEl.querySelector('.item-product').value);
        const itemDescription = itemEl.querySelector('.item-description').value;
        const quantity = parseInt(itemEl.querySelector('.item-quantity').value);
        const cost = parseFloat(itemEl.querySelector('.item-cost').value);
        
        if (category && quantity && cost) {
            const item = {
                category: category,
                description: itemDescription,
                quantity: quantity,
                cost: cost,
                total: quantity * cost
            };
            
            // If inventory item, add product info
            if (category === 'Inventory' && productId) {
                const products = erpStorage.getProducts() || [];
                const product = products.find(p => p.id === productId);
                if (product) {
                    item.productId = productId;
                    item.productName = product.name;
                    item.description = product.name;
                }
            }
            
            items.push(item);
            total += item.total;
        }
    });
    
    if (items.length === 0) {
        alert('Please add at least one item with category, quantity, and cost.');
        return;
    }
    
    if (!dueDate) {
        alert('Please select a due date.');
        return;
    }
    
    // Generate description from items
    const description = items.map(item => item.description || item.category).join(', ');
    
    const updatedData = {
        vendorId: vendorId,
        vendorName: vendor.name,
        invoiceNumber: invoiceNumber,
        description: description,
        items: items,
        amount: total,
        billDate: billDate,
        dueDate: dueDate
    };
    
    if (erpStorage.updateBill(billId, updatedData)) {
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            Object.assign(bill, updatedData);
        }
        
        alert('Bill updated successfully!');
        
        // Reset form to create mode
        const form = document.getElementById('add-bill-form').querySelector('form');
        form.onsubmit = addBill;
        
        const formHeader = document.getElementById('add-bill-form').querySelector('h3');
        if (formHeader) {
            formHeader.textContent = 'Add New Bill';
        }
        
        const submitButton = document.getElementById('billSubmitButton');
        if (submitButton) {
            submitButton.textContent = 'Add Bill';
        }
        
        hideAddBillForm();
        
        displayBills();
    } else {
        alert('Error updating bill.');
    }
}

// View bill details
function viewBill(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) {
        alert('Bill not found!');
        return;
    }
    
    let message = `Bill Details:\n\n`;
    message += `Vendor: ${bill.vendorName}\n`;
    message += `Description: ${bill.description}\n`;
    message += `Amount: $${bill.amount.toFixed(2)}\n`;
    message += `Bill Date: ${formatDate(bill.billDate || bill.dateCreated)}\n`;
    message += `Due Date: ${formatDate(bill.dueDate)}\n`;
    message += `Status: ${bill.status}\n`;
    
    if (bill.payments && bill.payments.length > 0) {
        message += `\nPayments:\n`;
        bill.payments.forEach((payment, index) => {
            message += `  ${index + 1}. $${payment.amount.toFixed(2)} - ${payment.type} on ${formatDate(payment.date)}\n`;
        });
    }
    
    alert(message);
}

// Delete bill
function deleteBill(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) {
        alert('Bill not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete Bill #${bill.id} from ${bill.vendorName}?\n\nAmount: $${bill.amount.toFixed(2)}\nThis action cannot be undone.`)) {
        if (erpStorage.deleteBill(billId)) {
            bills = bills.filter(b => b.id !== billId);
            displayBills();
            alert('Bill deleted successfully!');
        }
    }
}

// Make functions globally available
window.loadBills = loadData;
window.displayBills = displayBills;
// filterBills is exported later after pagination setup
window.sortBillsByDateCreated = sortBillsByDateCreated;
window.sortBillsByDueDate = sortBillsByDueDate;
window.showPaymentDialog = showPaymentDialog;
window.showPaymentHistory = showPaymentHistory;
window.showCreditHistory = showCreditHistory;
window.closePaymentDialog = closePaymentDialog;
window.showAttachmentDialog = showAttachmentDialog;
window.addAttachment = addAttachment;
window.removeAttachment = removeAttachment;
window.removeOriginalAttachment = removeOriginalAttachment;
window.closeAttachmentDialog = closeAttachmentDialog;
window.showAddBillForm = showAddBillForm;
window.hideAddBillForm = hideAddBillForm;
window.addBill = addBill;
window.editBill = editBill;
window.viewBill = viewBill;
window.deleteBill = deleteBill;
window.exportBillsToCSV = exportBillsToCSV;
window.exportBillsToJSON = exportBillsToJSON;

// Search and Filter Functions
let currentBillSearchTerm = '';
let currentBillStatusFilter = 'all';
let currentBillPage = 1;
let billPageSize = 50;

function searchBills() {
    const searchInput = document.getElementById('billSearchInput');
    const clearButton = document.getElementById('billSearchClear');
    currentBillSearchTerm = searchInput.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (currentBillSearchTerm.length > 0) {
        clearButton.classList.add('visible');
    } else {
        clearButton.classList.remove('visible');
    }
    
    currentBillPage = 1; // Reset to first page on new search
    applyBillFilters();
}

function clearBillSearch() {
    const searchInput = document.getElementById('billSearchInput');
    const clearButton = document.getElementById('billSearchClear');
    searchInput.value = '';
    currentBillSearchTerm = '';
    clearButton.classList.remove('visible');
    currentBillPage = 1;
    applyBillFilters();
}

function applyBillFilters() {
    const tbody = document.getElementById('bills-tbody');
    tbody.innerHTML = '';
    
    loadData();
    
    let filteredBills = bills;
    
    // Apply status filter
    if (currentBillStatusFilter !== 'all') {
        filteredBills = filteredBills.filter(bill => {
            if (currentBillStatusFilter === 'overdue') {
                return bill.status === 'Overdue';
            }
            return bill.status && bill.status.toLowerCase() === currentBillStatusFilter;
        });
    }
    
    // Apply search filter
    if (currentBillSearchTerm) {
        filteredBills = filteredBills.filter(bill => {
            const vendor = vendors.find(v => v.id === bill.vendorId);
            const vendorName = vendor ? vendor.name.toLowerCase() : '';
            const invoiceNumber = bill.invoiceNumber ? bill.invoiceNumber.toLowerCase() : '';
            const total = bill.total ? bill.total.toString() : '';
            const status = bill.status ? bill.status.toLowerCase() : '';
            
            return vendorName.includes(currentBillSearchTerm) ||
                   invoiceNumber.includes(currentBillSearchTerm) ||
                   total.includes(currentBillSearchTerm) ||
                   status.includes(currentBillSearchTerm);
        });
    }
    
    // Calculate pagination
    const totalBills = filteredBills.length;
    const totalPages = billPageSize === 'all' ? 1 : Math.ceil(totalBills / billPageSize);
    
    // Ensure current page is valid
    if (currentBillPage > totalPages && totalPages > 0) {
        currentBillPage = totalPages;
    }
    if (currentBillPage < 1) {
        currentBillPage = 1;
    }
    
    // Get bills for current page
    let paginatedBills = filteredBills;
    let startIndex = 0;
    let endIndex = totalBills;
    
    if (billPageSize !== 'all') {
        startIndex = (currentBillPage - 1) * billPageSize;
        endIndex = Math.min(startIndex + billPageSize, totalBills);
        paginatedBills = filteredBills.slice(startIndex, endIndex);
    }
    
    paginatedBills.forEach(bill => {
        if (!bill || !bill.status) {
            console.warn('Skipping bill with missing data:', bill);
            return;
        }
        
        const row = document.createElement('tr');
        
        if (bill.status === 'Overdue') {
            row.className = 'table-status-overdue';
        } else if (bill.status === 'Paid') {
            row.className = 'table-status-paid';
        }
        
        const attachmentDisplay = bill.attachment ? 
            `<a href="#" onclick="return false;" class="attachment-link">${bill.attachment.name}</a>` : 
            'No';
        
        const paidDateDisplay = bill.status === 'Paid' && bill.paymentDate ? formatDate(bill.paymentDate) : '';
        
        // Get categories from items or show N/A
        let categoryDisplay = 'N/A';
        if (bill.items && bill.items.length > 0) {
            const categories = [...new Set(bill.items.map(item => item.category).filter(cat => cat))];
            categoryDisplay = categories.length > 0 ? categories.join(', ') : 'N/A';
        }
        
        // Safely handle amount display
        const billAmount = parseFloat(bill.amount) || 0;
        let amountDisplay;
        if (bill.isCredit) {
            const totalCreditAmount = Math.abs(billAmount);
            const usedAmount = bill.amountUsed || 0;
            const availableAmount = totalCreditAmount - usedAmount;
            amountDisplay = `<span style="color: #5cb85c;">($${availableAmount.toFixed(2)})</span>`;
        } else {
            amountDisplay = `$${billAmount.toFixed(2)}`;
        }
        
        row.innerHTML = `
            <td>${bill.vendorName || 'Unknown'}</td>
            <td>${bill.invoiceNumber || 'N/A'}</td>
            <td>${categoryDisplay}</td>
            <td>${bill.description || 'N/A'}</td>
            <td>${amountDisplay}</td>
            <td>${formatDate(bill.billDate || bill.dateCreated)}</td>
            <td>${formatDate(bill.dueDate)}</td>
            <td class="${getStatusClass(bill.status)}">${bill.status}</td>
            <td>${paidDateDisplay}</td>
            <td>${attachmentDisplay}</td>
            <td>
                ${getBillActionButtons(bill)}
                <button class="button button-info button-small" onclick="showAttachmentDialog(${bill.id})">Attach</button>
                <button class="button button-warning button-small" onclick="editBill(${bill.id})">Edit</button>
                <button class="button button-danger button-small" onclick="deleteBill(${bill.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination info
    updateBillPaginationInfo(startIndex + 1, endIndex, totalBills, currentBillPage, totalPages);
    
    updateBillsSummary();
}

function updateBillPaginationInfo(start, end, total, currentPage, totalPages) {
    document.getElementById('bill-start').textContent = total === 0 ? 0 : start;
    document.getElementById('bill-end').textContent = end;
    document.getElementById('bill-total').textContent = total;
    document.getElementById('bill-page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Enable/disable pagination buttons
    const prevBtn = document.getElementById('bill-prev-btn');
    const nextBtn = document.getElementById('bill-next-btn');
    
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
}

function changeBillPageSize() {
    const select = document.getElementById('billPageSize');
    billPageSize = select.value === 'all' ? 'all' : parseInt(select.value);
    currentBillPage = 1;
    applyBillFilters();
}

function previousBillPage() {
    if (currentBillPage > 1) {
        currentBillPage--;
        applyBillFilters();
    }
}

function nextBillPage() {
    const totalBills = bills.length; // This should be filtered bills count
    const totalPages = billPageSize === 'all' ? 1 : Math.ceil(totalBills / billPageSize);
    if (currentBillPage < totalPages) {
        currentBillPage++;
        applyBillFilters();
    }
}

// Update filterBills to work with search and pagination
window.filterBills = function(filter) {
    currentBillStatusFilter = filter;
    currentBillPage = 1; // Reset to first page when changing filter
    applyBillFilters();
};

window.searchBills = searchBills;
window.clearBillSearch = clearBillSearch;
window.changeBillPageSize = changeBillPageSize;
window.previousBillPage = previousBillPage;
window.nextBillPage = nextBillPage;

// Export functions
function exportBillsToCSV() {
    const formattedData = ExportUtility.formatBillsForExport(bills, vendors);
    const filename = `bills_${ExportUtility.getDateForFilename()}.csv`;
    ExportUtility.exportToCSV(formattedData, filename);
}

function exportBillsToJSON() {
    const filename = `bills_${ExportUtility.getDateForFilename()}.json`;
    ExportUtility.exportToJSON(bills, filename);
}

// Toggle credit field visibility
function toggleCreditField() {
    const isCredit = document.getElementById('billIsCredit')?.checked || false;
    const totalDisplay = document.getElementById('bill-total');
    
    if (totalDisplay && isCredit) {
        // Update the display to show as negative
        const currentTotal = parseFloat(totalDisplay.textContent) || 0;
        totalDisplay.textContent = Math.abs(currentTotal).toFixed(2);
        totalDisplay.parentElement.innerHTML = `Credit Amount: $<span id="bill-total">${Math.abs(currentTotal).toFixed(2)}</span>`;
    } else if (totalDisplay && !isCredit) {
        const currentTotal = parseFloat(totalDisplay.textContent) || 0;
        totalDisplay.parentElement.innerHTML = `Total: $<span id="bill-total">${Math.abs(currentTotal).toFixed(2)}</span>`;
    }
}

// Get available credits for a vendor
function getAvailableCreditsForVendor(vendorId) {
    return bills.filter(bill => {
        if (bill.vendorId !== vendorId || !bill.isCredit || bill.amount >= 0) {
            return false;
        }
        
        // Check if credit is still available (not fully used)
        if (bill.status === 'Credit') {
            // Calculate remaining credit amount
            const totalCreditAmount = Math.abs(bill.amount);
            const usedAmount = bill.amountUsed || 0;
            const remainingAmount = totalCreditAmount - usedAmount;
            return remainingAmount > 0;
        }
        
        return false;
    });
}

// Show credit application dialog
function showApplyCreditDialog(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill || bill.status === 'Paid') {
        alert('Cannot apply credits to this bill.');
        return;
    }
    
    const availableCredits = getAvailableCreditsForVendor(bill.vendorId);
    
    if (availableCredits.length === 0) {
        alert('No available credits for this vendor.');
        return;
    }
    
    const remainingAmount = bill.amount - (bill.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);

    let creditsHTML = availableCredits.map(credit => {
        const totalCreditAmount = Math.abs(credit.amount);
        const usedAmount = credit.amountUsed || 0;
        const availableCreditAmount = totalCreditAmount - usedAmount;
        
        return `
            <div class="credit-option">
                <label>
                    <input type="checkbox" class="credit-checkbox" data-credit-id="${credit.id}" data-credit-amount="${availableCreditAmount}" data-total-credit="${totalCreditAmount}">
                    Invoice #${credit.invoiceNumber || credit.id} - $${availableCreditAmount.toFixed(2)} available
                    ${usedAmount > 0 ? `($${usedAmount.toFixed(2)} already used of $${totalCreditAmount.toFixed(2)})` : `(Total: $${totalCreditAmount.toFixed(2)})`}
                    <br>(Date: ${formatDate(credit.billDate)})
                    <br><small>${credit.description}</small>
                </label>
            </div>
        `;
    }).join('');    const dialogHTML = `
        <div class="payment-dialog" id="creditApplicationDialog">
            <div class="payment-dialog-content">
                <h3>Apply Vendor Credits</h3>
                <p><strong>Bill:</strong> ${bill.vendorName} - $${bill.amount.toFixed(2)}</p>
                <p><strong>Remaining Amount:</strong> $${remainingAmount.toFixed(2)}</p>
                
                <div class="credits-list">
                    <h4>Available Credits:</h4>
                    ${creditsHTML}
                </div>
                
                <div class="form-row">
                    <label>Total Credit to Apply:</label>
                    <input type="number" id="creditAmountToApply" step="0.01" readonly value="0.00">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="button" onclick="applyCredits(${billId})">Apply Credits</button>
                    <button type="button" class="button cancel-button" onclick="closeApplyCreditDialog()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.credit-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateCreditTotal);
    });
}

// Update credit total when checkboxes change
function updateCreditTotal() {
    let total = 0;
    document.querySelectorAll('.credit-checkbox:checked').forEach(checkbox => {
        total += parseFloat(checkbox.dataset.creditAmount);
    });
    
    const input = document.getElementById('creditAmountToApply');
    if (input) {
        input.value = total.toFixed(2);
    }
}

// Apply selected credits to a bill
function applyCredits(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    
    const selectedCredits = [];
    document.querySelectorAll('.credit-checkbox:checked').forEach(checkbox => {
        const creditId = parseInt(checkbox.dataset.creditId);
        const availableCreditAmount = parseFloat(checkbox.dataset.creditAmount);
        selectedCredits.push({ creditId, availableCreditAmount });
    });
    
    if (selectedCredits.length === 0) {
        alert('Please select at least one credit to apply.');
        return;
    }
    
    // Calculate remaining amount on the bill
    const totalPaidSoFar = bill.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    let remainingBillAmount = bill.amount - totalPaidSoFar;
    
    // Initialize creditsApplied if it doesn't exist
    if (!bill.creditsApplied) {
        bill.creditsApplied = [];
    }
    
    // Initialize payments array if it doesn't exist
    if (!bill.payments) {
        bill.payments = [];
    }
    
    // Add credits as payment records
    selectedCredits.forEach(({ creditId, availableCreditAmount }) => {
        const credit = bills.find(b => b.id === creditId);
        if (credit && remainingBillAmount > 0) {
            // Calculate how much of this credit to actually use
            const amountToUse = Math.min(availableCreditAmount, remainingBillAmount);
            
            // Record credit application on the bill
            bill.creditsApplied.push({
                creditId: creditId,
                creditInvoiceNumber: credit.invoiceNumber,
                amount: amountToUse,
                appliedDate: new Date().toISOString().split('T')[0]
            });
            
            // Add as a payment
            bill.payments.push({
                id: Date.now() + Math.random(),
                type: 'Vendor Credit',
                date: new Date().toISOString().split('T')[0],
                amount: amountToUse,
                reference: `Credit from Invoice #${credit.invoiceNumber || credit.id}`,
                notes: `Applied vendor credit`,
                recordedDate: new Date().toISOString()
            });
            
            // Update credit tracking
            if (!credit.amountUsed) {
                credit.amountUsed = 0;
            }
            credit.amountUsed += amountToUse;
            
            // Calculate remaining credit
            const totalCreditAmount = Math.abs(credit.amount);
            const remainingCredit = totalCreditAmount - credit.amountUsed;
            
            // Update credit status based on remaining amount
            if (remainingCredit <= 0.01) { // Account for floating point precision
                credit.status = 'Applied';
                credit.fullyAppliedDate = new Date().toISOString().split('T')[0];
            } else {
                credit.status = 'Credit'; // Keep as Credit if there's remaining balance
            }
            
            // Track where this credit was applied
            if (!credit.appliedTo) {
                credit.appliedTo = [];
            }
            credit.appliedTo.push({
                billId: billId,
                billInvoiceNumber: bill.invoiceNumber,
                amount: amountToUse,
                date: new Date().toISOString().split('T')[0]
            });
            
            erpStorage.updateBill(credit.id, credit);
            
            // Reduce remaining bill amount for next iteration
            remainingBillAmount -= amountToUse;
        }
    });
    
    // Update bill status
    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= bill.amount) {
        bill.status = 'Paid';
        bill.paymentDate = new Date().toISOString().split('T')[0];
    } else {
        bill.status = `Partial ($${totalPaid.toFixed(2)})`;
    }
    
    erpStorage.updateBill(bill.id, bill);
    
    // Refresh display
    loadData();
    displayBills();
    closeApplyCreditDialog();
    
    alert(`Successfully applied $${totalCreditAmount.toFixed(2)} in credits to this bill.`);
}

// Close credit application dialog
function closeApplyCreditDialog() {
    const dialog = document.getElementById('creditApplicationDialog');
    if (dialog) {
        dialog.remove();
    }
}

window.toggleCreditField = toggleCreditField;
window.handlePaymentTypeChange = handlePaymentTypeChange;
window.showApplyCreditDialog = showApplyCreditDialog;
window.applyCredits = applyCredits;
window.closeApplyCreditDialog = closeApplyCreditDialog;

// Bill Report Functions
function showBillReportDialog() {
    document.getElementById('bill-report-dialog').style.display = 'block';
    
    // Populate vendor filter dropdown
    const vendorFilter = document.getElementById('reportVendorFilter');
    vendorFilter.innerHTML = '<option value="all">All Vendors</option>';
    
    const uniqueVendors = [...new Set(bills.map(bill => bill.vendorName))].sort();
    uniqueVendors.forEach(vendorName => {
        const option = document.createElement('option');
        option.value = vendorName;
        option.textContent = vendorName;
        vendorFilter.appendChild(option);
    });
    
    // Populate category filter dropdown
    const categoryFilter = document.getElementById('reportCategoryFilter');
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    const uniqueCategories = [...new Set(bills.map(bill => bill.category).filter(cat => cat))].sort();
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function hideBillReportDialog() {
    document.getElementById('bill-report-dialog').style.display = 'none';
    document.getElementById('reportSortBy').value = 'billDate';
    document.getElementById('reportSortOrder').value = 'asc';
    document.getElementById('reportStatusFilter').value = 'all';
    document.getElementById('reportVendorFilter').value = 'all';
    document.getElementById('reportCategoryFilter').value = 'all';
    document.getElementById('reportDateRange').value = 'all';
    document.getElementById('customDateRangeBills').style.display = 'none';
    document.getElementById('reportFormat').value = 'csv';
}

function toggleCustomDateRangeBills() {
    const dateRange = document.getElementById('reportDateRange').value;
    const customRange = document.getElementById('customDateRangeBills');
    
    if (dateRange === 'custom') {
        customRange.style.display = 'block';
        document.getElementById('reportStartDate').required = true;
        document.getElementById('reportEndDate').required = true;
    } else {
        customRange.style.display = 'none';
        document.getElementById('reportStartDate').required = false;
        document.getElementById('reportEndDate').required = false;
    }
}

function generateBillReport(event) {
    event.preventDefault();
    
    const sortBy = document.getElementById('reportSortBy').value;
    const sortOrder = document.getElementById('reportSortOrder').value;
    const statusFilter = document.getElementById('reportStatusFilter').value;
    const vendorFilter = document.getElementById('reportVendorFilter').value;
    const categoryFilter = document.getElementById('reportCategoryFilter').value;
    const dateRange = document.getElementById('reportDateRange').value;
    const reportFormat = document.getElementById('reportFormat').value;
    
    // Filter bills based on criteria
    let filteredBills = [...bills];
    
    // Apply status filter
    if (statusFilter !== 'all') {
        if (statusFilter === 'Unpaid') {
            // Include both Pending and Overdue
            filteredBills = filteredBills.filter(bill => bill.status === 'Pending' || bill.status === 'Overdue');
        } else {
            filteredBills = filteredBills.filter(bill => bill.status === statusFilter);
        }
    }
    
    // Apply vendor filter
    if (vendorFilter !== 'all') {
        filteredBills = filteredBills.filter(bill => bill.vendorName === vendorFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        filteredBills = filteredBills.filter(bill => bill.category === categoryFilter);
    }
    
    // Apply date range filter
    if (dateRange !== 'all') {
        const now = new Date();
        let startDate, endDate;
        
        if (dateRange === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
        } else if (dateRange === 'week') {
            const day = now.getDay();
            startDate = new Date(now.setDate(now.getDate() - day));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.setDate(now.getDate() - day + 6));
            endDate.setHours(23, 59, 59, 999);
        } else if (dateRange === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (dateRange === 'quarter') {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        } else if (dateRange === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (dateRange === 'custom') {
            startDate = new Date(document.getElementById('reportStartDate').value);
            endDate = new Date(document.getElementById('reportEndDate').value);
            endDate.setHours(23, 59, 59, 999);
        }
        
        if (startDate && endDate) {
            filteredBills = filteredBills.filter(bill => {
                const billDate = new Date(bill.billDate);
                return billDate >= startDate && billDate <= endDate;
            });
        }
    }
    
    // Sort bills
    filteredBills.sort((a, b) => {
        let compareA, compareB;
        
        switch(sortBy) {
            case 'billDate':
                compareA = new Date(a.billDate);
                compareB = new Date(b.billDate);
                break;
            case 'dueDate':
                compareA = new Date(a.dueDate);
                compareB = new Date(b.dueDate);
                break;
            case 'paidDate':
                compareA = a.paidDate ? new Date(a.paidDate) : new Date('9999-12-31');
                compareB = b.paidDate ? new Date(b.paidDate) : new Date('9999-12-31');
                break;
            case 'vendor':
                compareA = a.vendorName.toLowerCase();
                compareB = b.vendorName.toLowerCase();
                break;
            case 'amount':
                compareA = a.amount;
                compareB = b.amount;
                break;
            case 'status':
                compareA = a.status.toLowerCase();
                compareB = b.status.toLowerCase();
                break;
            case 'category':
                compareA = (a.category || '').toLowerCase();
                compareB = (b.category || '').toLowerCase();
                break;
        }
        
        if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
        if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Generate report based on format
    if (reportFormat === 'csv') {
        generateBillCSVReport(filteredBills, sortBy, sortOrder, statusFilter, vendorFilter, categoryFilter);
    } else if (reportFormat === 'pdf') {
        generateBillPDFReport(filteredBills, sortBy, sortOrder, statusFilter, vendorFilter, categoryFilter);
    }
    
    hideBillReportDialog();
}

function generateBillCSVReport(bills, sortBy, sortOrder, statusFilter, vendorFilter, categoryFilter) {
    const formattedData = ExportUtility.formatBillsForExport(bills, vendors);
    const filename = `bill_report_${ExportUtility.getDateForFilename()}.csv`;
    ExportUtility.exportToCSV(formattedData, filename);
    
    alert(`Report generated successfully!\n\n${bills.length} bills exported\nSorted by: ${sortBy}\nOrder: ${sortOrder}\nStatus: ${statusFilter}\nVendor: ${vendorFilter}\nCategory: ${categoryFilter}`);
}

function generateBillPDFReport(bills, sortBy, sortOrder, statusFilter, vendorFilter, categoryFilter) {
    alert('PDF report generation coming soon!\n\nFor now, please use CSV format which can be opened in Excel.');
}

window.showBillReportDialog = showBillReportDialog;
window.hideBillReportDialog = hideBillReportDialog;
window.toggleCustomDateRangeBills = toggleCustomDateRangeBills;
window.generateBillReport = generateBillReport;

console.log('Consolidated bills management system loaded');
console.log('All bill management functions available');
console.log('Bill search functionality enabled');
console.log('Bill pagination enabled');
console.log('Bill reporting system enabled');